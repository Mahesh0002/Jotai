# Jōtai — Gamified Productivity OS + Local Agentic Runner

Jōtai is a React + Node/Express productivity app (tasks, focus blocks, habits,
goals, notes) with a separate **local Python FastAPI agent service** called the
**Jötai Runner**. The Runner turns natural-language requests into tool calls
against the Node REST API, using a hand-written tool loop and a
propose → confirm → execute flow.

This README describes what is actually implemented and tested in this repo.
Anything not built is under **Roadmap** below.

---

## Architecture

| Layer | Stack | Location |
|---|---|---|
| Frontend | React, TanStack Router/Query, Tailwind | `client/` |
| Backend | Node.js, Express, MongoDB/Mongoose | `backend/` |
| Agent runner | Python 3, FastAPI, `google-genai`, tenacity | `runner/` |

Data flow for assistant actions:

```
SmartAssistant.tsx
  → POST :8000/api/runner/trigger
  → intent router (exact → keyword rules → LLM → UNKNOWN)
  → orchestrator decides tool(s)
  → Action Registry
  → Node REST API (:5000/api/v1)
  → MongoDB
```

Python never connects to MongoDB. All reads/writes go through the Node API.
The Runner authenticates to Node with `RUNNER_SERVICE_TOKEN` (Bearer).

## What is implemented

### Web app
- Tasks, projects, focus blocks, habits (definitions + completions), goals,
  notes, analytics endpoints, and the dashboard UI.
- No login flow is wired into the UI; see **Known limitations**.

### Jötai Runner
- **Provider abstraction** — `runner/llm_provider.py` defines
  `BaseLLMProvider`, `GeminiProvider`, `StubProvider`; selection is via
  `LLM_PROVIDER` (`stub` is the default). Agents never import the Gemini SDK.
- **Hand-written tool loop** — Gemini Automatic Function Calling is explicitly
  disabled; the agent sees and executes tool calls itself.
- **429-only retry** — tenacity retries only HTTP 429 (`is_rate_limit_error`),
  never 400/401/403.
- **Bounded self-correction** — the planning agent caps revisions at 3 and
  submits a flagged best-effort result.
- **Propose → confirm → execute** — deletes require a single-use confirmation
  `actionId`; the store is in-memory and expires (`PENDING_ACTION_TTL_SECONDS`).
- **Deterministic math** — durations, habit counts/streaks, and the preference
  profile are computed in Python (`runner/services/stats.py`); the LLM only
  narrates those numbers.
- **N-way intent routing** — `TASK | GOAL | HABIT | PLAN | INSIGHT | UNKNOWN`
  with exact triggers, keyword rules, then an LLM classifier; `UNKNOWN` asks a
  clarifying question instead of defaulting to PLAN.
- **Bounded chat context** — server-side history capped at 6 turns plus one
  pending confirmation (`runner/services/conversation_store.py`).
- **Calendar-aware planning** — planning checks blocks against the Node
  calendar endpoint and forces a revision on conflict. **Note:** that endpoint
  currently returns synthetic events (`backend/src/controllers/todayController.js`),
  not a real calendar integration.
- **Task helpers** — `estimate_duration` (median of similar completed tasks,
  no LLM in the number) and `suggest_subtasks` (LLM output goes to a proposal,
  never auto-applied).
- **Decision log + preference profile** — proposal accept/reject writes a
  `DecisionLog` via Node; a pure-Python profiler injects a ≤150-token summary
  into planning/habit prompts. This is deterministic aggregation, not ML.

## Tests

```bash
# Python runner (stub provider, no live model calls)
LLM_PROVIDER=stub python -m pytest runner/ -q

# Node backend (serviceAuth + proposal decision logs)
cd backend && npm test
```

The suite covers the router (rule/exact/LLM/UNKNOWN table), bounded history,
pending confirmations, confirmation single-use, duration math, habit stats,
preference profiling, planning/calendar conflict revision, proposal decisions,
and `serviceAuth` (missing/invalid/service/user-JWT/impersonation).

## Run locally

```bash
# 1. Node backend
cd backend
npm install
cp .env.example .env      # or create one
# MONGODB_URI, RUNNER_SERVICE_TOKEN, JWT_SECRET...
npm start                 # http://localhost:5000

# 2. Runner
python -m venv .venv
. .venv/bin/activate
pip install -r runner/requirements.txt
cp runner/.env.example runner/.env
LLM_PROVIDER=stub uvicorn runner.app:app --reload --port 8000

# 3. Frontend
cd client
npm install
npm run dev
```

Use the same `RUNNER_SERVICE_TOKEN` on both sides. For live Gemini calls set
`LLM_PROVIDER=gemini` and `GEMINI_API_KEY`; the default is the stub.

## Roadmap (not built)

- Real calendar integration (the current `/today/calendar` data is synthetic).
- Insights narrative pipeline (weekly stats + one narration call).
- Progress/RPG XP visualizations beyond the current Runner/profile screens.
- Notes semantic search (needs an embedding store).
- Local inference via llama.cpp (`LocalLlamaProvider`) and real benchmarks.
- Multi-user scoping and a login flow for the UI.

## Known limitations

- **Local-only, single-process.** Chat history and pending confirmations live
  in memory and are lost on restart.
- **No per-user scoping.** The Node API does not filter by user; `userId` exists
  on tasks but is not populated. Do not deploy this publicly as-is.
- **Auth split.** `serviceAuth` is strict for Runner-facing writes
  (`POST /proposals`, `GET /proposals/decisions`, assistant context/suggestions).
  The local UI routes (tasks/habits/focus) remain unauthenticated because no
  login flow exists yet.
- **Synthetic calendar.** Planning conflict checks run against mock events.
- **Free-tier privacy.** Gemini free-tier content may be used by Google; use
  synthetic data for demos and tests.
- **No ML/learning claim.** The planner adapts only through the deterministic
  accept/reject profile described above.
