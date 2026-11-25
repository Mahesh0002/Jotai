# Changelog — Agentic Build Spec

Track every task, file, verification, and known gap. Newest entries at the top
within each phase.

## Phase C

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
- Real calendar integration; proposals inbox UI; UI login/per-user scoping.
- Redis consumer not exercised (no Redis here); live Gemini not called.
