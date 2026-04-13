from __future__ import annotations

from dataclasses import dataclass
from typing import Optional

import torch


@dataclass(frozen=True)
class MoriDispatchRuntimeMeta:
    exact_valid_rows: Optional[int]
    padded_global_tokens: Optional[int]


def _is_stream_capturing() -> bool:
    try:
        return torch.cuda.is_current_stream_capturing()
    except Exception:
        return False


def _try_get_exact_valid_rows(dispatch_recv_token_num: torch.Tensor) -> Optional[int]:
    if dispatch_recv_token_num.numel() == 0 or _is_stream_capturing():
        return None
    return int(dispatch_recv_token_num.reshape(-1)[0].item())


def _try_get_padded_global_tokens_from_vllm() -> Optional[int]:
    from vllm.forward_context import (
        get_forward_context,
        is_forward_context_available,
    )

    if not is_forward_context_available():
        return None

    ctx = get_forward_context()

    dp_metadata = getattr(ctx, "dp_metadata", None)
    if dp_metadata is not None:
        num_tokens_across_dp_cpu = getattr(
            dp_metadata, "num_tokens_across_dp_cpu", None
        )
        if num_tokens_across_dp_cpu is not None:
            try:
                return int(num_tokens_across_dp_cpu.sum().item())
            except Exception:
                return None

    batch_descriptor = getattr(ctx, "batch_descriptor", None)
    if batch_descriptor is not None:
        try:
            return int(batch_descriptor.num_tokens)
        except Exception:
            return None

    return None


def get_mori_dispatch_runtime_meta(
    dispatch_recv_token_num: torch.Tensor,
) -> MoriDispatchRuntimeMeta:
    return MoriDispatchRuntimeMeta(
        exact_valid_rows=_try_get_exact_valid_rows(dispatch_recv_token_num),
        padded_global_tokens=_try_get_padded_global_tokens_from_vllm(),
    )


def trim_vllm_mori_dispatch_tensors(
    dispatch_a1: torch.Tensor,
    dispatch_scale: torch.Tensor | None,
    dispatch_ids: torch.Tensor,
    dispatch_weights: torch.Tensor,
    dispatch_recv_token_num: torch.Tensor,
) -> tuple[torch.Tensor, torch.Tensor | None, torch.Tensor, torch.Tensor]:
    meta = get_mori_dispatch_runtime_meta(dispatch_recv_token_num)
    # Prefer vLLM's DP-coordinated padded token count so OOT trimming follows
    # the same stable runtime shape contract in eager and cudagraph paths.
    valid_rows = meta.padded_global_tokens
    if valid_rows is None:
        # Fallback to MORI's exact recv count only when vLLM runtime metadata
        # is unavailable.
        valid_rows = meta.exact_valid_rows
    if valid_rows is None:
        return dispatch_a1, dispatch_scale, dispatch_ids, dispatch_weights

    valid_rows = max(0, min(valid_rows, dispatch_a1.shape[0]))
    if valid_rows == 0 or valid_rows >= dispatch_a1.shape[0]:
        return dispatch_a1, dispatch_scale, dispatch_ids, dispatch_weights

    dispatch_a1 = dispatch_a1[:valid_rows]
    dispatch_ids = dispatch_ids[:valid_rows]
    dispatch_weights = dispatch_weights[:valid_rows]
    if dispatch_scale is not None:
        dispatch_scale = dispatch_scale[:valid_rows]
    return dispatch_a1, dispatch_scale, dispatch_ids, dispatch_weights
