# AIVOA — AI-Powered Root Cause Analysis (RCA) Module

An AI-assisted Root Cause Analysis module for a pharmaceutical **API (Active Pharmaceutical
Ingredient) manufacturer**, built for the AIVOA.AI *AI Product Developer – Python & React*
internship assignment.

It digitises the GMP quality workflow:

**Deviation intake → Evidence review → AI-assisted Root Cause Analysis → CAPA recommendations**

Every AI output is a *draft for a human*: summaries, root causes and CAPA actions are fully
reviewable and editable in the UI, and the edited versions are what get stored.

---

## The pharma workflow, briefly

When something goes wrong in API manufacturing — an out-of-specification (OOS) impurity
result, a temperature excursion in a reactor — GMP requires a formal **deviation** record.
Quality teams then:

1. **Record the deviation** — batch, product, process stage, severity, what happened, and the
   immediate containment (e.g. batch placed on QA hold).
2. **Gather evidence** — chromatograms, equipment/DCS logs, batch records, operator
   observations.
3. **Find the root cause** — classically with the **Ishikawa (fishbone) diagram** across six
   categories (*Man, Machine, Material, Method, Measurement, Environment*) and the
   **5 Whys** technique.
4. **Agree CAPA** — *Corrective* actions (fix this batch/problem) and *Preventive* actions
   (change the process so it cannot recur), each with an owner and a due date, before the
   deviation can be closed.

This module supports all four steps, with a real LLM doing the heavy drafting in steps 3–4
(and summarising in step 1) — always under human review.

---

## Architecture

```
┌────────────────────────────┐        HTTP/JSON         ┌─────────────────────────────┐
│  Frontend (React + TS)     │  ──────────────────────▶ │  Backend (FastAPI)          │
│  Vite + Tailwind CSS       │                          │  SQLAlchemy + SQLite        │
│  · deviation list & form   │                          │  · REST API for deviations  │
│  · evidence manager        │                          │    & evidence               │
│  · AI panels with editors  │                          │  · ai_service.py ──▶ Gemini │
└────────────────────────────┘                          │    (fallback: OpenAI)       │
                                                        └─────────────────────────────┘
```

- `backend/app/main.py` — FastAPI app and all REST endpoints.
- `backend/app/ai_service.py` — the LLM provider module. Prefers **Google Gemini**
  (`GEMINI_API_KEY`, REST `generateContent`) and falls back to **OpenAI**
  (`OPENAI_API_KEY`) if only that is set. Prompts ask for structured JSON: a deviation
  summary, an Ishikawa + 5 Whys root cause analysis, and corrective/preventive CAPA lists
  with owner roles and due dates. **There are no mocked responses** — with no key
  configured, the AI endpoints return HTTP 503 with a clear "AI key is not configured"
  message.
- `backend/app/seed.py` — seeds two realistic sample deviations (an OOS impurity in a
  hydrogenation batch; a temperature excursion in an alkylation step) with evidence, so the
  demo works immediately.
- `frontend/src/` — React + TypeScript UI: deviation list/detail, intake form, evidence
  manager, and editable AI panels (`RootCauseEditor`, `CapaEditor`).

Status flow per deviation: **Open → Under Investigation → CAPA Proposed → Closed**
(generating a root cause analysis moves Open → Under Investigation; generating CAPA moves
it to CAPA Proposed; every status is also settable manually).

---

## Setup

### Prerequisites
- Python 3.11+
- Node.js 18+
- A Google Gemini API key (free tier works) — or an OpenAI API key

### Backend

```bash
cd backend
python -m venv .venv && source .venv/bin/activate   # Windows: .venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env        # then edit .env and set GEMINI_API_KEY=...
uvicorn app.main:app --reload --port 8000
```

The SQLite database (`backend/rca.db`) is created automatically and seeded with the two
sample deviations on first start.

### Frontend

```bash
cd frontend
npm install
npm run dev                 # http://localhost:5173
```

The Vite dev server proxies `/api` to the backend on port 8000, so no extra config is
needed. (To point at a backend elsewhere, set `VITE_API_BASE` — see `frontend/.env.example`.)

### Run (both together)

Terminal 1: `cd backend && uvicorn app.main:app --port 8000`
Terminal 2: `cd frontend && npm run dev`
Then open **http://localhost:5173**.

> Without an AI key the whole app still works — intake, evidence, editing, status flow —
> only the three "Generate" buttons return the *AI key is not configured* error.

---

## API endpoints

| Method | Path | Description |
|---|---|---|
| GET | `/api/health` | Health check + active AI provider |
| GET | `/api/deviations` | List all deviations (with evidence) |
| POST | `/api/deviations` | Create a deviation |
| GET | `/api/deviations/{id}` | Get one deviation |
| PUT | `/api/deviations/{id}` | Update fields / status / save edited AI output |
| DELETE | `/api/deviations/{id}` | Delete a deviation (and its evidence) |
| POST | `/api/deviations/{id}/evidence` | Add an evidence item |
| DELETE | `/api/evidence/{id}` | Delete an evidence item |
| POST | `/api/deviations/{id}/ai/summary` | Generate + store AI deviation summary |
| POST | `/api/deviations/{id}/ai/root-cause` | Generate + store Ishikawa + 5 Whys analysis |
| POST | `/api/deviations/{id}/ai/capa` | Generate + store CAPA recommendations |

Interactive API docs (Swagger UI) are available at `http://localhost:8000/docs` while the
backend is running.

---

## Screenshots

<!-- TODO: add screenshots before submission -->
- _Deviation list with the two seeded investigations_ — *(placeholder)*
- _Deviation detail: evidence review_ — *(placeholder)*
- _AI root cause analysis: Ishikawa categories + 5 Whys editor_ — *(placeholder)*
- _AI CAPA recommendations editor_ — *(placeholder)*

---

## Tech stack

React 18 · TypeScript · Vite · Tailwind CSS · FastAPI · SQLAlchemy · SQLite ·
Google Gemini API (OpenAI fallback) · httpx
