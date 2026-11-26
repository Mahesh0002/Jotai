# Jōtai Backend Architecture - Implementation Summary

## Overview
This document summarizes the implementation of the backend architecture as specified in `docs/BACKEND_ARCHITECTURE.md`. The implementation replaces MongoDB/Redis with SQLite/local-only infrastructure, adds a conversational agent loop, semantic search, calendar integration, and proactive scheduling.

## Completed Components

### 1. Backend Database Layer (SQLite)
- **`backend/src/db/schema.sql`** - Complete SQLite DDL with all tables:
  - users, tasks, goals, habits, habit_completions
  - notes + notes_fts (FTS5 virtual table with triggers)
  - focus_blocks, calendar_events, proposals, decision_logs
  - suggestions, conversations, messages, executed_actions
  - preferences (with memory_summary, user_model), app_events
- **`backend/src/db/index.js`** - Database connection singleton with WAL mode
- **`backend/src/db/migrate.js`** - Migration script with default user/preferences seeding
- **`backend/src/repositories/*.js`** - Repository adapters for all entities:
  - baseRepository, taskRepository, goalRepository, habitRepository
  - noteRepository, focusRepository, proposalRepository
  - suggestionRepository, conversationRepository, calendarRepository
  - preferenceRepository, metricsRepository

### 2. Backend Services
- **`backend/src/services/eventBus.js`** - EventEmitter + SQLite persistence (replaces Redis)
- **`backend/src/services/calendarService.js`** - Local ICS parsing, sync, ICS writing, conflict checking
- **`backend/src/services/metricsService.js`** - Context snapshot, status, weekly metrics
- **`backend/src/middlewares/egressGuard.js`** - Blocks external routes in strict privacy mode

### 3. Backend Controllers (Updated for SQLite)
- **`assistantController.js`** - Real context snapshot (no mocks)
- **`calendarController.js`** - Local ICS sync, focus block creation + ICS writing
- **`metricsController.js`** - Status snapshot, weekly metrics
- **`conversationController.js`** - Durable conversation history
- **`eventController.js`** - Long-poll endpoint for events
- **`healthController.js`** - Health check with privacy mode status
- **`todayController.js`** - Local ICS calendar (no axios), real streak calculation
- **`noteController.js`** - FTS5 search + vector merge endpoint
- **`proposalController.js`** - Schedule proposal acceptance creates focus blocks + ICS
- **`taskController.js`** - Repository-based, event publishing, idempotency
- **`focusBlockController.js`** - Repository-based
- **`habitController.js`** - Repository-based, streak calculation

### 4. Backend Routes
- **Existing preserved**: `/tasks`, `/goals`, `/habits`, `/notes`, `/focus`, `/today`, `/proposals`, `/assistant`, `/auth`, `/users`, `/projects`, `/analytics`
- **New added**: `/calendar`, `/metrics`, `/conversations`, `/events`, `/health`
- **Removed**: `/weather`, `/stocks`, `/news`, `/ai`, `/integrations`

### 5. Backend Configuration
- **`backend/src/config/index.js`** - New env vars only (no external API keys)
- **`backend/.env.example`** - Local-only configuration
- **`backend/package.json`** - better-sqlite3 added; mongoose, ioredis, external SDKs removed
- **`backend/src/server.js`** - SQLite init, new routes, egress guard, privacy assertion

### 6. Runner (Python) - Agent Loop & Services
- **`runner/config.py`** - New settings (Ollama, privacy, scheduler, agent)
- **`runner/llm_provider.py`** - OllamaProvider + ToolSpec types; Gemini behind flag
- **`runner/services/ollama_provider.py`** - Ollama chat + embeddings
- **`runner/services/egress_guard.py`** - Startup assertion for local-only endpoints
- **`runner/services/knowledge_index.py`** - Local embeddings (numpy cosine), FTS fallback
- **`runner/services/memory_service.py`** - Persistent conversation summaries + user model
- **`runner/services/scheduler.py`** - APScheduler jobs (briefing, workout, breaks, reindex, weekly review)
- **`runner/agents/agent_loop.py`** - Multi-step conversational agent (replaces router + orchestrator)
- **`runner/agents/tool_registry.py`** - Flat tool descriptors (17 tools)
- **`runner/agents/workout.py`** - Workout suggestions from schedule gaps + habit history
- **`runner/api_client.py`** - All new Node API methods
- **`runner/events/consumer.py`** - Long-poll event consumer (replaces Redis)
- **`runner/app.py`** - FastAPI lifespan, egress guard, scheduler startup

### 7. Infrastructure
- **`docker-compose.yml`** - Ollama + Node + Runner services
- **`backend/Dockerfile`** & **`runner/Dockerfile`** - Container definitions
- **`Makefile`** - start, stop, logs, pull-model, test, smoke targets
- **`docs/CONTRACT_CHANGES.md`** - Record of all contract deviations

## Key Architectural Changes

### Privacy & Local-First
- Zero external network calls in strict mode
- Ollama for LLM + embeddings (local)
- Local ICS file for calendar (no CalDAV/Google OAuth)
- SQLite for all persistent state
- EventEmitter + long-poll instead of Redis

### Conversational Agent
- Replaced 6-intent rigid router with multi-step agent loop
- Tools for all data access (LLM never computes numbers)
- Persistent memory across restarts (200 messages, rolling summaries)
- Confirmation flow preserved for destructive actions

### Semantic Search
- Ollama `nomic-embed-text` embeddings cached in numpy matrix
- FTS5 for keyword search, merged with vector results
- Automatic reindex on note changes + periodic refresh

### Calendar Integration
- Read local ICS file → upsert to calendar_events
- Agent "update schedule from calendar" → propose_schedule → accept → write focus_blocks + jotai-calendar.ics
- Conflict detection reused from planning agent

### Proactive Scheduler
- Daily briefing (07:00) - narrated summary via LLM
- Workout nudge (17:00 on configured days) - finds free slot
- Break reminders - during active focus blocks
- Note reindex (every 5 min)
- Weekly review (Mon 08:00)

## Files Removed
- `backend/src/app.js` (stale duplicate)
- `backend/src/services/{weather,stock,news,ai,spotify,github}Service.js`
- `backend/src/controllers/{weather,stock,news,ai}Controller.js`
- `backend/src/routes/{weather,stock,news,ai,integration}Routes.js`
- `backend/src/models/News.js`
- `runner/agents/router.py` (replaced by agent_loop)
- `backend/package.json`: mongoose, ioredis, @google/generative-ai, axios removed
- `runner/requirements.txt`: redis removed; google-genai moved to optional

## Remaining Work (for full DoD)

### Testing
- [ ] Run `npm install` in backend (requires Node.js)
- [ ] Run `pip install -r requirements.txt` in runner (requires pip)
- [ ] Run migrations: `cd backend && node src/db/migrate.js`
- [ ] Start Ollama and pull models: `ollama pull qwen2.5:3b-instruct-q4_K_M && ollama pull nomic-embed-text`
- [ ] Run `make start` (requires Docker)
- [ ] Execute smoke tests from Makefile

### Minor Fixes Needed
- [ ] Habit completion streak calculation refinement
- [ ] Folder/Tag tables implementation (currently mocked)
- [ ] Project routes/controllers update
- [ ] Analytics routes/controllers update
- [ ] User routes/controllers update
- [ ] Preference API endpoints (GET/PATCH /preferences)
- [ ] Suggestion dedupe enforcement in assistant controller
- [ ] Executed actions table integration in all mutation endpoints

### Runner Polish
- [ ] Confirmation store integration with new tool registry
- [ ] Stats.py integration for user_model updates
- [ ] Planning agent conflict check mirroring in Node
- [ ] StubOllamaProvider for CI tests

## Verification Checklist (from spec §14)
- [ ] `make start` brings up whole system with one command
- [ ] `/health` on both services reports offline/strict mode
- [ ] Conversation spans follow-ups and survives restart
- [ ] "what is my status?" returns real computed numbers
- [ ] "find my notes about X" returns semantically relevant notes
- [ ] "update my schedule from my calendar" reads local ICS, proposes, writes ICS
- [ ] Daily briefing appears as suggestion at configured time
- [ ] Workout suggestion uses real free slot and habit history
- [ ] No non-loopback network calls (verify with `ss -tpn`)
- [ ] All §5 and §6 contracts unchanged or recorded in CONTRACT_CHANGES.md
- [ ] Test suites green