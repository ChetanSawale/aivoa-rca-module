"""Real LLM integration for the RCA module.

Provider selection:
  1. Google Gemini, if GEMINI_API_KEY is set  -> REST generateContent endpoint
  2. OpenAI, if OPENAI_API_KEY is set         -> chat completions endpoint
  3. Neither -> AIKeyNotConfiguredError, surfaced to the API as HTTP 503.

No mocked responses anywhere: every function here performs a genuine HTTP
call, sends an engineered prompt, and parses the model's JSON reply.
"""
import json
import os

import httpx
from dotenv import load_dotenv

load_dotenv()

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "").strip()
GEMINI_MODEL = os.getenv("GEMINI_MODEL", "gemini-2.0-flash").strip()
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY", "").strip()
OPENAI_MODEL = os.getenv("OPENAI_MODEL", "gpt-4o-mini").strip()

SYSTEM_CONTEXT = (
    "You are a pharmaceutical quality assurance expert specialising in root cause "
    "analysis for Active Pharmaceutical Ingredient (API) manufacturing under GMP. "
    "You reason about deviations using the Ishikawa (fishbone) method and the 5 Whys "
    "technique, and you propose CAPA (Corrective and Preventive Actions) that are "
    "specific, assignable to a role, and time-bound. You always reply with valid "
    "JSON only — no markdown fences, no commentary outside the JSON."
)


class AIKeyNotConfiguredError(RuntimeError):
    """Raised when no LLM API key is present in the environment."""


def active_provider() -> str | None:
    if GEMINI_API_KEY:
        return "gemini"
    if OPENAI_API_KEY:
        return "openai"
    return None


async def _call_gemini(prompt: str) -> str:
    url = (
        f"https://generativelanguage.googleapis.com/v1beta/models/"
        f"{GEMINI_MODEL}:generateContent?key={GEMINI_API_KEY}"
    )
    payload = {
        "systemInstruction": {"parts": [{"text": SYSTEM_CONTEXT}]},
        "contents": [{"parts": [{"text": prompt}]}],
        "generationConfig": {
            "temperature": 0.3,
            "responseMimeType": "application/json",
        },
    }
    async with httpx.AsyncClient(timeout=90) as client:
        resp = await client.post(url, json=payload)
        resp.raise_for_status()
        data = resp.json()
    return data["candidates"][0]["content"]["parts"][0]["text"]


async def _call_openai(prompt: str) -> str:
    url = "https://api.openai.com/v1/chat/completions"
    headers = {"Authorization": f"Bearer {OPENAI_API_KEY}"}
    payload = {
        "model": OPENAI_MODEL,
        "temperature": 0.3,
        "response_format": {"type": "json_object"},
        "messages": [
            {"role": "system", "content": SYSTEM_CONTEXT},
            {"role": "user", "content": prompt},
        ],
    }
    async with httpx.AsyncClient(timeout=90) as client:
        resp = await client.post(url, json=payload, headers=headers)
        resp.raise_for_status()
        data = resp.json()
    return data["choices"][0]["message"]["content"]


async def _generate_json(prompt: str) -> dict:
    provider = active_provider()
    if provider is None:
        raise AIKeyNotConfiguredError(
            "AI key is not configured. Set GEMINI_API_KEY (or OPENAI_API_KEY) "
            "in backend/.env and restart the server."
        )
    raw = await _call_gemini(prompt) if provider == "gemini" else await _call_openai(prompt)
    # Be forgiving of accidental code fences even though we ask for raw JSON.
    text = raw.strip()
    if text.startswith("```"):
        text = text.strip("`")
        if text.lower().startswith("json"):
            text = text[4:]
    return json.loads(text)


def _deviation_context(deviation, evidence_items) -> str:
    lines = [
        f"Title: {deviation.title}",
        f"Batch number: {deviation.batch_number}",
        f"Product / API: {deviation.product_name}",
        f"Process stage: {deviation.process_stage}",
        f"Date occurred: {deviation.date_occurred}",
        f"Severity: {deviation.severity}",
        f"Reported by: {deviation.reported_by}",
        f"Description: {deviation.description}",
        f"Immediate action taken: {deviation.immediate_action or 'None recorded'}",
        "",
        "Evidence collected during the investigation:",
    ]
    if evidence_items:
        for i, ev in enumerate(evidence_items, 1):
            lines.append(f"{i}. [{ev.type}] {ev.title} — {ev.details}")
    else:
        lines.append("(No evidence items recorded yet.)")
    return "\n".join(lines)


async def generate_summary(deviation, evidence_items) -> dict:
    prompt = (
        "Write an investigation summary for the following pharmaceutical manufacturing "
        "deviation. The summary must be factual, concise (120-180 words), and cover: what "
        "happened, the potential impact on product quality and patient safety, the immediate "
        "containment, and the current investigation status implied by the evidence.\n\n"
        + _deviation_context(deviation, evidence_items)
        + '\n\nReply with JSON of the form: {"summary": "<the summary text>"}'
    )
    return await _generate_json(prompt)


async def generate_root_cause(deviation, evidence_items) -> dict:
    prompt = (
        "Perform a root cause analysis of the following pharmaceutical manufacturing "
        "deviation.\n\n"
        + _deviation_context(deviation, evidence_items)
        + "\n\nReply with JSON of exactly this shape:\n"
        "{\n"
        '  "ishikawa": {\n'
        '    "Man": ["<candidate cause>", ...],\n'
        '    "Machine": [...],\n'
        '    "Material": [...],\n'
        '    "Method": [...],\n'
        '    "Measurement": [...],\n'
        '    "Environment": [...]\n'
        "  },\n"
        '  "five_whys": [\n'
        '    {"level": 1, "question": "Why did ...?", "answer": "..."},\n'
        "    ... exactly 5 levels, each Why building on the previous answer ...\n"
        "  ],\n"
        '  "root_cause_statement": "<one or two sentences stating the most probable root cause, '
        'grounded in the evidence>"\n'
        "}\n"
        "Base every cause on the deviation and evidence above; do not invent facts that "
        "contradict them. Give 2-4 candidate causes per Ishikawa category."
    )
    return await _generate_json(prompt)


async def generate_capa(deviation, evidence_items, root_cause_json: str | None) -> dict:
    prompt = (
        "Propose a CAPA plan for the following pharmaceutical manufacturing deviation.\n\n"
        + _deviation_context(deviation, evidence_items)
    )
    if root_cause_json:
        prompt += f"\n\nRoot cause analysis already performed:\n{root_cause_json}"
    prompt += (
        "\n\nReply with JSON of exactly this shape:\n"
        "{\n"
        '  "corrective_actions": [\n'
        '    {"action": "<what will be done to fix the immediate problem / affected batch>", '
        '"owner_role": "<e.g. QA Manager, Production Head, QC Lead, Engineering Head>", '
        '"due_in_days": <integer days from today>}\n'
        "  ],\n"
        '  "preventive_actions": [\n'
        '    {"action": "<what will be changed so this cannot recur, e.g. SOP revision, '
        'training, equipment or process change>", "owner_role": "<role>", '
        '"due_in_days": <integer>}\n'
        "  ]\n"
        "}\n"
        "Provide 2-4 actions in each list. Actions must be specific to this deviation and "
        "its root cause, realistic for a GMP API plant, and ordered by priority."
    )
    return await _generate_json(prompt)
