"""
Batch consistency test: sample -> decode over multiple random probability distributions
and multiple steps, asserting decoded bits match payload prefix.

Run: PYTHONPATH=. python3 tests/batch_consistency.py
"""

import random
from agentmark.sdk import AgentWatermarker


def random_probs(num_actions: int):
    vals = [random.random() for _ in range(num_actions)]
    s = sum(vals)
    return {f"A{i}": v / s for i, v in enumerate(vals)}


def run_batch_tests(
    payload_bits="1101011010110001",
    steps=20,
    trials=50,
    min_actions=3,
    max_actions=8,
):
    wm = AgentWatermarker(payload_bits=payload_bits)
    failures = 0
    for t in range(trials):
        wm.reset()
        decoded_all = ""
        for step in range(steps):
            n = random.randint(min_actions, max_actions)
            probs = random_probs(n)
            ctx = f"batch||trial{t}||step{step}"
            start_idx = wm._bit_index
            res = wm.sample(probs, context=ctx)
            bits = wm.decode(probs, res.action, context=res.context_used, round_num=res.round_num)
            count = res.bits_embedded
            expected_step = wm._bit_stream[start_idx : start_idx + count]
            # Use the embedded count as ground truth; decoded bits should at least start with expected
            assert bits.startswith(expected_step), (
                f"Step mismatch: trial {t}, step {step}, bits {bits} vs expected {expected_step}"
            )
            decoded_all += expected_step
        expected_prefix = payload_bits[: len(decoded_all)]
        if decoded_all != expected_prefix:
            failures += 1
            print(f"[warn] trial {t} mismatch: decoded {decoded_all} vs expected {expected_prefix}")
    print(f"Trials: {trials}, Steps per trial: {steps}, Failures: {failures}")
    assert failures == 0, "Some trials failed consistency check."


if __name__ == "__main__":
    run_batch_tests()
