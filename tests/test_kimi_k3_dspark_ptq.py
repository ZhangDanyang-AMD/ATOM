"""CPU tests for Kimi-K3 DSpark checkpoint-local PTPC configuration."""

from types import SimpleNamespace

import pytest
import torch
from aiter import dtypes
from torch import nn
from transformers import AutoConfig

from atom.config import QuantizationConfig
from atom.model_loader.native_dspark import (
    ATOM_K3_DSPARK_ARCHITECTURE,
    ATOM_K3_DSPARK_FORMAT,
    validate_atom_native_dspark_config,
)
from atom.model_loader.weight_dispatch import WeightDispatcher
from atom.model_ops import linear as linear_ops
from atom.model_ops.linear import MergedReplicatedLinear, ReplicatedLinear
from atom.models.kimi_k3_dspark import K3DSparkMLAAttention
from atom.spec_decode.dspark_proposer import DSparkProposer


def _quark_ptpc_config(*, phase1: bool) -> dict:
    config = {
        "quant_method": "quark",
        "global_quant_config": {
            "weight": {"qscheme": "per_channel", "dtype": "fp8_e4m3"},
            "input_tensors": {"is_dynamic": True},
        },
    }
    if phase1:
        config["exclude"] = [
            "context_proj",
            "layers.*.self_attn.fused_qkv_a_proj",
        ]
    return config


def _quark_mxfp4_config() -> dict:
    return {
        "quant_method": "quark",
        "global_quant_config": {
            "weight": {"qscheme": "per_group", "dtype": "fp4_e2m1"},
            "input_tensors": {"is_dynamic": True},
        },
        "exclude": [
            "context_proj",
            "layers.*.self_attn.fused_qkv_a_proj",
        ],
    }


def _quark_mixed_config(*mxfp4_patterns: str) -> dict:
    mxfp4_spec = {
        "weight": {"qscheme": "per_group", "dtype": "fp4_e2m1"},
        "input_tensors": {"is_dynamic": True},
    }
    return {
        "quant_method": "quark",
        "global_quant_config": {
            "weight": {"qscheme": "per_channel", "dtype": "fp8_e4m3"},
            "input_tensors": {"is_dynamic": True},
        },
        "layer_quant_config": {
            pattern: mxfp4_spec for pattern in mxfp4_patterns
        },
        "exclude": [
            "context_proj",
            "layers.*.self_attn.fused_qkv_a_proj",
        ],
    }


def _native_metadata() -> dict:
    return {
        "format": ATOM_K3_DSPARK_FORMAT,
        "format_version": 1,
        "weight_layout": "logical_global_unshuffled",
        "fp8_dtype": "float8_e4m3fn",
        "fp8_storage_dtype": "float8_e4m3fn",
        "scale_layout": "global_per_output_channel_fp32",
        "runtime_tp_slice": True,
        "runtime_preshuffle": True,
        "context_kv_proj": {
            "source": "kv_a_proj_with_mqa",
            "fused_rows": [1536, 2112],
            "shape": [576, 7168],
            "dtype": "bfloat16",
        },
        "merged_projections": {
            "gate_up_proj": {
                "sources": ["gate_proj", "up_proj"],
                "axis": 0,
            },
            "fused_qkv_a_proj": {
                "sources": ["q_a_proj", "kv_a_proj_with_mqa"],
                "axis": 0,
            },
        },
    }


def _native_hf_config() -> SimpleNamespace:
    quant_config = _quark_ptpc_config(phase1=True)
    quant_config["exclude"].insert(
        1, "layers.*.self_attn.context_kv_proj"
    )
    return SimpleNamespace(
        model_type="atom_k3_dspark",
        architectures=[ATOM_K3_DSPARK_ARCHITECTURE],
        torch_dtype=torch.bfloat16,
        quantization_config=quant_config,
        atom_native_checkpoint=_native_metadata(),
    )


def _runtime_linear_names() -> list[str]:
    names = []
    for layer_idx in range(5):
        prefix = f"layers.{layer_idx}"
        names.extend(
            [
                f"{prefix}.mlp.gate_up_proj",
                f"{prefix}.mlp.down_proj",
                f"{prefix}.self_attn.q_b_proj",
                f"{prefix}.self_attn.kv_b_proj",
                f"{prefix}.self_attn.o_proj",
            ]
        )
    return names


def test_phase1_quantizes_only_requested_runtime_linears() -> None:
    hf_config = SimpleNamespace(
        torch_dtype=torch.bfloat16,
        quantization_config=_quark_ptpc_config(phase1=True),
    )
    quant_config = QuantizationConfig(hf_config)

    selected = _runtime_linear_names()
    assert len(selected) == 25
    for name in selected:
        layer_config = quant_config.get_layer_quant_config(name)
        assert layer_config.quant_type.name == "per_Token"
        assert layer_config.is_dynamic is True

    assert quant_config.get_layer_quant_config("context_proj").quant_type.name == "No"
    for layer_idx in range(5):
        name = f"layers.{layer_idx}.self_attn.fused_qkv_a_proj"
        assert quant_config.get_layer_quant_config(name).quant_type.name == "No"


def test_phase2_adds_a_and_context_projections() -> None:
    hf_config = SimpleNamespace(
        torch_dtype=torch.bfloat16,
        quantization_config=_quark_ptpc_config(phase1=False),
    )
    quant_config = QuantizationConfig(hf_config)

    names = _runtime_linear_names()
    names.append("context_proj")
    names.extend(
        f"layers.{layer_idx}.self_attn.fused_qkv_a_proj"
        for layer_idx in range(5)
    )
    assert len(names) == 31
    for name in names:
        assert quant_config.get_layer_quant_config(name).quant_type.name == "per_Token"


def test_mxfp4_checkpoint_selects_dynamic_a4w4_gemm(monkeypatch) -> None:
    hf_config = SimpleNamespace(
        torch_dtype=torch.bfloat16,
        quantization_config=_quark_mxfp4_config(),
    )
    quant_config = QuantizationConfig(hf_config)
    layer_config = quant_config.get_layer_quant_config(
        "layers.0.self_attn.q_b_proj"
    )
    assert layer_config.quant_type.name == "per_1x32"
    assert layer_config.quant_dtype == dtypes.fp4x2
    assert layer_config.is_dynamic is True

    monkeypatch.setattr(
        linear_ops,
        "get_tp_group",
        lambda: SimpleNamespace(rank_in_group=0, world_size=1),
    )
    linear = ReplicatedLinear(
        32,
        32,
        quant_config=quant_config,
        prefix="layers.0.self_attn.q_b_proj",
    )
    calls = []

    def fake_gemm_a4w4_quant(
        x,
        x_scale,
        weight,
        otype,
        weight_scale,
        params_dtype,
        input_scale,
        output_size,
    ):
        calls.append((x_scale, params_dtype, input_scale))
        return torch.zeros(x.shape[0], output_size, dtype=otype)

    monkeypatch.setattr(linear_ops, "gemm_a4w4_quant", fake_gemm_a4w4_quant)
    output = linear(torch.ones(2, 32, dtype=torch.bfloat16))

    assert output.shape == (2, 32)
    assert calls == [(None, dtypes.fp4x2, None)]


def test_mixed_checkpoint_selects_gemm_per_projection(monkeypatch) -> None:
    hf_config = SimpleNamespace(
        torch_dtype=torch.bfloat16,
        quantization_config=_quark_mixed_config(
            "layers.*.mlp.gate_up_proj",
            "layers.*.mlp.down_proj",
        ),
    )
    quant_config = QuantizationConfig(hf_config)
    mlp_config = quant_config.get_layer_quant_config("layers.0.mlp.down_proj")
    attention_config = quant_config.get_layer_quant_config(
        "layers.0.self_attn.q_b_proj"
    )

    assert mlp_config.quant_type.name == "per_1x32"
    assert mlp_config.quant_dtype == dtypes.fp4x2
    assert mlp_config.is_dynamic is True
    assert attention_config.quant_type.name == "per_Token"
    assert attention_config.quant_dtype == dtypes.fp8
    assert attention_config.is_dynamic is True

    monkeypatch.setattr(
        linear_ops,
        "get_tp_group",
        lambda: SimpleNamespace(rank_in_group=0, world_size=1),
    )
    linear = ReplicatedLinear(
        32,
        32,
        quant_config=quant_config,
        prefix="layers.0.mlp.down_proj",
    )
    calls = []

    def fake_gemm_a4w4_quant(
        x,
        x_scale,
        weight,
        otype,
        weight_scale,
        params_dtype,
        input_scale,
        output_size,
    ):
        calls.append((x_scale, params_dtype, input_scale))
        return torch.zeros(x.shape[0], output_size, dtype=otype)

    monkeypatch.setattr(linear_ops, "gemm_a4w4_quant", fake_gemm_a4w4_quant)
    output = linear(torch.ones(2, 32, dtype=torch.bfloat16))

    assert output.shape == (2, 32)
    assert calls == [(None, dtypes.fp4x2, None)]


def test_standalone_dspark_uses_checkpoint_local_quant_config() -> None:
    draft_hf = SimpleNamespace(
        architectures=["K3DSparkModel"],
        torch_dtype=torch.bfloat16,
        quantization_config=_quark_ptpc_config(phase1=True),
        kv_lora_rank=512,
    )
    parent_quant_config = object()
    proposer = object.__new__(DSparkProposer)
    proposer.speculative_config = SimpleNamespace(
        draft_model_hf_config=draft_hf,
        use_dspark_with_draft=lambda: True,
    )
    proposer.config = SimpleNamespace(
        hf_config=SimpleNamespace(num_hidden_layers=93),
        compilation_config=SimpleNamespace(level=None),
        quant_config=parent_quant_config,
        online_quant_config={"global_quant_config": "mxfp4"},
    )

    class DraftModel:
        def __init__(self, atom_config, layer_offset):
            self.atom_config = atom_config
            self.layer_offset = layer_offset

    model = proposer._build_draft_model(DraftModel)

    assert model.layer_offset == 93
    assert model.atom_config.quant_config is not parent_quant_config
    assert model.atom_config.quant_config.quant_method == "quark"
    assert model.atom_config.online_quant_config is None


def test_bf16_kimi_dspark_preserves_existing_config_path() -> None:
    draft_hf = SimpleNamespace(
        architectures=["K3DSparkModel"],
        torch_dtype=torch.bfloat16,
        quantization_config=None,
        kv_lora_rank=512,
    )
    parent_quant_config = object()
    proposer = object.__new__(DSparkProposer)
    proposer.speculative_config = SimpleNamespace(
        draft_model_hf_config=draft_hf,
        use_dspark_with_draft=lambda: True,
    )
    proposer.config = SimpleNamespace(
        hf_config=SimpleNamespace(num_hidden_layers=93),
        compilation_config=SimpleNamespace(level=None),
        quant_config=parent_quant_config,
        online_quant_config={"global_quant_config": "mxfp4"},
    )

    class DraftModel:
        def __init__(self, atom_config, layer_offset):
            self.atom_config = atom_config

    model = proposer._build_draft_model(DraftModel)

    assert model.atom_config.quant_config is parent_quant_config
    assert model.atom_config.online_quant_config == {
        "global_quant_config": "mxfp4"
    }


def test_native_dspark_contract_is_atom_only_and_fail_closed() -> None:
    config = _native_hf_config()

    native = validate_atom_native_dspark_config(config)

    assert native["runtime_tp_slice"] is True
    assert native["runtime_preshuffle"] is True
    with pytest.raises(ValueError):
        AutoConfig.for_model("atom_k3_dspark")

    config.atom_native_checkpoint = dict(native)
    config.atom_native_checkpoint["fp8_dtype"] = "float8_e4m3fnuz"
    with pytest.raises(ValueError, match="fp8_dtype"):
        validate_atom_native_dspark_config(config)


def test_native_fused_replicated_weight_loads_without_source_shard_id(
    monkeypatch,
) -> None:
    monkeypatch.setattr(
        linear_ops,
        "get_tp_group",
        lambda: SimpleNamespace(rank_in_group=0, world_size=1),
    )
    linear = MergedReplicatedLinear(4, [3, 2], prefix="fused_qkv_a_proj")
    fused = torch.arange(20, dtype=torch.float32).reshape(5, 4).to(torch.bfloat16)

    linear.weight_loader(linear.weight, fused)

    torch.testing.assert_close(linear.weight, fused, rtol=0, atol=0)


def test_native_exact_runtime_name_bypasses_packed_substring_mapping() -> None:
    name = "layers.0.mlp.gate_up_proj.weight"
    dispatcher = object.__new__(WeightDispatcher)
    dispatcher.params_dict = {name: object()}
    dispatcher.packed_modules_mapping = {
        "gate_proj": ("gate_up_proj", 0),
        "up_proj": ("gate_up_proj", 1),
    }

    claimed = dispatcher._dispatch_packed(name, name, torch.empty(1))

    assert claimed is False


def test_native_e4m3fn_keeps_runtime_tp_preshuffle(
    monkeypatch,
) -> None:
    monkeypatch.setattr(
        linear_ops,
        "get_tp_group",
        lambda: SimpleNamespace(rank_in_group=0, world_size=1),
    )
    quant_config = QuantizationConfig(_native_hf_config())
    linear = ReplicatedLinear(
        32,
        32,
        quant_config=quant_config,
        prefix="layers.0.self_attn.q_b_proj",
    )
    calls: list[str] = []

    def fail_normalize(*args, **kwargs):
        raise AssertionError("native FNUZ weights must not be normalized twice")

    def record_shuffle(*weights, **kwargs):
        calls.append("shuffle")
        for weight in weights:
            weight.is_shuffled = True

    monkeypatch.setattr(
        linear_ops, "normalize_e4m3fn_to_e4m3fnuz", fail_normalize
    )
    monkeypatch.setattr(linear_ops, "shuffle_weights", record_shuffle)
    monkeypatch.setattr(linear_ops, "use_triton_gemm", lambda: False)

    storage = torch.randn(32, 32).to(torch.float8_e4m3fn)
    weight_scale = torch.full((32, 1), 2.0)
    linear.weight_loader(linear.weight, storage)
    linear.weight_loader(linear.weight_scale, weight_scale)
    torch.testing.assert_close(
        linear.weight.view(torch.uint8), storage.view(torch.uint8), rtol=0, atol=0
    )
    torch.testing.assert_close(linear.weight_scale, weight_scale, rtol=0, atol=0)
    linear.process_weights_after_loading()

    assert calls == ["shuffle"]
    assert linear.weight.is_shuffled is True


def test_native_context_projection_matches_old_fused_slice() -> None:
    attention = object.__new__(K3DSparkMLAAttention)
    nn.Module.__init__(attention)
    attention.q_lora_rank = 4
    attention.fused_qkv_a_proj = nn.Linear(3, 6, bias=False)
    attention.context_kv_proj = nn.Linear(3, 2, bias=False)
    attention.context_kv_proj.weight.data.copy_(
        attention.fused_qkv_a_proj.weight.data[4:]
    )
    captured: list[torch.Tensor] = []

    class Impl:
        @staticmethod
        def write_context_kv_latent(
            kv_cache,
            kv_lora,
            positions,
            slot_mapping,
            layernorm,
        ):
            captured.append(kv_lora)

    attention.kv_a_layernorm = nn.Identity()
    attention.mla_attn = SimpleNamespace(
        impl=Impl(),
        kv_cache=torch.empty(0),
    )
    hidden = torch.randn(5, 3)
    positions = torch.arange(5)
    slots = torch.arange(5)

    attention.context_kv_proj = None
    attention.write_context_kv(hidden, positions, slots)
    portable = captured.pop()
    attention.context_kv_proj = nn.Linear(3, 2, bias=False)
    attention.context_kv_proj.weight.data.copy_(
        attention.fused_qkv_a_proj.weight.data[4:]
    )
    attention.write_context_kv(hidden, positions, slots)
    native = captured.pop()

    torch.testing.assert_close(native, portable, rtol=0, atol=0)

