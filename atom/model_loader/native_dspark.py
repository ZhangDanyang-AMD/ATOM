# SPDX-License-Identifier: MIT
# Copyright (C) 2026, Advanced Micro Devices, Inc. All rights reserved.

"""Fail-closed contract for ATOM-native Kimi-K3 DSpark checkpoints."""

from __future__ import annotations

from collections.abc import Mapping
from typing import Any


ATOM_K3_DSPARK_MODEL_TYPE = "atom_k3_dspark"
ATOM_K3_DSPARK_ARCHITECTURE = "AtomK3DSparkModel"
ATOM_K3_DSPARK_FORMAT = "atom_k3_dspark_fp8"
ATOM_K3_DSPARK_FORMAT_VERSION = 1
ATOM_K3_DSPARK_WEIGHT_LAYOUT = "logical_global_unshuffled"
ATOM_K3_DSPARK_FP8_DTYPE = "float8_e4m3fn"
ATOM_K3_DSPARK_FP8_STORAGE_DTYPE = "float8_e4m3fn"
ATOM_K3_DSPARK_SCALE_LAYOUT = "global_per_output_channel_fp32"

_REQUIRED_MERGED_PROJECTIONS = frozenset({"gate_up_proj", "fused_qkv_a_proj"})


def _as_mapping(value: Any, field: str) -> Mapping[str, Any]:
    if not isinstance(value, Mapping):
        raise ValueError(
            f"ATOM-native DSpark requires {field} to be an object, got "
            f"{type(value).__name__}."
        )
    return value


def validate_atom_native_dspark_config(hf_config: Any) -> Mapping[str, Any]:
    """Validate and return an ATOM-native DSpark checkpoint contract.

    The validation runs during model construction, before any tensor is read.
    Native bytes must never be interpreted as a portable checkpoint when a
    producer/consumer field is missing or unknown.
    """

    model_type = getattr(hf_config, "model_type", None)
    architectures = getattr(hf_config, "architectures", None)
    if model_type != ATOM_K3_DSPARK_MODEL_TYPE:
        raise ValueError(
            "AtomK3DSparkModel requires model_type="
            f"{ATOM_K3_DSPARK_MODEL_TYPE!r}, got {model_type!r}."
        )
    if architectures != [ATOM_K3_DSPARK_ARCHITECTURE]:
        raise ValueError(
            "ATOM-native DSpark requires architectures="
            f"[{ATOM_K3_DSPARK_ARCHITECTURE!r}], got {architectures!r}."
        )

    native = _as_mapping(
        getattr(hf_config, "atom_native_checkpoint", None),
        "atom_native_checkpoint",
    )
    expected_scalars = {
        "format": ATOM_K3_DSPARK_FORMAT,
        "format_version": ATOM_K3_DSPARK_FORMAT_VERSION,
        "weight_layout": ATOM_K3_DSPARK_WEIGHT_LAYOUT,
        "fp8_dtype": ATOM_K3_DSPARK_FP8_DTYPE,
        "fp8_storage_dtype": ATOM_K3_DSPARK_FP8_STORAGE_DTYPE,
        "scale_layout": ATOM_K3_DSPARK_SCALE_LAYOUT,
        "runtime_tp_slice": True,
        "runtime_preshuffle": True,
    }
    for field, expected in expected_scalars.items():
        actual = native.get(field)
        if actual != expected:
            raise ValueError(
                f"Unsupported ATOM-native DSpark {field}: expected "
                f"{expected!r}, got {actual!r}."
            )

    merged = _as_mapping(native.get("merged_projections"), "merged_projections")
    missing = sorted(_REQUIRED_MERGED_PROJECTIONS - set(merged))
    if missing:
        raise ValueError(
            "ATOM-native DSpark metadata is missing merged projection "
            f"descriptor(s): {missing}."
        )
    expected_merged = {
        "gate_up_proj": {
            "sources": ["gate_proj", "up_proj"],
            "axis": 0,
        },
        "fused_qkv_a_proj": {
            "sources": ["q_a_proj", "kv_a_proj_with_mqa"],
            "axis": 0,
        },
    }
    for name, expected in expected_merged.items():
        if merged.get(name) != expected:
            raise ValueError(
                f"Invalid ATOM-native DSpark {name} descriptor: expected "
                f"{expected!r}, got {merged.get(name)!r}."
            )

    context_kv = _as_mapping(native.get("context_kv_proj"), "context_kv_proj")
    expected_context_kv = {
        "source": "kv_a_proj_with_mqa",
        "fused_rows": [1536, 2112],
        "shape": [576, 7168],
        "dtype": "bfloat16",
    }
    if dict(context_kv) != expected_context_kv:
        raise ValueError(
            "Invalid ATOM-native DSpark context_kv_proj descriptor: expected "
            f"{expected_context_kv!r}, got {dict(context_kv)!r}."
        )
    return native


def is_atom_native_dspark_config(hf_config: Any) -> bool:
    """Return whether the config selects the ATOM-native DSpark architecture."""

    return (
        getattr(hf_config, "model_type", None) == ATOM_K3_DSPARK_MODEL_TYPE
        or (getattr(hf_config, "architectures", None) or [None])[0]
        == ATOM_K3_DSPARK_ARCHITECTURE
    )
