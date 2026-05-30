import logging

logger = logging.getLogger("atom")


def _format_bytes(size: int) -> str:
    if size < 0:
        return f"{size}B"
    units = ["B", "KB", "MB", "GB", "TB"]
    value = float(size)
    for unit in units:
        if value < 1024 or unit == units[-1]:
            return f"{value:.1f}{unit}"
        value /= 1024


def calculate_eagle3_buffer_size(
    max_seq_len: int,
    batch_size: int,
    hidden_dim: int,
    num_aux_layers: int = 3,
    include_last_hidden_states: bool = True,
    safety_margin: float = 1.1,
) -> int:
    bfloat16_size = 2
    int64_size = 8

    hidden_states_size = batch_size * max_seq_len * hidden_dim * num_aux_layers * bfloat16_size
    input_ids_size = batch_size * max_seq_len * int64_size

    total = hidden_states_size + input_ids_size

    if include_last_hidden_states:
        last_hidden_states_size = batch_size * max_seq_len * hidden_dim * bfloat16_size
        total += last_hidden_states_size

    total_with_margin = int(total * safety_margin)

    alignment = 256
    aligned_size = ((total_with_margin + alignment - 1) // alignment) * alignment

    logger.debug(
        "Calculated Eagle3 buffer size: %.1fMB (seq=%s, batch=%s, hidden=%s)",
        aligned_size / (1024**2),
        max_seq_len,
        batch_size,
        hidden_dim,
    )

    return aligned_size
