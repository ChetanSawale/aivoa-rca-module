# AIVOA Assignment — Video Scripts (record both AFTER the Gemini key is in backend/.env)

## Before recording — run the app
Terminal 1: `cd backend && uvicorn app.main:app --reload --port 8000`
Terminal 2: `cd frontend && npm run dev` → open the printed localhost URL
Check once that the AI buttons return real output (not the "key not configured" error).

---

## Video 1 — Product demo (3–5 min, FACE VISIBLE, explain as you go)

**[0:00 — face cam + app home, deviation list visible]**
"Hi, I'm Chetan Sawale. This is my submission for the AI Product Engineer assignment — an AI-powered Root Cause Analysis module for a pharmaceutical API manufacturer. In pharma quality, when something goes wrong in a batch, the workflow is: record a deviation, investigate it to find the root cause, and define corrective and preventive actions — CAPA. This module takes a quality professional through that whole flow, with AI assisting at each step — and everything the AI writes can be reviewed and edited by the user."

**[0:40 — click the first seeded deviation: OOS impurity, Metronidazole batch]**
"This is a real-style case: an out-of-specification impurity result — 0.42% against a limit of 0.15% — in a hydrogenation batch. The deviation record captures the batch number, product, process stage, severity, what happened, and the immediate action taken. That's the intake step, exactly how a deviation is logged on the shop floor."

**[1:10 — scroll to Evidence, point at the items, add one live]**
"An investigation runs on evidence. Here are the evidence items — lab measurements, equipment logs, observations. I can add new evidence as the investigation proceeds." [Add one small evidence item live.]

**[1:40 — click 'Generate summary']**
"First AI assist: a structured summary of the deviation from the record and the evidence — so a reviewer gets the picture in seconds instead of reading the full file."

**[2:10 — click 'Analyze root causes']**
"Second: root cause analysis. The AI works through the Ishikawa categories — Man, Machine, Material, Method, Measurement, Environment — and builds a 5-Whys chain down to a root-cause statement. This is the method real quality teams use; the AI drafts it from the evidence, the human verifies it."

**[2:50 — edit one AI field on screen, save]**
"And that's the key design point — nothing here is locked. I can correct or refine any AI output and save it back. The AI drafts, the quality professional decides."

**[3:10 — click 'Generate CAPA', show the actions]**
"Finally, CAPA: corrective actions for this incident and preventive actions so it doesn't recur — each with an owner role and a due window. Generating the CAPA moves the deviation to 'CAPA Proposed' in the status flow: Open, Under Investigation, CAPA Proposed, Closed."

**[3:50 — back to list, show the second deviation briefly]**
"The list tracks every deviation with its severity and status — here's a second case, a temperature excursion during a reaction step. Same flow applies."

**[4:10 — close, face cam]**
"Tech stack, as specified: React with TypeScript on the frontend, FastAPI in Python on the backend, SQLite for storage, and a live LLM API for the AI features. The code and full setup instructions are in the GitHub repository. Thank you."

---

## Video 2 — Code walkthrough (no time limit; face visible is NOT required, screen + voice is fine)

Walk in this order, file by file:
1. **Repo layout** — "Two apps: `backend/` FastAPI, `frontend/` React + TypeScript, SQLite as the database."
2. **backend/app/models.py + database.py** — "The data model mirrors the quality workflow: a Deviation has many Evidence items, and stores the AI-generated summary, root-cause analysis and CAPA as structured JSON fields alongside a status that moves Open → Under Investigation → CAPA Proposed → Closed."
3. **backend/app/main.py** — "REST endpoints: CRUD for deviations and evidence, PUT endpoints so edited AI output saves back, and three AI endpoints — /ai/summary, /ai/root-cause, /ai/capa."
4. **backend/app/ai_service.py** — "This is the AI layer. It builds engineered prompts from the deviation + its evidence and calls a real LLM API over HTTP — Gemini first, OpenAI as a fallback — asking for structured JSON back: for root causes, Ishikawa categories plus a 5-Whys chain; for CAPA, corrective and preventive actions with owner roles and due-in-days. There are no mock responses — without an API key in the environment, the endpoints return an explicit 503 saying the key is not configured."
5. **backend/app/seed.py** — "Two realistic seeded deviations — an out-of-spec impurity in a hydrogenation batch and a temperature excursion — each with evidence, so the app demos immediately."
6. **frontend/src/api.ts + types.ts** — "A thin typed API client; the TypeScript types mirror the backend schemas."
7. **frontend components** — "DeviationForm for intake, DeviationDetail for the investigation view, and dedicated editors — RootCauseEditor and CapaEditor — because the brief's core requirement is that AI output stays human-reviewable and editable."
8. **Close** — "Design principle throughout: AI drafts, humans decide — which is how AI should sit inside a regulated quality workflow."

---

## Upload + submit checklist
- [ ] Both videos uploaded to Google Drive (or Loom), sharing = "Anyone with the link can view" — do NOT upload video files into the form
- [ ] GitHub repo public: https://github.com/ChetanSawale/aivoa-rca-module
- [ ] Submission needs the CORRECT form link — the one in AIVOA's document is broken (see chat draft)
- [ ] Deadline: before 25 October 2026
