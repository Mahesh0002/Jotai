# Jötai Runner

Local-only FastAPI service for the agentic layer. It talks to the Node REST API;
Python never opens a MongoDB connection.

## Run

From the repository root:

```bash
python -m venv .venv
. .venv/bin/activate
pip install -r runner/requirements.txt
cp runner/.env.example runner/.env        # edit tokens if needed
LLM_PROVIDER=stub uvicorn runner.app:app --reload --port 8000
```

`LLM_PROVIDER=stub` is the default and never calls a live model. Tests use the
stub provider too.

## Endpoints

- `GET /health`
- `POST /api/runner/trigger` — `{intent, user_id?, sessionId?}`
- `POST /api/runner/execute` — `{actionName, params, actionId}`

Destructive actions (`task.delete`, `goal.delete`, `habit.delete`) return
`confirmationRequired` plus a single-use `actionId`. The client must send that
`actionId` back to `/execute`; it is stored in memory and expires after
`PENDING_ACTION_TTL_SECONDS` (default 600). Replaying it fails.

## Tests

```bash
LLM_PROVIDER=stub python -m pytest runner/ -q
```

## Known limits

- Local, single-process, no per-user scoping (the Node backend has none either).
- Chat history and pending confirmations are in memory; a restart clears them.
- Calendar data comes from the Node endpoint, which is currently **synthetic**
  (see `backend/src/controllers/todayController.js`), not a real calendar.
- Free-tier Gemini content may be used by Google; use synthetic data.
