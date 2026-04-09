from typing import Optional
import logging

import torch
from atom.plugin.prepare import _set_framework_backbone
from atom.utils import envs
from atom.plugin.vllm.mla_patch import patch_vllm_mla_attention

logger = logging.getLogger("atom")

# this flag is used to enable the vllm plugin mode
disable_vllm_plugin = envs.ATOM_DISABLE_VLLM_PLUGIN
disable_vllm_plugin_attention = envs.ATOM_DISABLE_VLLM_PLUGIN_ATTENTION

# those 2 models are covering most of dense and moe models
ATOM_CAUSAL_LM_MODEL_WRAPPER = "atom.plugin.vllm.model_wrapper:ATOMForCausalLM"
ATOM_MOE_CAUSAL_LM_MODEL_WRAPPER = "atom.plugin.vllm.model_wrapper:ATOMMoEForCausalLM"

# when register new model to vllm, add here
# Keys is from hf config arch name
_VLLM_MODEL_REGISTRY_OVERRIDES: dict[str, str] = {
    "LlamaForCausalLM": ATOM_CAUSAL_LM_MODEL_WRAPPER,
    "Qwen3ForCausalLM": ATOM_CAUSAL_LM_MODEL_WRAPPER,
    "Qwen3MoeForCausalLM": ATOM_MOE_CAUSAL_LM_MODEL_WRAPPER,
    "GptOssForCausalLM": ATOM_MOE_CAUSAL_LM_MODEL_WRAPPER,
    "DeepseekV3ForCausalLM": ATOM_MOE_CAUSAL_LM_MODEL_WRAPPER,
    "Glm4MoeForCausalLM": ATOM_MOE_CAUSAL_LM_MODEL_WRAPPER,
    "Qwen3NextForCausalLM": "atom.models.qwen3_next:Qwen3NextForCausalLMVllm",
    "Qwen3_5ForConditionalGeneration": "atom.models.qwen3_5:Qwen3_5ForConditionalGeneration",
    "Qwen3_5MoeForConditionalGeneration": "atom.models.qwen3_5:Qwen3_5MoeForConditionalGeneration",
    "KimiK25ForConditionalGeneration": "atom.plugin.vllm.models.kimi_k25:KimiK25ForConditionalGeneration",
}


def _set_plugin_mode() -> None:
    _set_framework_backbone("vllm")


def register_platform() -> Optional[str]:

    if disable_vllm_plugin:
        # return None instead of error because the flag can be used to
        # run pure vllm mode without ATOM plugin
        logger.info("Disable ATOM OOT plugin platforms")
        return None

    _set_plugin_mode()
    _patch_vllm_gpu_model_runner_max_tokens()

    # return the ATOM platform to vllm
    return "atom.plugin.vllm.platform.ATOMPlatform"


def _patch_vllm_attention_process_weights_after_loading(attention) -> None:
    orig = attention.process_weights_after_loading

    if getattr(orig, "_atom_default_act_dtype_patched", False):
        return

    try:
        import inspect

        sig = inspect.signature(orig)
        act_dtype_param = sig.parameters.get("act_dtype")
        if (
            act_dtype_param is not None
            and act_dtype_param.default is not inspect._empty
        ):
            return
    except Exception:
        pass

    import functools

    @functools.wraps(orig)
    def wrapped(self, act_dtype: "torch.dtype" = torch.bfloat16):
        return orig(self, act_dtype)

    setattr(wrapped, "_atom_default_act_dtype_patched", True)
    attention.process_weights_after_loading = wrapped


def _patch_vllm_gpu_model_runner_max_tokens() -> None:
    try:
        from vllm.v1.worker.gpu_model_runner import GPUModelRunner
    except Exception:
        return

    orig_init = GPUModelRunner.__init__
    if getattr(orig_init, "_atom_dp_ep_token_cap_patched", False):
        return

    import functools

    @functools.wraps(orig_init)
    def wrapped(self, *args, **kwargs):
        orig_init(self, *args, **kwargs)

        token_cap = envs.ATOM_MORI_MAX_NUM_TOKENS_PER_DP_RANK
        if token_cap <= 0:
            return

        parallel_config = getattr(self, "parallel_config", None)
        if parallel_config is None:
            return

        use_dp_ep = (
            getattr(parallel_config, "enable_expert_parallel", False)
            and getattr(parallel_config, "data_parallel_size", 1) > 1
        )
        if not use_dp_ep:
            return

        if getattr(self, "max_num_tokens", 0) > token_cap:
            logger.warning(
                "Cap vLLM GPUModelRunner.max_num_tokens from %d to %d for OOT "
                "DP+EP startup warmup.",
                self.max_num_tokens,
                token_cap,
            )
            self.max_num_tokens = token_cap
            if getattr(self, "scheduler_config", None) is not None:
                self.scheduler_config.max_num_batched_tokens = min(
                    self.scheduler_config.max_num_batched_tokens,
                    token_cap,
                )

    setattr(wrapped, "_atom_dp_ep_token_cap_patched", True)
    GPUModelRunner.__init__ = wrapped

    orig_dummy_run = GPUModelRunner._dummy_run
    if not getattr(orig_dummy_run, "_atom_dp_ep_token_cap_patched", False):

        @functools.wraps(orig_dummy_run)
        def wrapped_dummy_run(self, num_tokens, *args, **kwargs):
            token_cap = envs.ATOM_MORI_MAX_NUM_TOKENS_PER_DP_RANK
            parallel_config = getattr(self, "parallel_config", None)
            use_dp_ep = (
                token_cap > 0
                and parallel_config is not None
                and getattr(parallel_config, "enable_expert_parallel", False)
                and getattr(parallel_config, "data_parallel_size", 1) > 1
                and num_tokens > token_cap
            )
            if use_dp_ep:
                logger.warning(
                    "Cap vLLM GPUModelRunner._dummy_run num_tokens from %d to %d "
                    "for OOT DP+EP startup warmup.",
                    num_tokens,
                    token_cap,
                )
                num_tokens = token_cap
            return orig_dummy_run(self, num_tokens, *args, **kwargs)

        setattr(wrapped_dummy_run, "_atom_dp_ep_token_cap_patched", True)
        GPUModelRunner._dummy_run = wrapped_dummy_run


def register_model() -> None:
    if disable_vllm_plugin:
        logger.info("Disable ATOM model register")
        return

    import vllm.model_executor.models.registry as vllm_model_registry

    any_updated = False
    for arch, qual in _VLLM_MODEL_REGISTRY_OVERRIDES.items():
        module_name, class_name = qual.split(":", 1)
        existing = vllm_model_registry.ModelRegistry.models.get(arch)
        if existing is not None:
            # If already overridden to the same target, skip re-registering.
            if (
                getattr(existing, "module_name", None) == module_name
                and getattr(existing, "class_name", None) == class_name
            ):
                continue

        logger.info(f"Register model {arch} to vLLM with {qual}")
        vllm_model_registry.ModelRegistry.register_model(arch, qual)
        any_updated = True

    # clear lru cache
    if any_updated:
        vllm_model_registry._try_load_model_cls.cache_clear()
        vllm_model_registry._try_inspect_model_cls.cache_clear()

    patch_vllm_mla_attention()
    # patch attention process weights after loading
    # to avoid the specific handle in ATOM loader
    try:
        from vllm.attention.layer import Attention, MLAAttention
    except ImportError:
        from vllm.model_executor.layers.attention import Attention, MLAAttention

    _patch_vllm_attention_process_weights_after_loading(Attention)
    _patch_vllm_attention_process_weights_after_loading(MLAAttention)
    _patch_vllm_gpu_model_runner_max_tokens()

    # Patch vLLM graph_capture to also enter aiter's ca_comm.capture(),
    # avoiding hipMemcpyAsync in fused_allreduce_rmsnorm when model uses aiter collectives
    from atom.plugin.vllm.graph_capture_patch import apply_graph_capture_patch

    apply_graph_capture_patch()
