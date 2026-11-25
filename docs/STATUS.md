# Jötai — Implementation Status

Last updated: 2026-11-25. Scope: Phase A (A1–A3), Phase B (B1–B4), Phase C
(C1–C2). Phases D–F remain locked.

The Runner is `runner/` (Python/FastAPI). The web app is `client/` + `backend/`.

## Capability status

| Capability | Status | Real path | Verified by |
|---|---|---|---|
| Provider abstraction (`BaseLLMProvider`/`Gemini`/`Stub`) | Done | `runner/llm_provider.py` | import/grep; predicate tests |
| AFC disabled (hand-written tool loop) | Done | `runner/llm_provider.py` | code inspection (`AutomaticFunctionCallingConfig(disable=True)`) |
| 429-only retry | Done | `runner/llm_provider.py` | `runner/test_agents.py::test_rate_limit_predicate_accepts_only_429` |
| `GEMINI_MODEL` default `gemini-3.6-flash` | Done | `runner/config.py`, `runner/.env.example`, `backend/src/config/index.js` | inspection |
| Stub is default dev/test provider | Done | `runner/config.py` (`LLM_PROVIDER=stub`) | pytest runs with stub |
| Static confirmations for routine actions | Done | `runner/agents/orchestrator.py` | code inspection; orchestrator tests |
| N-way intent router | Done | `runner/agents/router.py` | `runner/test_router.py` (17 cases) |
| Task / goal / habit actions | Done | `runner/actions/*.py`, `backend/src/routes/{task,goal,habit}Routes.js` | unit tests at registry level; live Node calls not exercised |
| Planning agent (bounded, 3 attempts) | Done | `runner/agents/planning.py` | `runner/test_planning_calendar.py`, `runner/test_agents.py` |
| Habit-insight agent (deterministic stats) | Done | `runner/agents/habit_insight.py`, `runner/services/stats.py` | `runner/test_habit_insight.py` |
| Proposals flow | Done | `backend/src/routes/proposalRoutes.js`, `controllers/proposalController.js`, `models/Proposal.js` | `backend/tests/proposalDecisions.test.js` |
| `serviceAuth` (JWT OR service token) | Done | `backend/src/middlewares/serviceAuth.js` | `backend/tests/serviceAuth.test.js` (8 tests) |
| Chat UI wired to Runner | Done | `client/src/components/SmartAssistant.tsx` | manual/code inspection; no UI test runner |
| Proposals inbox UI | Done (static review) | `client/src/routes/proposals.tsx`, `client/src/components/proposals/ProposalInbox.tsx` | code inspection; no node/npm here to build or test |
| Deterministic focus insight | Done | `backend/src/controllers/todayController.js`, `client/src/components/insights/LiveInsights.tsx` | `backend/tests/todayInsights.test.js` (2 cases) |
| Goals list + create/complete/delete | Done (static review) | `client/src/components/goals/GoalsPanel.tsx`, `client/src/hooks/useGoals.ts` | code inspection; no UI runner |
| Centralized service URLs | Done | `client/src/lib/config.ts` | grep: localhost only in config defaults |
| External signals bridge | Done | `backend/src/controllers/{news,stock,weather}Controller.js`, `client/src/components/insights/ExternalSignalsSidebar.tsx` | `backend/tests/externalSignals.test.js` (3 cases) |
| Settings persistence + integration status | Done (static review) | `client/src/contexts/SettingsContext.tsx`, `backend/src/routes/preferenceRoutes.js`, `client/src/lib/integrations-store.ts` | `backend/tests/preferences.test.js` (2 cases); no UI runner |
| Redis event consumer | Present, untested | `runner/events/consumer.py`, `backend/src/services/eventPublisher.js` | not run (no Redis in this environment) |
| Bounded chat history (6 turns) | Done | `runner/services/conversation_store.py` | `runner/test_conversation.py` |
| Pending confirmation survives a turn | Done | `runner/services/conversation_store.py`, `orchestrator.py` | `runner/test_conversation.py`, `runner/test_orchestrator_flow.py` |
| Calendar-aware planning | Done against synthetic data | `runner/agents/planning.py`, `backend/src/controllers/todayController.js` | `runner/test_planning_calendar.py` |
| `estimate_duration` | Done | `runner/services/stats.py`, `runner/agents/tools.py` | `runner/test_stats.py` |
| `suggest_subtasks` proposal | Done | `runner/agents/tools.py` | `runner/test_agents.py` |
| Decision log on accept/reject | Done | `backend/src/models/DecisionLog.js`, `proposalController.js` | `backend/tests/proposalDecisions.test.js` |
| Deterministic preference profile | Done | `runner/services/stats.py` | `runner/test_stats.py`, `test_planning_calendar.py`, `test_habit_insight.py` |
| Tests | 52 Python + 13 Node | `runner/test_*.py`, `backend/tests/*.test.js` | see commands below |

## Invariant compliance

1. **Provider abstraction — PASS.** Only `runner/llm_provider.py` imports
   `google.genai`; agents call `get_llm_provider()`.
2. **AFC disabled — PASS.** Explicitly disabled when tools are passed.
3. **429-only retry — PASS.** Predicate checks `code`/`status_code == 429` or
   `"429"`; 400/401/403 are not retried.
4. **Bounded loops — PASS.** Planning caps at 3 attempts and flags
   `constraint_violation`.
5. **Propose → confirm → execute — PASS.** Deletes require a confirmation;
   `actionId` is single-use, TTL-bound, and executes stored params, so the
   payload cannot be swapped after approval.
6. **Deterministic math — PASS.** Duration, habit counts/rates, and the
   preference profile are pure Python. The habit prompt says not to compute or
   invent numbers; a test checks the stats appear verbatim in the prompt.
7. **Minimal LLM calls — PASS.** One classification/tool call per message plus
   static replies for routine tools. An optional narration branch exists only
   for non-routine tools.
8. **Model config — PASS.** Runner and Node default to `gemini-3.6-flash`;
   the old Node `gemini-1.5-pro` literal was removed.
9. **Python never touches MongoDB — PASS.** `runner` uses `requests` only.
10. **Auth — PASS for Runner-facing writes.** `serviceAuth` rejects
    missing/invalid tokens, verifies user JWTs, compares the service token with
    `crypto.timingSafeEqual`, and honors `x-jotai-user-id` only on the service
    path. Local UI routes remain unauthenticated because no login flow exists.
11. **No per-user scoping — KNOWN LIMITATION.** `Task.userId` exists but is
    not populated/filtered. Do not deploy publicly.
12. **Privacy — tests use synthetic data.** Live Gemini is never called in
    tests; stub is the default.

## Verification commands (real output)

```text
$ LLM_PROVIDER=stub python -m pytest runner/ -q
52 passed in 0.31s

$ cd backend && npm test
# tests 20
# pass 20
# fail 0

# Verified in this environment with Deno (no Node/npm installed):
$ cd backend && deno test --unstable-detect-cjs --node-modules-dir=manual --allow-all tests/*.test.js
# 20 passed
```

```text
$ grep -rn "google.genai\|google import genai" runner --include='*.py'
runner/llm_provider.py:4:from google import genai
runner/llm_provider.py:5:from google.genai import types
```

```text
$ python -c "import runner.app"
runner.app import ok
```

## Remaining gaps / not done

- **Real calendar**: `/api/v1/today/calendar` returns synthetic events; planning
  checks against those. A real integration is not implemented.
- **Proposals inbox not browser-verified**: added after the last recorded test run; no
  node/npm in this environment to build or exercise it.
- **No login flow** for the UI; task/habit/focus routes are local and open.
- **Redis path untested** here (no Redis server). `redis` is now in
  `requirements.txt`.
- **No live Gemini test** (by design; free-tier budget). The Gemini adapter is
  covered by inspection and the stub/unit tests.
- **No end-to-end DB test** for action handlers; Node tests mock Mongoose models.
- **Phases D–F locked**: insights narrative pipeline, local llama.cpp provider,
  notes semantic search.
- Legacy `backend/src/services/aiService.js` still exists as an unused direct
  Gemini proxy under `/api/v1/ai/chat`; the Runner does not import it.
- External signals require provider API keys on the backend; the UI shows an
  explicit unavailable state when a key is missing.
- Goals panel is a CRUD list, not the richer goals analytics originally mocked in
  the Progress tab.
