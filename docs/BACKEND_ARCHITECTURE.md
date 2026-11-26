# Jōtai — Backend, Bridges & Pipelines Specification

**Status:** Handoff specification for implementation by a background agent.
**Audience:** An autonomous coding model implementing the backend while a parallel agent works on `client/`.
**Date:** 2026-11-26
**Source of truth:** This document. Any contract change must be recorded in `docs/CONTRACT_CHANGES.md`.

---

## 0. Parallel Work Agreement (READ FIRST)

### 0.1 Ownership boundary

| Owner | Paths | Rules |
|---|---|---|
| **Backend agent (you)** | `backend/src/**`, `runner/**`, `data/**`, `docker-compose.yml`, `Makefile`, `backend/package.json`, `runner/requirements.txt`, `backend/.env.example`, `runner/.env.example` | You own all of these. Do not touch `client/**`. |
| **Frontend agent (us)** | `client/**`, `focusplan.tsx`, `focusplan.css` | We will adapt to the API contracts in §5. Do not modify these. |
| **Shared** | `docs/CONTRACT_CHANGES.md` | If you must deviate from a contract in §5 or §6, append a dated entry there. Do not silently change shapes. |

### 0.2 Frozen contract

The JSON envelope, endpoint paths, and Runner trigger/execute response shapes in §5 and §6 are **frozen**. The frontend is being written against them concurrently. Breaking them will break the parallel work.

**Shape normalization is owned by the frontend.** The current SQLite repositories return raw snake_case rows (`id`, `folder_id`, `start_time`) rather than the camelCase/`_id` shapes of the old Mongoose API. The frontend will adapt these in `client/src/lib/api.ts` at one boundary. Therefore:

- Do **not** rename DB columns or add ad-hoc aliasing in individual controllers.
- Do **not** change field casing between endpoints — keep it uniformly snake_case from the repositories.
- The frontend adapter maps `id → _id`, `snake_case → camelCase`, and synthesizes populated objects where the UI needs them.
- Keep the envelope `{ success, data, message? }` unchanged.

### 0.3 Goal restatement (what this backend must enable)

1. Conversational assistant (not a rigid command router).
2. Fetch tasks and goals; set goals via natural language.
3. Find relevant documents/notes semantically.
4. Read calendar and **update the schedule** from it.
5. Daily update (proactive, scheduled).
6. Status on demand, with real numbers.
7. Workout suggestions based on real schedule gaps and habit history.
8. Productivity measurement and gentle nudges.
9. Runs entirely on one laptop, one command.
10. **No user data leaves the machine.**

---

## 1. Verified Current State (do not re-discover; this is measured from the repo)

### 1.1 Layout

```
backend/   Node 22 + Express 4 + Mongoose 8 + ioredis
  src/server.js          <- REAL entrypoint. Mounts all routes under /api/v1.
  src/app.js             <- DEAD FILE. Only mounts /api/news. Ignore/delete.
  src/routes/*.js        <- goal, habit, note, task, project, focus, today,
                            analytics, proposal, assistant, integration,
                            auth, user, ai, weather, stock, news
  src/controllers/*.js   <- business logic
  src/services/*.js      <- noteService, habitService, goalService,
                            eventPublisher (Redis), aiService, weatherService,
                            newsService, stockService, spotifyService, githubService
  src/models/*.js        <- Mongoose schemas, all use scopingPlugin
  src/middlewares/       <- serviceAuth, requireUser, requestContext,
                            scopingPlugin, errorHandler, rateLimiter
runner/    Python 3.11 + FastAPI + requests + google-genai + redis
  app.py                 <- FastAPI: /health, /api/runner/trigger, /api/runner/execute
  config.py              <- settings from env; LLM_PROVIDER default "stub"
  api_client.py          <- HTTP bridge to Node (Bearer RUNNER_SERVICE_TOKEN)
  llm_provider.py        <- GeminiProvider, StubProvider, get_llm_provider()
  agents/                <- router.py, orchestrator.py, planning.py,
                            habit_insight.py, tools.py
  actions/               <- registry.py + task/goal/habit handlers
  services/              <- context_engine, conversation_store, confirmation_store,
                            stats, suggestion_service, context_engine
  events/consumer.py     <- Redis stream jotai:events; only handles TASK_COMPLETED
client/    React 19 + Vite 8 + TanStack Router/Query + Tailwind 4
```

### 1.2 Current behavior and known defects to FIX

| # | Defect | Evidence |
|---|---|---|
| D1 | Agent is blind: context contains only counts and mocks | `backend/src/controllers/assistantController.js:27-34` returns `available_focus_minutes: 120`, `level: 1`, `xp: 0` |
| D2 | Agent does one tool call then a canned reply | `runner/agents/orchestrator.py` `_static_reply()` lines 75-104 |
| D3 | Six-intent rigid router; unknown falls to clarification | `runner/agents/router.py:12` `VALID_INTENTS` |
| D4 | Chat memory in-process, 6 turns, lost on restart | `runner/services/conversation_store.py` |
| D5 | Notes have no search endpoint | `backend/src/routes/noteRoutes.js` has only CRUD + folders + tags |
| D6 | Calendar is a remote ICS URL fetched with axios | `backend/src/controllers/todayController.js:95` — leaks request to arbitrary host; no write-back |
| D7 | External API routes registered by default | `server.js:59-61` weather/stocks/news; `config/index.js` has their keys |
| D8 | Redis used for exactly one suggestion | `events/consumer.py:57-68` |
| D9 | Five processes required to run | README "Run locally" |
| D10 | `app.js` is a second, stale Express app | `app.js` only mounts news, unused by `server.js` |

### 1.3 Contracts that are GOOD and must be PRESERVED

- **Propose → confirm → execute.** `runner/actions/registry.py`: destructive actions require a single-use `actionId`; the registry executes *stored* params, not client-supplied ones. Keep this exactly.
- **Provider abstraction** in `runner/llm_provider.py` (`BaseLLMProvider.generate`). Extend it, do not replace the idea.
- **Deterministic math** in `runner/services/stats.py` (durations, streaks, preference profile). The LLM must never compute numbers.
- **Thin Node API boundary**: Python never connects to the datastore directly. Preserve this; it is what makes the SQLite swap safe.
- **Response envelope**: `{ "success": boolean, "data": {...}, "message"?: string }`.

---

## 2. Target Architecture

```
                         ┌──────────────────────────────┐
   browser (client/)     │  SmartAssistant + widgets     │
                         └──────────────┬───────────────┘
                                        │ HTTP :5000 /api/v1
                                        │ (user JWT / local-user)
┌───────────────────────────────────────▼───────────────────────────────────────┐
│ NODE API (:5000)  — single owner of durable state                            │
│  routes → controllers → repository → SQLite (data/jotai.db)                  │
│  emits in-process events (EventEmitter) instead of Redis                      │
│  exposes: tasks, goals, habits, notes, focus, today, proposals,               │
│           suggestions, assistant/context, conversations, calendar, metrics    │
└──────────────▲──────────────────────────────────┬─────────────────────────────┘
               │ Bearer RUNNER_SERVICE_TOKEN      │ same-process EventEmitter
               │ + x-jotai-user-id                │ (Python subscribes via
               │                                  │  long-poll /api/v1/events)
┌──────────────┴──────────────────────────────────▼─────────────────────────────┐
│ PYTHON RUNNER (:8000) — the agent                                             │
│  FastAPI: /health, /api/runner/trigger, /api/runner/execute                   │
│  agent loop → tool registry → api_client → Node                               │
│  local knowledge index (embeddings, numpy) — LOCAL ONLY                       │
│  APScheduler: briefing / workout / breaks / note reindex                      │
└──────────────┬──────────────────────────────────┬─────────────────────────────┘
               │ localhost:11434                  │ local file ICS / CalDAV
               ▼                                  ▼
     Ollama (LLM + embeddings)            data/jotai-calendar.ics
     NO external network egress
```

### 2.1 Required connections (explicit list)

| From | To | Transport | Auth | Purpose |
|---|---|---|---|---|
| Browser | Node :5000 | HTTP/JSON | Local JWT or `local_user` | CRUD, suggestions, events long-poll |
| Browser | Runner :8000 | HTTP/JSON | none (localhost only) | `/trigger`, `/execute` |
| Runner | Node :5000 | HTTP/JSON | `Bearer RUNNER_SERVICE_TOKEN` + `x-jotai-user-id` | all reads/writes |
| Runner | Ollama :11434 | HTTP/JSON | none (localhost only) | chat model + embedding model |
| Runner | Node :5000 | long-poll GET | service token | event stream replacement for Redis |
| Node | SQLite `data/jotai.db` | `better-sqlite3` | n/a | durable state |
| Node | `data/jotai-calendar.ics` | fs write | n/a | outbound schedule subscription |
| Node | local ICS file or CalDAV | fs read / HTTPS to configured local server | config | inbound calendar |

**There must be no other outbound connection.** See §7 egress guard.

---

## 3. Technology Decisions

| Decision | Choice | Rationale |
|---|---|---|
| Datastore | SQLite via `better-sqlite3` (Node), one file `data/jotai.db` | Single-user laptop; zero services; WAL mode for concurrent Node/long-poll reads |
| Redis | Removed. Replace with Node `EventEmitter` + `GET /api/v1/events` long-poll | Redis bought one trivial notification |
| LLM | Ollama, default `qwen2.5:3b-instruct-q4_K_M` (fallback `llama3.2:3b`) | Fits 8–16 GB laptop; local; function-calling support |
| Embeddings | Ollama `nomic-embed-text` (768 dims), local | Semantic note search with no network |
| Vector search | numpy cosine over a cached matrix in `runner/state/knowledge_index.npz` | Corpus is personal-scale (hundreds/thousands of notes); avoids a vector DB service |
| Keyword search | SQLite FTS5 virtual table `notes_fts` | Exact-term recall; merge with vector results |
| Scheduler | `apscheduler` (AsyncIOScheduler or BackgroundScheduler) inside Runner | No extra process |
| Calendar write-back | Write `focus_blocks` + regenerate `data/jotai-calendar.ics` | User subscribes to the file; no Google OAuth, no cloud |
| Auth | Keep existing `serviceAuth` semantics; UI uses a single `local_user` | Multi-user login is out of scope |

**Hardware assumption:** ≥8 GB RAM. If the deployment laptop has less, set `OLLAMA_CHAT_MODEL=llama3.2:1b` and keep embeddings model unchanged. Expose model names in config only — never hardcode in prompts.

---

## 4. Data Model (SQLite DDL)

Create `backend/src/db/schema.sql`. Use `PRAGMA journal_mode=WAL; PRAGMA foreign_keys=ON;`.

```sql
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,               -- 'local_user' by default
  display_name TEXT NOT NULL DEFAULT 'Local User',
  chronotype TEXT DEFAULT 'unknown', -- morning | night | unknown
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS tasks (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id),
  title TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'not_started',      -- not_started|in_progress|blocked|completed
  priority TEXT NOT NULL DEFAULT 'medium',          -- high|medium|low
  due_date TEXT,                                    -- ISO-8601 or NULL
  estimated_minutes INTEGER,
  project_id TEXT,
  tags TEXT NOT NULL DEFAULT '[]',                  -- JSON array
  subtasks TEXT NOT NULL DEFAULT '[]',              -- JSON array of {title,isCompleted}
  is_starred INTEGER NOT NULL DEFAULT 0,
  completed_at TEXT,
  xp_reward INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_tasks_due ON tasks(user_id, due_date);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(user_id, status);

CREATE TABLE IF NOT EXISTS goals (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id),
  title TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'active',            -- active|completed|archived
  completed INTEGER NOT NULL DEFAULT 0,             -- keep in sync with status
  progress INTEGER NOT NULL DEFAULT 0 CHECK(progress BETWEEN 0 AND 100),
  due_date TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS habits (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id),
  name TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'general',         -- general|workout|health|learning
  frequency_type TEXT NOT NULL DEFAULT 'every_day',
  status TEXT NOT NULL DEFAULT 'active',
  created_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS habit_completions (
  id TEXT PRIMARY KEY,
  habit_id TEXT NOT NULL REFERENCES habits(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL,
  completed_at TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'completed'
);
CREATE INDEX IF NOT EXISTS idx_habit_completions_date ON habit_completions(user_id, completed_at);

CREATE TABLE IF NOT EXISTS notes (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id),
  title TEXT NOT NULL DEFAULT 'Untitled Note',
  content TEXT NOT NULL DEFAULT '',
  folder_id TEXT,
  tag_ids TEXT NOT NULL DEFAULT '[]',
  pinned INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL,
  last_edited TEXT NOT NULL
);
CREATE VIRTUAL TABLE IF NOT EXISTS notes_fts USING fts5(
  title, content, note_id UNINDEXED, content='notes', content_rowid='rowid'
);
-- Keep notes_fts in sync with triggers defined in schema.sql.

CREATE TABLE IF NOT EXISTS focus_blocks (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  title TEXT NOT NULL,
  task_id TEXT,
  start_time TEXT NOT NULL,
  end_time TEXT NOT NULL,
  elapsed_seconds INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'scheduled',        -- scheduled|active|completed|cancelled
  source TEXT NOT NULL DEFAULT 'assistant',         -- assistant|calendar|manual
  external_event_id TEXT,
  created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_focus_start ON focus_blocks(user_id, start_time);

CREATE TABLE IF NOT EXISTS calendar_events (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  external_id TEXT,
  title TEXT NOT NULL,
  start_time TEXT NOT NULL,
  end_time TEXT NOT NULL,
  source TEXT NOT NULL DEFAULT 'ics',               -- ics|caldav|local
  synced_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_cal_start ON calendar_events(user_id, start_time);

CREATE TABLE IF NOT EXISTS proposals (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  type TEXT NOT NULL,                  -- schedule_proposal|habit_insight|subtask_suggestion|workout_plan
  data TEXT NOT NULL,                  -- JSON
  status TEXT NOT NULL DEFAULT 'pending', -- pending|accepted|rejected
  flags TEXT NOT NULL DEFAULT '[]',
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS decision_logs (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  proposal_id TEXT,
  action_type TEXT NOT NULL,
  accepted INTEGER NOT NULL,
  context TEXT NOT NULL DEFAULT '{}',
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS suggestions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  type TEXT NOT NULL,
  priority TEXT NOT NULL DEFAULT 'medium',
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  target_module TEXT NOT NULL,
  actions TEXT NOT NULL DEFAULT '[]',
  status TEXT NOT NULL DEFAULT 'pending', -- pending|accepted|dismissed|expired|executed
  created_at TEXT NOT NULL
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_suggestion_dedupe
  ON suggestions(user_id, type, target_module) WHERE status='pending';

CREATE TABLE IF NOT EXISTS conversations (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  session_id TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_conv_session ON conversations(user_id, session_id);

CREATE TABLE IF NOT EXISTS messages (
  id TEXT PRIMARY KEY,
  conversation_id TEXT NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  role TEXT NOT NULL,                   -- user|assistant|system|tool
  content TEXT NOT NULL,
  tool_calls TEXT,                      -- JSON or NULL
  created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_msg_conv ON messages(conversation_id, created_at);

CREATE TABLE IF NOT EXISTS executed_actions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  action_name TEXT NOT NULL,
  params TEXT NOT NULL,
  result TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS preferences (
  user_id TEXT PRIMARY KEY REFERENCES users(id),
  calendar_ics_path TEXT,
  calendar_source TEXT NOT NULL DEFAULT 'none',  -- none|ics_file|caldav
  briefing_time TEXT NOT NULL DEFAULT '07:00',
  workout_time TEXT NOT NULL DEFAULT '17:00',
  focus_minutes INTEGER NOT NULL DEFAULT 25,
  break_minutes INTEGER NOT NULL DEFAULT 5,
  workout_days TEXT NOT NULL DEFAULT 'mon,wed,fri',
  chronotype TEXT NOT NULL DEFAULT 'unknown',
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS app_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL,
  event_type TEXT NOT NULL,
  payload TEXT NOT NULL,
  created_at TEXT NOT NULL,
  consumed_at TEXT
);
```

### 4.1 Migration from Mongoose

- Implement `backend/src/db/index.js` exporting `getDb()` (lazy singleton), `run(sql, params)`, `all(sql, params)`, `get(sql, params)`, `transaction(fn)`.
- Implement `backend/src/repositories/*.js` with the same method names currently used by controllers (e.g. `Task.find`, `findById`, `create`, `findByIdAndUpdate`, `deleteOne`) as thin adapters so controllers need minimal edits. Preserve the `userContext` scoping behavior from `scopingPlugin.js` by injecting `user_id` from `requestContext` in every query.
- Provide `backend/src/db/migrate.js`: if `data/jotai.db` is absent, create schema and seed `local_user` + default preferences. Provide a one-time `MONGODB_URI` export script only if legacy data must be preserved; otherwise document that a fresh start is acceptable.
- Delete `mongoose`, `ioredis`, and all external-service SDK dependencies from `package.json` (see §7).

---

## 5. Node API Contract (FROZEN — frontend is coding against this)

Base URL: `http://localhost:5000/api/v1`
Envelope: `{ "success": true, "data": <payload>, "message"?: "..." }`; errors `{ "success": false, "message": "..." }` with appropriate HTTP status.

### 5.1 Existing endpoints to preserve (same paths/shapes)

```
GET    /tasks                ?startDate=&endDate=&status=   -> data: Task[]
GET    /tasks/:id                                          -> data: Task
POST   /tasks                                              -> data: Task
POST   /tasks/:id/complete                                 -> data: Task  (+ optional ui.invalidate)
PATCH  /tasks/:id                                          -> data: Task
DELETE /tasks/:id             body { actionId }            -> data: { deleted: true, ui?: {...} }
GET    /goals                                              -> data: Goal[]
POST   /goals                                              -> data: Goal
DELETE /goals/:id             body { actionId }            -> data: {...}
GET    /habits                                             -> data: Habit[]
POST   /habits                                             -> data: Habit
DELETE /habits/:id                                         -> data: {...}
GET    /focus                 ?start=&end=                  -> data: FocusBlock[]
POST   /focus                                              -> data: FocusBlock
GET    /notes                                              -> data: Note[]
GET    /notes/:id                                          -> data: Note
POST   /notes                                              -> data: Note
PATCH  /notes/:id                                          -> data: Note
DELETE /notes/:id                                          -> data: {...}
GET    /today/summary                                      -> data: TodaySummary (§5.3)
GET    /today/calendar        ?startDate=&endDate=         -> data: CalendarEvent[]
GET    /today/insights                                     -> data: Insight|null
GET    /proposals                                          -> data: Proposal[]
POST   /proposals                                          -> data: Proposal
PATCH  /proposals/:id/status body { status }               -> data: Proposal (+ DecisionLog write)
GET    /proposals/decisions   ?limit=                      -> data: DecisionLog[]
GET    /assistant/context                                  -> data: ContextSnapshot (§5.2)
GET    /assistant/suggestions ?targetModule=               -> data: Suggestion[]
POST   /assistant/suggestions                              -> data: Suggestion (dedupe by type+target)
POST   /assistant/suggestions/:id/:action                  -> data: Suggestion
```

### 5.2 NEW/REWRITTEN endpoints

```
GET  /assistant/context   -> REWRITTEN. Real values, no mocks:
     data: {
       time: ISO,
       today: {
         tasks_remaining: number,
         tasks_completed: number,
         overdue_tasks: number,
         focus_seconds_today: number,
         available_focus_minutes: number,   // computed from calendar free slots, not 120
         habits_completed: number,
         habits_total: number
       },
       focus: { active: boolean, blockId?: string, startedAt?: string },
       progress: { level: number, xp: number, xp_to_next: number },
       goals: [{ id, title, status, progress }],
       top_tasks: [{ id, title, priority, dueDate }],
       next_events: [{ title, start, end }]
     }

GET  /metrics/status       -> data: StatusSnapshot   (mounted at /metrics/status; controller docblock says /status — use the mounted path)
     {
       generated_at: ISO,
       focus: { today_seconds, week_seconds, sessions_today, best_hour },
       tasks: { due_today, completed_today, overdue, completion_rate_7d },
       habits: { completed_today, total, current_streak },
       goals: { active, completed_this_week, avg_progress },
       calendar: { events_today, free_minutes_next_48h },
       workout: { last_completed, workouts_this_week }
     }

GET  /notes/search  ?q=&limit=8  -> data: [{ id, title, excerpt, score, source: 'fts'|'vector' }]
     // FTS5 + optional vector ids supplied by Runner via POST /notes/search/vector

POST /notes/search/vector
     body { ids: string[], scores: number[] }   // Runner computed cosine locally
     -> merges vector ranking with FTS ranking; same response shape

GET  /calendar/sync   -> data: { events: CalendarEvent[], configured: boolean, source }
POST /calendar/focus  -> create focus block AND rewrite data/jotai-calendar.ics
     body { title, taskId?, startTime, endTime }
     -> data: { block: FocusBlock, icsPath: string }

GET  /conversations/:sessionId          -> data: { id, messages: Message[] }
POST /conversations/:sessionId/messages body { role, content, toolCalls? }
     -> data: Message   (upserts conversation, trims to MAX_MESSAGES=200)
DELETE /conversations/:sessionId       -> data: { deleted: true }

GET  /events  ?after=<id>&timeout=20    -> long-poll; data: { events: AppEvent[], lastId }
POST /events                            -> internal: append event (serviceAuth)

GET  /metrics/weekly  -> data: { focus_minutes, task_completion_rate, plan_adherence,
                                 break_regularity, workout_consistency, trend: [] }
GET  /health                            -> { ok: true, db: 'ok' }
```

### 5.3 `TodaySummary` shape (used by daily briefing)

```json
{
  "quests": { "completed": 2, "total": 5 },
  "focus": { "seconds": 5400 },
  "streak": 12,
  "weeklyGoal": 64,
  "habits": { "completed": 3, "total": 5 },
  "tasks": { "dueToday": 4, "completedToday": 2, "overdue": 1 }
}
```

### 5.4 Frontend invalidation convention

Any mutation response may include `data.ui.invalidate: string[]` (e.g. `["tasks","today","status"]`). Frontend dispatches `jotai-invalidate`. Preserve this field on all mutation endpoints.

---

## 6. Runner Contract (FROZEN — frontend calls these directly)

Base URL: `http://localhost:8000`

### 6.1 `POST /api/runner/trigger`

```json
Request:  { "intent": "what should I work on?", "user_id": "local_user", "sessionId": "uuid" }
Response: {
  "success": true,
  "data": {
    "reply": "1–3 sentence natural response",
    "classification": { "intent": "...", "stage": "agent", "tools_used": [...] },
    "actionResult"?: { confirmationRequired?, actionId?, actionName?, params?, ui?: {...} },
    "proposedActions"?: [{ type, payload, actionId? }],
    "proposal"?: { id, type, data },
    "ui"?: { invalidate: string[] }
  }
}
```

### 6.2 `POST /api/runner/execute`

```json
Request:  { "actionName": "task.delete", "params": { "taskId": "..." }, "actionId": "..." }
Response: { "success": true, "data": { "reply": "...", "actionResult": {...} } }
```

### 6.3 `GET /health` -> `{ "status": "ok", "service": "Jötai Runner", "llm": "local", "offline": true }`

### 6.4 Confirmation rules (unchanged)

Destructive actions (`task.delete`, `goal.delete`, `habit.delete`, `calendar.reset`) require confirmation. `actionId` is single-use, TTL `PENDING_ACTION_TTL_SECONDS=600`, and the stored params are executed — never the client-supplied ones. Reject replayed/expired IDs.

---

## 7. Privacy & Egress Guard (hard requirement)

Implement `backend/src/middlewares/egressGuard.js` and `runner/services/egress_guard.py`.

1. Config `PRIVACY_MODE=strict` by default. In strict mode:
   - Node must **not register** `/api/v1/weather`, `/api/v1/stocks`, `/api/v1/news`, `/api/v1/ai`, `/api/v1/integrations`. Return 404 for those paths.
   - Remove those SDKs and their API keys from `backend/package.json` and `backend/.env.example`.
   - `todayController.getCalendarEvents` must **not** call `axios.get(url)`. Read `CALENDAR_ICS_PATH` from local filesystem, or CalDAV only if `CALENDAR_CALDAV_URL` resolves to loopback/local LAN. Reject any other scheme at startup.
   - Runner: `OLLAMA_HOST` must parse to loopback (`127.0.0.1`, `localhost`, `::1`). Fail startup otherwise.
   - Runner: do not import `google-genai` at runtime. Keep `GeminiProvider` behind an explicit `LLM_PROVIDER=gemini` opt-in that is disabled in strict mode.
2. Add a startup assertion that prints a single line: `PRIVACY OK: all endpoints local`. If any non-local endpoint is configured while strict, exit with code 1.
3. No telemetry, analytics, Sentry, CDN fonts, remote images, or remote model downloads at runtime. Models are pulled once by the user via `ollama pull` (documented in README).
4. `/health` must report `"offline": true` when strict mode is active.

---

## 8. Pipelines

### 8.1 Conversational agent loop (replaces `router.py` + `orchestrator.py`)

Create `runner/agents/agent_loop.py`. Pseudocode:

```
run_agent(user_text, user_id, session_id) -> dict
  1. history = api_client.get_conversation(session_id)      # durable, last 200 msgs
  2. snapshot = api_client.get_context()                    # §5.2 real values
  3. memory   = memory_service.summarize(session_id)        # §8.2
  4. tools    = tool_registry.descriptors()                 # §8.3
  5. messages = [system_prompt(snapshot, memory, tools)] + history + [user(user_text)]
  6. for step in range(MAX_STEPS=6):
       resp = llm.generate(messages, tools=tools)
       if resp.tool_calls:
           for call in resp.tool_calls:
               observation = tool_registry.execute(call.name, call.args, session_id)
               messages.append(tool_result(call.id, observation))
           continue
       final = resp.content
       break
  7. if no final after MAX_STEPS: final = bounded best-effort summary + flag
  8. api_client.append_message(session_id, 'user', user_text)
     api_client.append_message(session_id, 'assistant', final)
  9. return { success, data: { reply: final, classification: {intent:'agent', stage:'loop', tools_used}, ... } }
```

Rules:
- The LLM never computes numbers. All numeric facts come from tools (`status`, `stats`, context snapshot). If the model emits a number not present in an observation, discard and re-ask once.
- Mutations go through `tool_registry` → existing `ActionRegistry`. Confirmation rules in §6.4 still apply.
- `MAX_STEPS` configurable, default 6. Log each step with session id.
- Keep `UNKNOWN` behavior only as a fallback when the LLM call fails entirely; reply with a clarifying question, never a fabricated answer.
- System prompt must include today's date, user chronotype, current focus block, and a one-line privacy reminder ("All data stays local").

### 8.2 Persistent memory (`runner/services/memory_service.py`)

- Every N=10 messages, summarize the oldest 20 into a rolling `summary` string stored in Node `preferences` table (new column `memory_summary TEXT`). Use the local LLM with a bounded prompt.
- Inject the summary + the last 8 raw messages into every agent prompt.
- Also maintain a small structured `UserModel` JSON in `preferences.user_model`: preferred focus windows, workout days, common projects, communication tone. Update it deterministically from `decision_logs` (reuse `runner/services/stats.py`), not from free-form LLM output.
- No client-supplied history is ever trusted; `sessionId` is the only key.

### 8.3 Tool registry (`runner/agents/tool_registry.py`)

Replace `TOOLS_BY_INTENT` with a flat descriptor list. Each descriptor:

```python
ToolSpec(name, description, parameters_json_schema, handler, requires_confirmation=False)
```

Required tools (all callable by the agent):

| Tool | Backed by | Notes |
|---|---|---|
| `list_tasks` | `GET /tasks` | filters: status, due_before, priority |
| `get_task` | `GET /tasks/:id` | |
| `create_task` | `task.create` | |
| `complete_task` | `task.complete` | |
| `delete_task` | `task.delete` | confirm |
| `list_goals` | `GET /goals` | |
| `create_goal` | `goal.create` | |
| `delete_goal` | `goal.delete` | confirm |
| `update_goal_progress` | `PATCH /goals/:id` | |
| `list_notes` | `GET /notes` | metadata only |
| `search_notes` | local knowledge index (§8.4) | returns note ids + excerpts |
| `get_note` | `GET /notes/:id` | full content |
| `get_status` | `GET /status` | real numbers |
| `get_calendar` | `GET /calendar/sync` | |
| `pull_calendar` | `GET /calendar/sync` + upsert | explicit "update my schedule from calendar" |
| `create_focus_block` | `POST /calendar/focus` | writes app + ICS |
| `propose_schedule` | existing `run_planning_agent` | conflict-checked, proposal only |
| `suggest_workout` | §8.7 | proposal only |
| `get_metrics` | `GET /metrics/weekly` | |

Keep `estimate_task_duration` and `suggest_subtasks` unchanged.

### 8.4 Document knowledge pipeline (semantic search)

Files: `runner/services/knowledge_index.py`, `runner/agents/tools.py` (`search_notes`).

**Index build (on startup + every `INDEX_REFRESH_SECONDS=300` + on `note_changed` event):**
1. `notes = api_client.get_notes()` — via Node, never direct DB.
2. For each note, compute embedding with Ollama `nomic-embed-text` over `title + "\n" + content` (truncate to 2000 chars).
3. L2-normalize vectors. Save matrix + note id list + content hash to `runner/state/knowledge_index.npz`.
4. If a note hash is unchanged in the next cycle, skip re-embedding.

**Query:**
1. Embed query locally.
2. Cosine similarity against cached matrix; take top `k` above `MIN_SCORE=0.25`.
3. Return `[{ id, title, excerpt (first 300 chars around best match), score, source: 'vector' }]`.
4. Post ids/scores to Node `POST /notes/search/vector` to merge with FTS5 hits, or simply call `GET /notes/search?q=...` and merge in Python — pick one and document it. (Preferred: merge in Python, keep Node dumb.)

**Failure mode:** if Ollama embeddings are unavailable, fall back to FTS5-only via Node and mark `source: 'fts'`. Never silently switch to a remote embedding API.

### 8.5 Calendar ingest + schedule update pipeline

Files: `backend/src/services/calendarService.js`, `backend/src/controllers/calendarController.js`, `backend/src/utils/ical.js` (extend existing parser).

**Inbound (read):**
1. `GET /calendar/sync` reads either `CALENDAR_ICS_PATH` (local `.ics` file) or CalDAV (loopback/LAN only).
2. Parse with existing `parseIcs`; upsert rows into `calendar_events` keyed by `(user_id, external_id)`.
3. Return events + `configured` + `source`.

**Agent flow ("update my schedule from the calendar"):**
1. User says *"update my schedule from my calendar"* → agent calls `pull_calendar`, then `get_calendar`, then `list_tasks`.
2. Agent calls `propose_schedule` (existing planning agent), which runs `check_schedule_constraints(blocks, events)` — keep that function, it is good.
3. Result is a Proposal (`type='schedule_proposal'`) shown to the user.
4. On acceptance, `PATCH /proposals/:id/status` accepts it; a Node handler creates `focus_blocks` from the proposal blocks, calls `writeCalendarIcs()`, and emits `SCHEDULE_UPDATED`.
5. `writeCalendarIcs()` writes all future `focus_blocks` to `data/jotai-calendar.ics` with `PRODID:-//Jotai//Local//EN`, `VTIMEZONE` omitted (floating local times), `UID` = block id, and `DTSTAMP`. User subscribes to this file.

**Conflict rule:** a block must not overlap another block or any `calendar_events` row. Reuse `check_schedule_constraints` in Python and mirror the check in Node before writing. Bounded self-correction stays at 3 attempts.

### 8.6 Proactive scheduler pipeline

Files: `runner/services/scheduler.py`, wired in `runner/app.py` startup/shutdown.

| Job | Default | Action |
|---|---|---|
| `daily_briefing` | `07:00` local | Aggregate `/today/summary`, `/status`, `get_calendar`, top tasks, habit streaks → one LLM narration (≤120 words) → `create_suggestion(type='daily_briefing', priority='high', targetModule='today', actions=['plan_today','status'])` |
| `workout_nudge` | `17:00` local on configured days | Find free 20-min slot in next 2h via calendar + focus blocks → `suggest_workout` proposal → suggestion with actions `['accept_workout','snooze']` |
| `break_reminder` | every `focus_minutes` while a focus block is `active` | suggestion `type='break_reminder'`, low priority, action `['start_break']` |
| `note_reindex` | every 300s | §8.4 |
| `weekly_review` | Mon 08:00 | `GET /metrics/weekly` → narrative suggestion |

- Use existing `Suggestion` dedupe (unique pending per type+target).
- All times from `preferences` table; no hardcoded times in job code except defaults.
- Scheduler must shut down cleanly with FastAPI lifespan (replace `@app.on_event` with lifespan context manager while you are in there).

### 8.7 Workout recommendation pipeline

Files: `runner/agents/workout.py`.

1. `prefs = GET /preferences` (workout_days, focus window, chronotype).
2. `history = GET /habits` filtered `category='workout'` + completions last 8 weeks.
3. `gaps = free slots from GET /calendar/sync minus focus_blocks` (use `check_schedule_constraints` logic).
4. Deterministic pick: choose shortest gap ≥ 20 min within preferred window; choose workout type by alternating from last logged type (strength → cardio → mobility). **The LLM only writes the sentence; it does not pick the slot or the duration.**
5. Emit Proposal `type='workout_plan'` with `{ type, duration_minutes, start, end, rationale }`.
6. On accept: create a `habits` row if missing, and append a `habit_completions` row when the user later confirms "done".

### 8.8 Status & productivity metrics pipeline

- `GET /status` is computed in Node with SQL aggregates over `focus_blocks`, `tasks`, `habit_completions`, `goals`, `calendar_events`. No LLM. No mocks.
- `GET /metrics/weekly` returns:
  - `focus_minutes` — sum `elapsed_seconds` grouped by day
  - `task_completion_rate` — completed / due in last 7 days
  - `plan_adherence` — accepted schedule proposals whose focus blocks completed / total accepted
  - `break_regularity` — count of break suggestions accepted / reminders sent
  - `workout_consistency` — workout habit completions / planned days
  - `trend` — array of 7 daily objects
- Agent may narrate these numbers but must not invent them (same rule as §8.1).

### 8.9 Event pipeline (Redis replacement)

- Node `eventPublisher.js` → `EventEmitter` + insert into `app_events`.
- Node `GET /events?after=<id>&timeout=20` long-polls: `SELECT * FROM app_events WHERE id > ? AND user_id = ? ORDER BY id`, waiting up to timeout via a polling interval. Return `lastId`.
- Runner `events/consumer.py` → replace `xreadgroup` with a loop calling `GET /events`; keep `handle_event()` logic and add cases:
  - `TASK_COMPLETED` → existing all-tasks-done suggestion
  - `NOTE_CHANGED` → trigger `knowledge_index` refresh
  - `SCHEDULE_UPDATED` → no-op (UI invalidates itself)
  - `FOCUS_STARTED` / `FOCUS_COMPLETED` → scheduler break reminders
- Delete `ioredis`, `redis`, `STREAM_KEY`, `GROUP_NAME`.

---

## 9. Runner ↔ Node Bridge (`api_client.py` additions)

Keep `APIClient` and `HEADERS`. Add methods:

```python
get_conversation(session_id) -> dict
append_message(session_id, role, content, tool_calls=None) -> dict
get_status() -> dict
get_notes() -> list
search_notes_fts(query, limit) -> list
get_calendar_events() -> list
sync_calendar() -> dict
create_focus_block(payload) -> dict
get_preferences() -> dict
update_preferences(patch) -> dict
get_metrics() -> dict
get_events(after_id, timeout) -> dict
```

Rules:
- Every call uses `settings.NODE_API_URL` + `HEADERS` (`Bearer RUNNER_SERVICE_TOKEN`, `x-jotai-user-id`).
- Timeouts: 15s normal, 25s for `/events` long-poll.
- Never connect to SQLite directly. Never connect to MongoDB.
- On 401/403, log once and return a structured failure; do not crash the loop.

---

## 10. Config & Environment

### 10.1 `runner/.env.example`

```
LLM_PROVIDER=ollama
OLLAMA_HOST=http://127.0.0.1:11434
OLLAMA_CHAT_MODEL=qwen2.5:3b-instruct-q4_K_M
OLLAMA_EMBED_MODEL=nomic-embed-text
NODE_API_URL=http://127.0.0.1:5000/api/v1
RUNNER_SERVICE_TOKEN=change-me-local-token
RUNNER_USER_ID=local_user
PRIVACY_MODE=strict
AGENT_MAX_STEPS=6
INDEX_REFRESH_SECONDS=300
MAX_MESSAGES=200
CHAT_HISTORY_TURNS=8
PENDING_ACTION_TTL_SECONDS=600
BRIEFING_TIME=07:00
WORKOUT_TIME=17:00
```

### 10.2 `backend/.env.example`

```
PORT=5000
NODE_ENV=development
JWT_SECRET=change-me-local-secret
RUNNER_SERVICE_TOKEN=change-me-local-token
DB_PATH=./data/jotai.db
CALENDAR_ICS_PATH=./data/incoming.ics
CALENDAR_CALDAV_URL=
CALENDAR_OUTBOUND_ICS_PATH=./data/jotai-calendar.ics
PRIVACY_MODE=strict
```

Remove `GEMINI_API_KEY`, `WEATHER_API_KEY`, `NEWS_API_KEY`, `TWELVE_DATA_API_KEY`, `SPOTIFY_*`, `GITHUB_*`, `MONGODB_URI`, `REDIS_URL`.

### 10.3 Dependencies

`backend/package.json` add `better-sqlite3`; remove `mongoose`, `ioredis`, `@google/generative-ai`, and unused external SDKs. Keep `express`, `cors`, `helmet`, `jsonwebtoken`, `morgan`, `uuid`, `dotenv`, `express-rate-limit`, `express-validator`.

`runner/requirements.txt` add `ollama`, `apscheduler`, `numpy`; keep `fastapi`, `uvicorn`, `requests`, `pydantic`, `python-dotenv`, `tenacity`, `pytest`; remove `redis`; move `google-genai` to an optional `requirements-optional.txt`.

---

## 11. File-by-File Implementation Map

### New files

```
backend/src/db/schema.sql
backend/src/db/index.js
backend/src/db/migrate.js
backend/src/repositories/{task,goal,habit,note,focus,proposal,suggestion,conversation,calendar,preference,metrics}.js
backend/src/middlewares/egressGuard.js
backend/src/services/calendarService.js
backend/src/services/metricsService.js
backend/src/services/eventBus.js
backend/src/controllers/calendarController.js
backend/src/controllers/metricsController.js
backend/src/controllers/conversationController.js
backend/src/controllers/eventController.js
backend/src/controllers/healthController.js
runner/services/ollama_provider.py            # OllamaProvider(BaseLLMProvider)
runner/services/egress_guard.py
runner/services/knowledge_index.py
runner/services/memory_service.py
runner/services/scheduler.py
runner/agents/agent_loop.py
runner/agents/tool_registry.py
runner/agents/workout.py
runner/state/                                   # gitignored
data/                                           # gitignored
docker-compose.yml                              # node + runner + ollama
Makefile                                        # make start / make test / make pull-model
docs/CONTRACT_CHANGES.md
```

### Modified files

```
backend/src/server.js            # SQLite init, remove Mongo/Redis, add new routes, egress guard
backend/src/config/index.js      # new env keys only
backend/src/controllers/assistantController.js   # rewrite getContext with real values
backend/src/controllers/todayController.js       # local ICS, remove axios
backend/src/controllers/noteController.js        # add search endpoints
backend/src/controllers/proposalController.js    # accept handler writes focus blocks + ICS
backend/src/routes/{note,assistant,today}.js     # add new routes
backend/src/services/eventPublisher.js          # EventEmitter, no Redis
runner/config.py                 # new settings
runner/llm_provider.py           # add OllamaProvider + ToolSpec/ToolCall types
runner/api_client.py             # add methods from §9
runner/app.py                    # lifespan, scheduler, egress assertion, health fields
runner/agents/orchestrator.py    # delegate to agent_loop (keep thin shim for existing tests)
runner/agents/tools.py           # add read + calendar + workout tools
runner/events/consumer.py        # long-poll instead of Redis
runner/services/confirmation_store.py  # unchanged semantics
```

### Deleted / disabled

```
backend/src/app.js                 # stale duplicate app
backend/src/routes/weatherRoutes.js, stockRoutes.js, newsRoutes.js, aiRoutes.js, integrationRoutes.js
backend/src/services/{weather,stock,news,ai,spotify,github}Service.js
backend/src/models/News.js
runner/agents/router.py            # replaced by agent_loop; keep only if a test imports it, then delete test
```

**Testing compatibility:** existing tests under `runner/test_*.py` and `backend/tests/*.test.js` target the old router/registry. Keep the registry and stats tests green. For router tests that are now obsolete, replace them with equivalent `agent_loop` tests in the same filenames so `pytest` stays green.

---

## 12. Startup & Shutdown Sequence

1. `make start` → `docker compose up` starts `ollama`, `node`, `runner`.
2. Ollama container pulls nothing automatically; `make pull-model` runs `ollama pull qwen2.5:3b-instruct-q4_K_M && ollama pull nomic-embed-text`.
3. Node: `db.migrate()` → seed `local_user` + preferences → `EventEmitter` init → listen :5000 → assert privacy config → print `PRIVACY OK`.
4. Runner: lifespan startup → egress assertion → warm `knowledge_index` → start scheduler → start event long-poll consumer → listen :8000.
5. `/health` on both must be green before frontend considers ready.
6. Shutdown: stop scheduler → stop consumer → close Ollama client → Node closes DB and event loop.

---

## 13. Testing Strategy

### Python (`LLM_PROVIDER=ollama` tests must be optional; use a `StubOllamaProvider` for CI)

- `test_agent_loop.py`: multi-step loop with 2 tool calls then final; confirm `tools_used` recorded; confirm numbers come only from observations.
- `test_tool_registry.py`: every descriptor has valid JSON schema; destructive tools require confirmation.
- `test_knowledge_index.py`: embed + cosine ranking with stubbed embeddings; fallback to FTS when embeddings unavailable.
- `test_calendar_pipeline.py`: conflict detection; accepted proposal writes focus blocks + ICS file content.
- `test_scheduler.py`: jobs registered from preferences; no job fires when disabled.
- `test_egress_guard.py`: non-loopback Ollama host fails startup.
- Keep existing `test_confirmation.py`, `test_stats.py`, `test_planning_calendar.py` green.

### Node (`npm test`)

- Repository CRUD round-trip against a temp SQLite file.
- `GET /status` returns no mocked constants (assert `available_focus_minutes != 120` unless genuinely computed as 120).
- Suggestion dedupe.
- Proposal accept writes focus blocks + ICS.
- `GET /events` long-poll returns and acknowledges ids.
- Egress guard: strict mode returns 404 for `/api/v1/weather` etc.

### Integration smoke (manual, documented in README)

```
make start
curl localhost:5000/health
curl localhost:8000/health
curl -X POST localhost:8000/api/runner/trigger -H 'content-type: application/json' \
  -d '{"intent":"what is my status?","sessionId":"smoke"}'
curl -X POST localhost:8000/api/runner/trigger -H 'content-type: application/json' \
  -d '{"intent":"update my schedule from my calendar","sessionId":"smoke"}'
curl -X POST localhost:8000/api/runner/trigger -H 'content-type: application/json' \
  -d '{"intent":"find my notes about focus","sessionId":"smoke"}'
```

---

## 14. Definition of Done (all must be true)

- [ ] `make start` brings up the whole system with one command; no MongoDB, no Redis, no external API keys.
- [ ] `/health` on both services reports offline/strict mode.
- [ ] A conversation can span follow-ups and survive a restart (durable messages).
- [ ] "what is my status?" returns real computed numbers.
- [ ] "find my notes about X" returns semantically relevant notes using local embeddings only.
- [ ] "update my schedule from my calendar" reads local ICS, proposes conflict-free blocks, and on approval writes `focus_blocks` + `data/jotai-calendar.ics`.
- [ ] A daily briefing appears as a suggestion at the configured time.
- [ ] A workout suggestion uses a real free slot and habit history.
- [ ] No process makes a network call to a non-loopback address (verify with `ss -tpn` or a firewall deny rule during smoke test).
- [ ] All §5 and §6 contracts unchanged, or changes recorded in `docs/CONTRACT_CHANGES.md`.
- [ ] Test suites green.

---

## 15. Open Decisions (resolve and record before coding)

1. **Embedding index ownership** — preferred: Python owns `knowledge_index.npz`, Node owns notes. Confirm or change.
2. **Calendar source** — local ICS file path vs CalDAV. Recommended: ICS file first (simplest, fully local); CalDAV later.
3. **Model size** — confirm laptop RAM. Default `qwen2.5:3b-instruct-q4_K_M`.
4. **Auth** — keep `local_user` implicit, or add a simple passcode gate for the UI? Backend contract unchanged either way.
5. **Legacy data** — migrate from MongoDB or start fresh? Recommended: fresh start; export script optional.

Record answers in `docs/CONTRACT_CHANGES.md` with a date and your agent identifier.
