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
| Backend | Node.js 22, Express, SQLite (`better-sqlite3`) | `backend/` |
| Agent runner | Python 3, FastAPI, deterministic tools + local Ollama | `runner/` |

Data flow for assistant actions:

```
SmartAssistant.tsx
  → POST :8000/api/runner/trigger
  → deterministic router for in-domain requests (no model call)
  → out-of-domain requests only: local Ollama model on 127.0.0.1:11434
  → explicit local tool / Action Registry
  → Node REST API (:5000/api/v1)
  → SQLite
```

Python never opens the database directly. All reads/writes go through the Node
API, and the Runner authenticates with `RUNNER_SERVICE_TOKEN` (Bearer).
`PRIVACY_MODE=strict` rejects any non-loopback model provider, so the app makes
no external network requests.

## What is implemented

### Web app
- Tasks, projects, focus blocks, habits (definitions + completions), goals,
  notes, analytics endpoints, and the dashboard UI.
- Local cookie auth (`jotai_token`); seeded demo credentials are `demo` / `demo1234`.

### Jötai Runner
- **Deterministic first** — in-domain messages are routed by
  `runner/agents/deterministic.py` to explicit local tools (task/goal/habit CRUD,
  calendar/fetch/update) and answered from static templates. No generation is
  involved, and ambiguous requests get a clarification question.
- **Local-model fallback only** — out-of-domain text goes to
  `qwen2.5:1.5b-instruct-q4_k_m` through Ollama on loopback. Embeddings use
  `all-minilm:l6-v2`. `PRIVACY_MODE=strict` forbids any other provider.
- **Propose → confirm → execute** — destructive actions require a single yes/no
  confirmation held in the bounded conversation store
  (`runner/services/conversation_store.py`).
- **Local retrieval** — note context comes from the backend FTS5 endpoint
  (`GET /api/v1/notes/search`); no embedding index is required for in-domain work.
- **Reasoning artifacts** — tool calls, classifications, and `ui.invalidate`
  hints are returned with each reply so the UI refreshes only affected data.
- **Legacy orchestrator retained** — `runner/agents/router.py` and the older
  action helpers still exist for compatibility tests, but are not on the primary
  assistant path.

## Tests

```bash
# Python runner (deterministic routing, auth, history, tools)
PYTHONPATH=. python -m pytest runner/ -q

# Node backend under Node 22 (SQLite-backed integration tests)
cd backend && node --test tests/*.test.js

# Client type/lint/build checks
cd client && npx tsc --noEmit && npm run lint && npm run build
```

Current status: 56 runner tests, 37 backend tests, and client `tsc`/lint/build
all pass. Backend tests use isolated temporary SQLite databases.

## Run locally

```bash
# 1. Node backend (Node 22 is required for better-sqlite3)
cd backend
npm install
cp .env.example .env
npm run migrate           # creates data/jotai.db and seeds demo user
npm start                 # http://localhost:5000

# 2. Local model server (no cloud calls)
tar --zstd -xf ollama-linux-amd64.tar.zst -C ~/.local
~/.local/bin/ollama serve &
~/.local/bin/ollama pull qwen2.5:1.5b-instruct-q4_k_m
~/.local/bin/ollama pull all-minilm:l6-v2

# 3. Runner
python -m venv .venv
. .venv/bin/activate
pip install -r runner/requirements.txt
cp runner/.env.example runner/.env
uvicorn runner.app:app --port 8000

# 4. Frontend
cd client
npm install
npm run dev               # http://localhost:8080
```

Use the same `RUNNER_SERVICE_TOKEN` in `backend/.env` and `runner/.env`. Keep
`PRIVACY_MODE=strict`, `LLM_PROVIDER=ollama`, and `OLLAMA_HOST` on loopback.

## Roadmap (not built)

- Real calendar integration (the current `/today/calendar` data is synthetic).
- Insights narrative pipeline (weekly stats + one narration call).
- Progress/RPG XP visualizations beyond the current Runner/profile screens.
- Notes semantic search beyond local FTS5 (needs a persisted embedding store).
- Benchmarks for the local quantized model.
- Multi-user scoping beyond the seeded local/demo accounts.

## Known limitations

- **Local-only, single-process.** Chat history and pending confirmations live
  in memory and are lost on restart.
- **No per-user scoping.** The Node API does not filter by user; `userId` exists
  on tasks but is not populated. Do not deploy this publicly as-is.
- **Local auth only.** A cookie-based local login exists (`demo` / `demo1234`),
  and Runner-facing writes also accept the shared service token. There is no
  remote identity provider.
- **Local calendar feed.** Planning reads a local ICS file configured in
  preferences; CalDAV is not implemented.
- **No cloud LLM.** Out-of-domain answers come from a quantized local model and
  are not sent off-machine.
- **No ML/learning claim.** Adaptation is limited to the deterministic
  accept/reject preference profile.
