"""
Simple smoke test for AgentMark SDK.
Run with: PYTHONPATH=. python3 tests/smoke_sdk.py
"""

from agentmark.sdk import AgentWatermarker, PromptWatermarkWrapper


def test_direct_mode():
    wm = AgentWatermarker(payload_bits="1101")
    probs = {"A": 0.4, "B": 0.35, "C": 0.25}
    res = wm.sample(probs, context="task||step1", history=["obs"])
    print("[direct] action:", res.action)
    print("[direct] bits_embedded:", res.bits_embedded, "bit_index:", res.bit_index)
    decoded = wm.decode(probs, res.action, context=res.context_used, round_num=res.round_num)
    print("[direct] decoded bits:", decoded)


def test_prompt_mode():
    wm = AgentWatermarker(payload_bits="1101")
    wrapper = PromptWatermarkWrapper(wm)
    fake_llm = (
        '{"action_weights": {"Search": 0.6, "Reply": 0.3, "Finish": 0.1},'
        '"action_args": {"Search": {"q": "x"}}}'
    )
    result = wrapper.process(
        raw_output=fake_llm,
        fallback_actions=["Search", "Reply", "Finish"],
        context="task||step2",
        history=["obs2"],
    )
    print("[prompt] action:", result["action"])
    print("[prompt] args:", result["action_args"])
    print("[prompt] probs_used:", result["probabilities_used"])
    print("[prompt] frontend distribution diff:", result["frontend_data"]["distribution_diff"])


if __name__ == "__main__":
    test_direct_mode()
    test_prompt_mode()
