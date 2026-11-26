# Contract Changes Log

All deviations from the frozen contracts in `docs/BACKEND_ARCHITECTURE.md` §5 and §6 must be recorded here with date and agent identifier.

---

## 2026-11-26 - Backend Agent (Initial Implementation)

### Added Endpoints (New, not in original frozen contract)
- `GET /api/v1/calendar/sync` - Sync calendar from local ICS
- `GET /api/v1/calendar/events` - Get calendar events for date range
- `POST /api/v1/calendar/focus` - Create focus block + write ICS
- `GET /api/v1/metrics/status` - Computed status snapshot
- `GET /api/v1/metrics/weekly` - Weekly productivity metrics
- `GET /api/v1/conversations/:sessionId` - Get conversation with messages
- `POST /api/v1/conversations/:sessionId/messages` - Add message to conversation
- `DELETE /api/v1/conversations/:sessionId` - Delete conversation
- `GET /api/v1/events` - Long-poll for events
- `POST /api/v1/events` - Internal event publishing
- `GET /api/v1/health` - Health check
- `GET /api/v1/notes/search` - FTS5 note search
- `POST /api/v1/notes/search/vector` - Merge vector search results

### Modified Endpoints
- `GET /api/v1/assistant/context` - Now returns real computed values (was mocked)
- `GET /api/v1/today/calendar` - Now reads local ICS file (was axios to remote URL)
- `GET /api/v1/today/summary` - Uses new repositories, real streak calculation

### Removed Endpoints (Per Privacy Mode)
- `GET /api/v1/weather` - External API
- `GET /api/v1/stocks` - External API
- `GET /api/v1/news` - External API
- `GET /api/v1/ai` - External API
- `GET /api/v1/integrations` - External API

### Runner Contract Changes
- `POST /api/runner/trigger` - Now uses agent loop (was rigid router)
- `GET /health` - Added `offline` field for privacy mode

### Database Changes
- Migrated from MongoDB/Mongoose to SQLite/better-sqlite3
- Added tables: `users`, `preferences`, `conversations`, `messages`, `executed_actions`, `app_events`
- Added `notes_fts` virtual table for full-text search
- Added `memory_summary` and `user_model` to preferences

### Event System
- Replaced Redis Streams with Node EventEmitter + SQLite `app_events` table + long-poll
- Runner consumer now uses long-poll GET `/api/v1/events`

---

## 2026-11-26 - Frontend Integration Follow-up

### Backend fixes required to launch the local app
- Schema initialization now executes the full SQL script (`db.exec`) so trigger bodies with
  semicolons parse correctly, and migration is idempotent for partially initialized databases.
- `projects`, `analytics/*`, habit completion/analytics, users, and preferences controllers now
  read/write SQLite instead of unused Mongoose models; no MongoDB connection is required.
- Added `projects` table and `settings`/`theme`/`integrations` columns to `preferences`.
- Mounted `GET/PUT /api/v1/preferences`; reordered static note routes ahead of `/notes/:id`.
- `baseRepository.find` now understands `{ $ne: value }` filters used by the habits controller.

### Test suite restored
- Rewrote the six legacy Node tests (`auth`, `preferences`, `todayInsights`, `calendarFeed`,
  `externalSignals`, `proposalDecisions`) against isolated SQLite databases created by
  `backend/tests/helpers/testDb.js`; no Mongoose mocks or external HTTP calls remain.
- `BaseRepository.create/update` now inspect `PRAGMA table_info` so repositories work with tables
  that do not have an `updated_at` column (proposals, focus blocks, notes, etc.).
- `extractAttributes` now parses the JSON `data` column, and pending status updates no longer
  create a decision log.
- Backend suite: 37 tests pass (`node --test tests/*.test.js` under Node 22).

### Runner routing (in-domain vs out-of-domain)
- `runner/agents/agent_loop.py` is now deterministic-first: in-domain requests are routed by
  `runner/agents/deterministic.py` to explicit local tools (task/goal/habit CRUD, calendar adds,
  fetches, daily updates). Replies are static templates built only from tool results.
- Note retrieval uses the backend's local FTS5 endpoint (`GET /notes/search`); no embeddings or
  generation are involved for in-domain requests.
- Ambiguous/missing arguments produce a clarification question; destructive actions require an
  explicit yes/no confirmation handled in memory.
- Only out-of-domain text goes to the configured model. Defaults now target
  `qwen2.5:1.5b-instruct-q4_k_m` (embeddings: `all-minilm:l6-v2`) via Ollama on loopback;
  `PRIVACY_MODE=strict` rejects any
  non-local provider. If the local model is unavailable, the runner returns a safe local message.
- `runner/agents/router.py` was restored for legacy orchestrator tests; it is not used by the
  primary agent path. Runner suite: 56 tests pass (`PYTHONPATH=. python -m pytest runner -q`).

### Local Ollama installation
- Ollama 0.40.18 installed under `~/.local` (no sudo); server listens only on
  `127.0.0.1:11434` with `OLLAMA_NUM_PARALLEL=1`, `OLLAMA_MAX_LOADED_MODELS=1`,
  and `CUDA_VISIBLE_DEVICES=-1` (CPU-only).
- Models pulled: `qwen2.5:1.5b-instruct-q4_k_m` (986 MB) and `all-minilm:l6-v2`
  (45 MB). `/api/generate` and `/api/embeddings` smoke tests pass.
- End-to-end runner smoke checks: in-domain "add task Buy milk" used
  `task.create` with no model call; out-of-domain "What is the capital of
  France?" returned the local model's answer with `intent=OUT_OF_DOMAIN`.
- Client checks after the final edits: `tsc --noEmit`, ESLint (0 errors,
  11 warnings), and `vite build` all pass.