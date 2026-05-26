"""ATOM vLLM platform integration.

This module contains the vLLM `Platform` subclass used in ATOM's vLLM plugin
mode. Keep platform behavior here so `register.py` can focus on registration
and wiring only.

The ATOMPlatform class is created lazily (on first attribute access) because
vLLM's subprocess model inspection imports this module without GPU access,
and ``from vllm.platforms.rocm import RocmPlatform`` triggers
``_get_gcn_arch()`` which requires a GPU.
"""

import logging

from atom.utils import envs

logger = logging.getLogger("atom")
# This flag is used to enable the vLLM plugin mode.
disable_vllm_plugin = envs.ATOM_DISABLE_VLLM_PLUGIN
disable_vllm_plugin_attention = envs.ATOM_DISABLE_VLLM_PLUGIN_ATTENTION

_ATOMPlatform = None


def _build_atom_platform_cls():
    from vllm.platforms.rocm import RocmPlatform

    class ATOMPlatform(RocmPlatform):
        @classmethod
        def get_attn_backend_cls(
            cls, selected_backend, attn_selector_config, num_heads
        ) -> str:
            if disable_vllm_plugin_attention:
                logger.info("Fallback to original vLLM attention backend")
                return super().get_attn_backend_cls(
                    selected_backend, attn_selector_config, num_heads
                )

            logger.info("Use atom attention backend")
            if attn_selector_config.use_mla:
                if getattr(attn_selector_config, "use_sparse", False):
                    return "atom.plugin.vllm.attention_backend.mla_sparse.AiterMLASparseBackend"
                return "atom.model_ops.attentions.aiter_mla.AiterMLABackend"
            return "atom.model_ops.attentions.aiter_attention.AiterBackend"

    return ATOMPlatform


def __getattr__(name):
    global _ATOMPlatform
    if name == "ATOMPlatform":
        if disable_vllm_plugin:
            return None
        if _ATOMPlatform is None:
            _ATOMPlatform = _build_atom_platform_cls()
        return _ATOMPlatform
    raise AttributeError(f"module {__name__!r} has no attribute {name!r}")
