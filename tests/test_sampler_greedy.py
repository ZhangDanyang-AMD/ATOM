import torch

from atom.model_ops.sampler import Sampler


def test_unfiltered_greedy_sampling_is_exact_argmax(monkeypatch):
    sampler = Sampler()
    logits = torch.tensor(
        [
            [0.1, 2.0, 1.9],
            [4.0, -1.0, 3.0],
        ]
    )

    def fail_if_random_sampling_runs(*args, **kwargs):
        raise AssertionError("greedy sampling must not consume random noise")

    monkeypatch.setattr(sampler, "_temperature_sample", fail_if_random_sampling_runs)

    sampled = sampler(
        logits,
        temperatures=torch.full((2,), 1e-10),
        top_ks=None,
        top_ps=None,
        all_greedy=True,
    )

    torch.testing.assert_close(sampled, torch.tensor([1, 0], dtype=torch.int))
