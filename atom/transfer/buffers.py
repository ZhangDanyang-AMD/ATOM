import logging
import threading
from concurrent.futures import Future, ThreadPoolExecutor
from typing import Any, Dict, List, Optional

import torch

logger = logging.getLogger("atom")


class HostBuffer:
    def __init__(self, size: int):
        self.size = size
        self._tensor = torch.empty(size, dtype=torch.uint8, pin_memory=True)
        self._ptr = self._tensor.data_ptr()

    @property
    def ptr(self) -> int:
        return self._ptr

    def copy_from_tensor(self, tensor: torch.Tensor, offset: int = 0) -> int:
        tensor = tensor.contiguous()
        nbytes = tensor.numel() * tensor.element_size()
        if offset + nbytes > self.size:
            raise ValueError(f"Buffer overflow: need {offset + nbytes}, have {self.size}")
        host_view = self._tensor[offset : offset + nbytes]
        host_view.copy_(tensor.view(torch.uint8).view(-1))
        return nbytes

    def free(self) -> None:
        if self._tensor is not None:
            del self._tensor
            self._tensor = None
            self._ptr = 0

    def __del__(self):
        self.free()


class HostBufferPool:
    def __init__(self, buffer_size: int = 4 * 1024**3, pool_size: int = 2):
        self.buffer_size = buffer_size
        self.pool_size = pool_size
        self._buffers: List[HostBuffer] = []
        self._current_idx = 0

    def initialize(self) -> None:
        for _ in range(self.pool_size):
            self._buffers.append(HostBuffer(self.buffer_size))
        logger.info(
            "Initialized host buffer pool: %s x %.1fGB",
            self.pool_size,
            self.buffer_size / (1024**3),
        )

    def get_buffer(self) -> HostBuffer:
        if not self._buffers:
            self.initialize()
        buf = self._buffers[self._current_idx]
        self._current_idx = (self._current_idx + 1) % len(self._buffers)
        return buf

    def shutdown(self) -> None:
        for buf in self._buffers:
            buf.free()
        self._buffers.clear()


class AsyncPutManager:
    def __init__(self, store: Any, max_workers: int = 1, replicate_config: Any = None):
        self._store = store
        self._replicate_config = replicate_config
        self._executor = ThreadPoolExecutor(max_workers=max_workers, thread_name_prefix="async_put")
        self._in_flight: Dict[int, Future] = {}
        self._last_error: Optional[BaseException] = None
        self._put_lock = threading.Lock()

    def check_last_error(self) -> None:
        if self._last_error is not None:
            err = self._last_error
            self._last_error = None
            raise err

    def wait_for_buffer(self, buffer_ptr: int) -> None:
        future = self._in_flight.pop(buffer_ptr, None)
        if future is None:
            return
        try:
            future.result()
        except Exception as exc:
            self._last_error = exc
            raise

    def submit(
        self,
        keys: List[str],
        buffer_ptrs: List[int],
        sizes: List[int],
        owner_buffer_ptr: int,
        wait_event: Optional[Any] = None,
        device_index: Optional[int] = None,
    ) -> None:
        future = self._executor.submit(
            self._do_put, keys, buffer_ptrs, sizes, wait_event, device_index
        )
        self._in_flight[owner_buffer_ptr] = future

    def _do_put(
        self,
        keys: List[str],
        buffer_ptrs: List[int],
        sizes: List[int],
        wait_event: Optional[Any] = None,
        device_index: Optional[int] = None,
    ) -> None:
        if wait_event is not None:
            if device_index is not None:
                torch.cuda.set_device(device_index)
            wait_event.synchronize()
        with self._put_lock:
            if self._replicate_config is not None:
                results = self._store.batch_put_from(
                    keys, buffer_ptrs, sizes, config=self._replicate_config
                )
            else:
                results = self._store.batch_put_from(keys, buffer_ptrs, sizes)
        failures = [(k, r) for k, r in zip(keys, results) if r != 0]
        if failures:
            try:
                self._store.batch_remove(keys, force=True)
            except Exception:
                logger.warning(
                    "Failed to cleanup keys after async batch_put_from failure: %s",
                    keys,
                    exc_info=True,
                )
            detail = ", ".join(f"{k} (code={r})" for k, r in failures)
            raise RuntimeError(f"async batch_put_from failed: {detail}")

    def drain(self) -> None:
        for ptr, future in list(self._in_flight.items()):
            try:
                future.result()
            except Exception as exc:
                if self._last_error is None:
                    self._last_error = exc
                logger.warning("async put error during drain: %s", exc)
        self._in_flight.clear()

    def shutdown(self) -> None:
        self.drain()
        self._executor.shutdown(wait=True)


class _GPUBuffer:
    _label: str = "GPU"

    def __init__(self, size: int, device: torch.device = None):
        self.size = size
        self.device = torch.device(device) if device is not None else torch.device("cuda")
        self._tensor: Optional[torch.Tensor] = None
        self._ptr: int = 0
        self._initialized = False

    def initialize(self) -> None:
        if self._initialized:
            return
        self._tensor = torch.empty(self.size, dtype=torch.uint8, device=self.device)
        self._ptr = self._tensor.data_ptr()
        self._initialized = True
        logger.info(
            "Initialized %s buffer: %.1fMB on %s",
            self._label,
            self.size / (1024**2),
            self.device,
        )

    @property
    def ptr(self) -> int:
        return self._ptr

    def free(self) -> None:
        if self._tensor is not None:
            del self._tensor
            self._tensor = None
            self._ptr = 0
            self._initialized = False

    def __del__(self):
        self.free()


class GPUReceiveBuffer(_GPUBuffer):
    _label = "GPU receive"

    def get_slice(self, offset: int, size: int) -> torch.Tensor:
        if not self._initialized:
            raise RuntimeError("GPU buffer not initialized")
        return self._tensor[offset : offset + size]


class GPUSendBuffer(_GPUBuffer):
    _label = "GPU send"

    def copy_from_tensor(self, tensor: torch.Tensor, offset: int = 0) -> int:
        if not self._initialized:
            raise RuntimeError("GPU send buffer not initialized")
        tensor = tensor.contiguous()
        nbytes = tensor.numel() * tensor.element_size()
        if offset + nbytes > self.size:
            raise ValueError(f"Buffer overflow: need {offset + nbytes}, have {self.size}")
        gpu_view = self._tensor[offset : offset + nbytes]
        gpu_view.copy_(tensor.view(torch.uint8).view(-1))
        return nbytes
