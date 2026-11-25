# Smart Assistant Command Flow

How a chat message becomes a task, goal, habit, plan, or insight.

## 1. User intent (frontend)

`client/src/components/SmartAssistant.tsx` sends the raw text plus a stable
`sessionId`:

```http
POST http://localhost:8000/api/runner/trigger
Content-Type: application/json

{
  "intent": "Delete task 'Buy groceries'",
  "sessionId": "b0f2..."
}
```

The Runner keeps the last 6 turns server-side (`CHAT_HISTORY_TURNS`); the
client never sends unbounded history.

## 2. Routing (`runner/agents/router.py`)

The router runs in this order:

1. **Exact trigger** — scheduled/programmatic names such as `plan_tomorrow`,
   `habit_insight`, `task.delete`.
2. **Keyword rules** — deterministic keyword scores per intent.
3. **LLM classifier** — only when the rules tie or find nothing.
4. **UNKNOWN** — asks a clarifying question. It never silently defaults to PLAN.

Every classification logs the raw input, the chosen intent, and the stage.

## 3. Orchestrator (`runner/agents/orchestrator.py`)

- `TASK` / `GOAL` / `HABIT` → one LLM call with the domain's tool list.
- `PLAN` → `runner/agents/planning.py`.
- `INSIGHT` → `runner/agents/habit_insight.py`.
- `UNKNOWN` → static clarification.

The LLM never executes Python callables itself: Automatic Function Calling is
disabled, and the orchestrator routes the returned function call to the Action
Registry.

## 4. Confirmation (destructive actions)

`task.delete`, `goal.delete`, and `habit.delete` are registered with
`requires_confirmation=True`. The trigger response contains:

```json
{
  "success": true,
  "data": {
    "reply": "Confirmation required...",
    "actionResult": {
      "confirmationRequired": true,
      "actionId": "...",
      "actionName": "task.delete",
      "params": { "taskId": "123", "actionId": "..." }
    }
  }
}
```

The UI renders Approve/Decline. Approve calls:

```http
POST http://localhost:8000/api/runner/execute
Content-Type: application/json

{ "actionName": "task.delete", "params": { "taskId": "123" }, "actionId": "..." }
```

The store consumes the `actionId` exactly once, validates the action name, and
executes the **stored** params (so the payload cannot be swapped after
approval). Expired or replayed IDs are rejected.

## 5. Action handlers (Runner → Node)

Handlers in `runner/actions/*.py` call the Node REST API with the service token:

- `task.create` → `POST /api/v1/tasks`
- `task.complete` → `POST /api/v1/tasks/:id/complete`
- `task.delete` → `DELETE /api/v1/tasks/:id`
- `goal.create` / `goal.delete` → `/api/v1/goals`
- `habit.create` / `habit.delete` → `/api/v1/habits`

Python never connects to MongoDB.

## 6. Proposals (planning / habit insight / subtasks)

Planning and insight agents call `POST /api/v1/proposals` instead of mutating
schedules or tasks. The user accepts/rejects via:

```http
PATCH http://localhost:5000/api/v1/proposals/:id/status
{ "status": "accepted" }
```

Accepted/rejected proposals write a `DecisionLog` record. The pure-Python
profiler (`runner/services/stats.py`) aggregates those logs into a short
preference profile, which is injected into planning and habit prompts.

## 7. UI invalidation

Node action responses may include `ui.invalidate`. The frontend dispatches a
`jotai-invalidate` event so TanStack Query refetches affected data without a
page reload.

## Stub mode

With `LLM_PROVIDER=stub` (default), no live model is called. Tests script the
stub provider's responses. Stub mode is for tests and local plumbing checks, not
for demonstrating real tool selection.
