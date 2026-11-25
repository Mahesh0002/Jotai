# Changelog — Agentic Build Spec

Track every task, file, verification, and known gap. Newest entries at the top
within each phase.

## Phase C

### C6 — Cookie auth, per-user scoping, and ICS calendar (done)
- `backend/src/middlewares/{requestContext,requireUser,scopingPlugin}.js`: async
  request context identifies UI cookie/JWT or Runner service token; a global API
  guard requires one of them; a Mongoose plugin filters by/stamps `userId`.
- `backend/src/routes/authRoutes.js`: register/login/logout/me with bcryptjs and
  an HTTP-only `jotai_token` cookie. `client/src/routes/login.tsx`, sidebar
  sign-out, and axios `withCredentials` + 401 redirect complete the UI flow.
- `backend/src/utils/ical.js` + `Preference.calendarIcsUrl` / `CALENDAR_ICS_URL`:
  `/today/calendar` now fetches a real ICS subscription and filters by date;
  no feed configured returns an explicit empty result. The settings card lets
  users paste a Google/Outlook/Apple subscription link.
- `runner/config.py` / `runner/api_client.py`: optional `RUNNER_USER_ID` sends
  `x-jotai-user-id` so Runner service actions can be scoped to one user.
- New tests: `auth.test.js` (3), `accessGuard.test.js` (5), `ical.test.js` (2),
  `calendarFeed.test.js` (2). Full backend suite: 32 passed via Deno
  `--no-check` Node compatibility; client files parse-checked with Deno.
- Not verified in a browser: no node/npm in this environment. Python tests were
  not re-run here (pytest unavailable); the prior 52-pass snapshot stands.

### C5 — Remaining API pipelines and bridges (done)
- News/stock/weather controllers now normalize upstream payloads to
  `{ success, data }`; the Today widgets and Insights sidebar consume the same shape.
- `backend/tests/externalSignals.test.js` (new): 3 normalization cases.
- `client/src/components/insights/ExternalSignalsSidebar.tsx`: live news, BTC/USD
  quote, and current weather via React Query; removed hardcoded sample data.
- `Preference.settings` stores the full settings object; `SettingsContext` loads it
  on mount and debounces PUTs on change. Spotify/GitHub connect/disconnect updates
  `Preference.integrations`, and the sidebar reads those flags.
- `backend/tests/preferences.test.js` (new): settings persistence cases.
- Verified: all 20 backend tests pass via Deno Node-compat runner; client syntax
  checked with Deno. No browser build available here.

### C4 — Insights + goals API wiring (done)
- `backend/src/controllers/todayController.js`: `/today/insights` now derives a
  focus-window insight from completed focus blocks in the last 30 days; returns
  `data: null` below three sessions. No LLM call.
- `backend/tests/todayInsights.test.js` (new): computation and insufficient-data cases.
- `client/src/components/insights/LiveInsights.tsx` (new): consumes the endpoint on
  `/insights`; the three hardcoded insight cards were removed from that route.
- `client/src/components/goals/GoalsPanel.tsx` (new): list, create, complete/reopen,
  and delete goals via `useGoals`; replaces the "coming soon" Progress tab.
- `client/src/lib/config.ts` (new): `VITE_BACKEND_API_URL` / `VITE_RUNNER_API_URL`
  with localhost defaults. All scattered `:5000` / `:8000` URLs now use it.
- Verified: all 15 backend tests pass via Deno Node-compat runner (npm unavailable);
  client syntax checked with Deno. External-signals sidebar remains sample data.

### C3 — Proposals inbox UI (done)
- `client/src/routes/proposals.tsx` (new): `/proposals` page.
- `client/src/components/proposals/ProposalInbox.tsx` (new): polls pending proposals,
  renders schedule/habit/subtask payloads, accept/reject with toasts and query
  invalidation, plus a decision-history sidebar built from decided proposals.
- `client/src/lib/api.ts`: typed proposal payloads and `updatedAt`.
- `client/src/components/sidebar.tsx`: nav entry with pending count;
  `client/src/components/focus-plan.tsx`: "View inbox" link.
- `client/src/routeTree.gen.ts`: `/proposals` entry added (mirrors generator output).
- Verified: static review only — no node/npm in this environment, so no build or UI test.

### C1 — Decision log (done)
- `backend/src/models/DecisionLog.js` (new): proposal id, type, decision,
  attributes, timestamp.
- `backend/src/controllers/proposalController.js`: accept/reject now writes a
  decision log; added `getDecisionLogs`; `extractAttributes` derives duration
  from the first schedule block.
- `backend/src/routes/proposalRoutes.js`: `GET /proposals/decisions`
  (service-auth) and `POST /proposals` (service-auth).
- `backend/tests/proposalDecisions.test.js` (new): accept/reject/pending cases,
  auth on the decisions endpoint.
- Verified: `node --test tests/*.test.js` → 13 passed.

### C2 — Deterministic preference profile (done)
- `runner/services/stats.py`: `build_preference_profile` aggregates
  accept/reject logs into ≤150 words (time-of-day rejection counts, preferred
  block median, focus-type acceptance).
- `runner/api_client.py`: `get_decision_logs`.
- `runner/agents/planning.py` and `runner/agents/habit_insight.py`: inject the
  profile into prompts.
- `runner/test_stats.py`: exact profile assertions.
- `runner/test_planning_calendar.py`: profile appears in the planning prompt.
- `runner/test_habit_insight.py`: profile appears in the habit prompt.
- Docs phrase this narrowly: deterministic aggregation of past decisions, not
  ML/learning.

## Phase B

### B1 — N-way intent routing (done)
- `runner/agents/router.py` (new): exact triggers → keyword rules → LLM →
  `UNKNOWN`; logs raw classification and stage.
- `runner/agents/orchestrator.py`: routes `TASK/GOAL/HABIT/PLAN/INSIGHT/UNKNOWN`;
  `UNKNOWN` returns a clarification, never PLAN.
- `runner/test_router.py` (new): 17 table/param cases including ties, gibberish,
  empty input, invalid LLM output.

### B2 — Bounded chat context (done)
- `runner/services/conversation_store.py` (new): per-session deque of last 6
  turns (12 messages) plus one pending confirmation.
- `runner/app.py` accepts `sessionId`; orchestrator injects history into prompts.
- `runner/test_conversation.py`, `runner/test_orchestrator_flow.py`.

### B3 — Calendar-aware planning (done, synthetic data caveat)
- `runner/api_client.py`: `get_calendar_events(start,end)`.
- `backend/src/controllers/todayController.js`: existing calendar endpoint now
  accepts `startDate`/`endDate` and returns `start`/`end` epochs; **still
  synthetic**.
- `runner/agents/planning.py`: calendar conflicts are a hard constraint in the
  capped self-check loop.
- `runner/test_planning_calendar.py`: conflict forces revision; persistent
  conflict is flagged after 3 attempts.

### B4 — Task helpers (done)
- `runner/services/stats.py`: `estimate_duration` (median of similar completed
  tasks; observed focus time first, then stored estimates).
- `runner/agents/tools.py`: `estimate_task_duration`, `suggest_subtasks`
  (LLM output goes to a `subtask_suggestion` proposal; never auto-applied).
- `backend/src/models/Proposal.js`: added `subtask_suggestion`.
- `runner/test_stats.py`, `runner/test_agents.py`.

## Phase A

### A1 — Audit (done)
- `docs/STATUS.md`: initial audit of the post-Runner commit.
- Found the Runner had landed after the first clone; re-audited all paths.

### A2 — Invariant fixes + hygiene (done)
- **Packaging**: added `runner/__init__.py`; converted all runner imports to
  `runner.*`; `import runner.app` now works (`uvicorn runner.app:app`).
- **Rate limit**: `is_rate_limit_error` is duck-typed on `code`/`status_code`
  and only 429; real predicate tests (the old rate-limit test was a `pass`).
- **Confirmation gate**: `runner/services/confirmation_store.py` (new);
  registry requires a single-use `actionId` for destructive actions; `/execute`
  no longer injects `_confirmed`; stored params prevent payload swapping.
- **Deterministic habit insight**: `runner/services/stats.py` computes counts,
  rates and focus minutes; the LLM only narrates.
- **Docs**: `runner/README.md`, `runner/.env.example`, corrected
  `smart_assistant_command_flow.md`, rewrote the inflated root `README.md`.
- **Dependencies**: added `redis` to `runner/requirements.txt`.
- **Static confirmations**: routine tools return templated replies; optional
  narration only for non-routine tools.
- **Model config**: Node `geminiModel` config default; removed hardcoded
  `gemini-1.5-pro` from `aiService.js`.

### A3 — Security tests (done)
- `backend/src/middlewares/serviceAuth.js`: strict 401s, JWT verification,
  `crypto.timingSafeEqual`, service-only impersonation header.
- `backend/tests/serviceAuth.test.js`: missing/invalid/service/user-JWT/
  service-privilege/impersonation/timing-safe cases.
- `backend/package.json`: `test` now runs `node --test tests/*.test.js`.
- Verified: 13 Node tests pass.

## Bug fixes made along the way
- Removed `serviceAuth` from local UI task/habit/focus routes (it would reject
  the dashboard without a login flow); kept it on Runner-facing writes.
- Backend default port changed `3001 → 5000` to match the client and Runner.
- Task list now honors `startDate`/`endDate` (planning was silently receiving
  all tasks).
- Focus list accepts `startDate`/`endDate` aliases.
- `runner/api_client.get_focus_history` sends `start`/`end` (the Node names).
- `estimate_task_duration` requests 90 days of focus history instead of today.
- Moved manual scripts out of pytest collection (`runner/manual/`).
- Fixed `SmartAssistant` Runner error text and added `sessionId`/`actionId`.

## Verification snapshot
```text
LLM_PROVIDER=stub python -m pytest runner/ -q   → 52 passed
cd backend && npm test                          → 13 passed
python -c "import runner.app"                   → ok
```

## Not done (locked / gaps)
- Phase D (insights narrative), Phase E (local llama.cpp), Phase F (semantic
  notes search) remain locked.
- Calendar OAuth connect flow; browser verification of UI login/settings/proposals.
- Redis consumer not exercised (no Redis here); live Gemini not called.
