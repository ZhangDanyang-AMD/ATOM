import pytest
import torch

from atom.model_ops.dspark_markov_sample import dspark_markov_argmax


@pytest.mark.skipif(not torch.cuda.is_available(), reason="requires ROCm")
def test_fused_markov_argmax_handles_nan_rows_without_invalid_ids() -> None:
    rows, vocab_size, rank = 3, 257, 64
    device = torch.device("cuda")
    base_logits = torch.zeros(
        rows, vocab_size, dtype=torch.bfloat16, device=device
    )
    markov_embed = torch.zeros(rows, rank, dtype=torch.bfloat16, device=device)
    markov_w2 = torch.zeros(vocab_size, rank, dtype=torch.bfloat16, device=device)

    base_logits[0].fill_(float("nan"))
    base_logits[1, 201] = float("nan")
    base_logits[2, 0] = float("inf")
    base_logits[2, 200] = float("nan")

    actual = dspark_markov_argmax(base_logits, markov_embed, markov_w2)
    expected = (
        base_logits + markov_embed.float().matmul(markov_w2.float().t())
    ).argmax(dim=-1)

    torch.testing.assert_close(actual, expected)
    assert bool(torch.all((actual >= 0) & (actual < vocab_size)))
