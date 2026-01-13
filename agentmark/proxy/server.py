"""
Lightweight proxy server that:
- injects JSON scoring instructions into prompts,
- forwards to DeepSeek (or compatible OpenAI-style API),
- parses self-reported probabilities, runs watermark sampling, and decodes bits.

Usage:
    export DEEPSEEK_API_KEY=sk-xxx
    # optional: TARGET_LLM_BASE=https://api.deepseek.com
    # optional: HOST/PORT for this proxy
    uvicorn agentmark.proxy.server:app --host 0.0.0.0 --port 8000

Client side (minimal change):
    export OPENAI_BASE_URL=http://localhost:8000/v1   # 或直接替换调用地址
    export OPENAI_API_KEY=<对方原有 key>              # 我们不使用，但保持兼容

POST /v1/chat/completions 兼容 OpenAI 风格请求：
    {
      "model": "...",
      "messages": [...],
      "temperature": 0.2,
      "max_tokens": 300,
      "candidates": ["A","B","C"],   # 可选，显式提供候选
      "context": "task||step1"       # 可选，水印解码用
    }

响应：
    原始 LLM 响应字段 + watermark 字段（包含 action/action_args/probabilities_used/frontend_data/decoded_bits）。
    原始 content 不做修改，方便向后兼容；消费者可读取 watermark 部分。
"""

from __future__ import annotations

import os
from typing import Optional, List, Dict, Any

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from openai import OpenAI

from agentmark.sdk import AgentWatermarker, PromptWatermarkWrapper, get_prompt_instruction

DEFAULT_TARGET_BASE = "https://api.deepseek.com"


class Message(BaseModel):
    role: str
    content: str


class CompletionRequest(BaseModel):
    model: str
    messages: List[Message]
    temperature: Optional[float] = 0.2
    max_tokens: Optional[int] = 300
    candidates: Optional[List[str]] = None
    context: Optional[str] = "proxy||step1"


app = FastAPI()


def _inject_prompt(messages: List[Message], instr: str, candidates: Optional[List[str]]) -> List[dict]:
    # Ensure there is at least one system message; append instruction to the first system
    msgs = [m.dict() for m in messages]
    system_found = False
    for m in msgs:
        if m["role"] == "system":
            m["content"] = (m["content"] or "") + "\n" + instr
            system_found = True
            break
    if not system_found:
        msgs.insert(0, {"role": "system", "content": instr})

    if candidates:
        # Append candidate list to the last user message (or create one)
        user_lines = "候选动作：\n" + "\n".join(f"- {c}" for c in candidates)
        for m in reversed(msgs):
            if m["role"] == "user":
                m["content"] = (m["content"] or "") + "\n" + user_lines
                break
        else:
            msgs.append({"role": "user", "content": user_lines})
    else:
        # No candidates: ask LLM to propose candidates and give probabilities
        guidance = (
            "如果未提供候选动作，请先生成一组合理的候选动作，并在 action_weights 中给出每个候选的概率。"
        )
        for m in msgs:
            if m["role"] == "system":
                m["content"] = (m["content"] or "") + "\n" + guidance
                break
    return msgs


def _llm_client():
    api_key = os.getenv("DEEPSEEK_API_KEY")
    if not api_key:
        raise RuntimeError("DEEPSEEK_API_KEY not set.")
    base_url = os.getenv("TARGET_LLM_BASE", DEFAULT_TARGET_BASE)
    return OpenAI(api_key=api_key, base_url=base_url)


@app.post("/v1/chat/completions")
def proxy_completion(req: CompletionRequest):
    try:
        instr = get_prompt_instruction()
        rewritten = _inject_prompt(req.messages, instr, req.candidates)

        client = _llm_client()
        resp = client.chat.completions.create(
            model=req.model,
            messages=rewritten,
            temperature=req.temperature,
            max_tokens=req.max_tokens,
        )
        raw_text = resp.choices[0].message.content

        wm = AgentWatermarker(payload_bits="1101")
        wrapper = PromptWatermarkWrapper(wm)

        try:
            result = wrapper.process(
                raw_output=raw_text,
                fallback_actions=req.candidates if req.candidates else None,
                context=req.context or "proxy||step1",
                history=[m.content for m in req.messages if m.role == "user"],
            )
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"watermark processing failed: {e}")

        round_used = result["frontend_data"]["watermark_meta"]["round_num"]
        decoded_bits = wm.decode(
            probabilities=result["probabilities_used"],
            selected_action=result["action"],
            context=req.context or "proxy||step1",
            round_num=round_used,
        )

        # Build response: keep original structure, append watermark info
        resp_dict = resp.model_dump()
        resp_dict["watermark"] = {
            "action": result["action"],
            "action_args": result["action_args"],
            "probabilities_used": result["probabilities_used"],
            "frontend_data": result["frontend_data"],
            "decoded_bits": decoded_bits,
            "raw_llm_output": raw_text,
        }
        return resp_dict
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

