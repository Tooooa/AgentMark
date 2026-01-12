"""
Integration-style test that calls DeepSeek chat API, asks for action_weights via prompt,
and routes the result through AgentMark's watermark SDK.

Prerequisites:
- Environment variable DEEPSEEK_API_KEY must be set (do NOT hardcode keys in code).
- Network access to https://api.deepseek.com must be allowed.

Run:
    PYTHONPATH=. DEEPSEEK_API_KEY=sk-xxx python3 tests/fake_agent_llm.py
"""

import os
from openai import OpenAI

from agentmark.sdk import AgentWatermarker, PromptWatermarkWrapper


def build_messages(wrapper: PromptWatermarkWrapper):
    """
    Build chat messages that require JSON action_weights output.
    """
    base_system = (
        "You are an assistant deciding among candidate actions for a tool-using agent. "
        "Return probabilities for each candidate."
    )
    # Append strict JSON instruction from SDK
    system_prompt = base_system + "\n" + wrapper.get_instruction()

    # List candidates in the user message
    candidates = ["Search", "Reply", "Finish"]
    user_prompt = "Candidates:\n" + "\n".join(f"- {c}" for c in candidates)

    return [
        {"role": "system", "content": system_prompt},
        {"role": "user", "content": user_prompt},
    ], candidates


def main():
    api_key = os.getenv("DEEPSEEK_API_KEY")
    if not api_key:
        raise RuntimeError("DEEPSEEK_API_KEY not set.")

    client = OpenAI(api_key=api_key, base_url="https://api.deepseek.com")

    wm = AgentWatermarker(payload_bits="1101")
    wrapper = PromptWatermarkWrapper(wm)

    messages, candidates = build_messages(wrapper)

    print("[info] Sending request to DeepSeek...")
    resp = client.chat.completions.create(
        model="deepseek-chat",
        messages=messages,
        temperature=0.2,
        max_tokens=300,
    )
    raw_text = resp.choices[0].message.content
    print("[raw LLM output]\n", raw_text)

    result = wrapper.process(
        raw_output=raw_text,
        fallback_actions=candidates,
        context="demo||step1",
        history=["obs: user asks for a tool"],
    )

    print("\n[watermark result]")
    print("selected action:", result["action"])
    print("action args:", result["action_args"])
    print("probabilities used:", result["probabilities_used"])
    print("frontend distribution diff:", result["frontend_data"]["distribution_diff"])

    # Decode bits to verify watermark correctness for this step
    round_used = result["frontend_data"]["watermark_meta"]["round_num"]
    bits = wm.decode(
        probabilities=result["probabilities_used"],
        selected_action=result["action"],
        context="demo||step1",
        round_num=round_used,
    )
    print("decoded bits (this step):", bits)


if __name__ == "__main__":
    main()
