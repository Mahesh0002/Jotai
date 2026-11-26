-- Jōtai SQLite Schema
-- Run with: better-sqlite3 data/jotai.db < schema.sql
-- Or use the migration script: node backend/src/db/migrate.js

PRAGMA journal_mode=WAL;
PRAGMA foreign_keys=ON;
PRAGMA synchronous=NORMAL;
PRAGMA busy_timeout=5000;

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  display_name TEXT NOT NULL DEFAULT 'Local User',
  chronotype TEXT DEFAULT 'unknown',
  created_at TEXT NOT NULL
);

-- Tasks table
CREATE TABLE IF NOT EXISTS tasks (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id),
  title TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'not_started',
  priority TEXT NOT NULL DEFAULT 'medium',
  due_date TEXT,
  estimated_minutes INTEGER,
  project_id TEXT,
  tags TEXT NOT NULL DEFAULT '[]',
  subtasks TEXT NOT NULL DEFAULT '[]',
  is_starred INTEGER NOT NULL DEFAULT 0,
  completed_at TEXT,
  xp_reward INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_tasks_due ON tasks(user_id, due_date);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(user_id, status);
CREATE INDEX IF NOT EXISTS idx_tasks_project ON tasks(user_id, project_id);

-- Goals table
CREATE TABLE IF NOT EXISTS goals (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id),
  title TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'active',
  completed INTEGER NOT NULL DEFAULT 0,
  progress INTEGER NOT NULL DEFAULT 0 CHECK(progress BETWEEN 0 AND 100),
  due_date TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_goals_status ON goals(user_id, status);

-- Projects table (lightweight grouping for tasks)
CREATE TABLE IF NOT EXISTS projects (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id),
  name TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  color TEXT NOT NULL DEFAULT '#A855F7',
  status TEXT NOT NULL DEFAULT 'active',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_projects_user ON projects(user_id, status);

-- Habits table
CREATE TABLE IF NOT EXISTS habits (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id),
  name TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'general',
  frequency_type TEXT NOT NULL DEFAULT 'every_day',
  status TEXT NOT NULL DEFAULT 'active',
  created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_habits_status ON habits(user_id, status);

-- Habit completions table
CREATE TABLE IF NOT EXISTS habit_completions (
  id TEXT PRIMARY KEY,
  habit_id TEXT NOT NULL REFERENCES habits(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL,
  completed_at TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'completed'
);
CREATE INDEX IF NOT EXISTS idx_habit_completions_date ON habit_completions(user_id, completed_at);
CREATE INDEX IF NOT EXISTS idx_habit_completions_habit ON habit_completions(habit_id, completed_at);

-- Notes table
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
CREATE INDEX IF NOT EXISTS idx_notes_folder ON notes(user_id, folder_id);
CREATE INDEX IF NOT EXISTS idx_notes_last_edited ON notes(user_id, last_edited);

-- Notes FTS5 virtual table for full-text search
CREATE VIRTUAL TABLE IF NOT EXISTS notes_fts USING fts5(
  title, content, note_id UNINDEXED, content='notes', content_rowid='rowid'
);

-- Triggers to keep notes_fts in sync
CREATE TRIGGER IF NOT EXISTS notes_fts_insert AFTER INSERT ON notes BEGIN
  INSERT INTO notes_fts(rowid, title, content, note_id) VALUES (new.rowid, new.title, new.content, new.id);
END;

CREATE TRIGGER IF NOT EXISTS notes_fts_delete AFTER DELETE ON notes BEGIN
  INSERT INTO notes_fts(notes_fts, rowid, title, content, note_id) VALUES ('delete', old.rowid, old.title, old.content, old.id);
END;

CREATE TRIGGER IF NOT EXISTS notes_fts_update AFTER UPDATE ON notes BEGIN
  INSERT INTO notes_fts(notes_fts, rowid, title, content, note_id) VALUES ('delete', old.rowid, old.title, old.content, old.id);
  INSERT INTO notes_fts(rowid, title, content, note_id) VALUES (new.rowid, new.title, new.content, new.id);
END;

-- Focus blocks table
CREATE TABLE IF NOT EXISTS focus_blocks (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  title TEXT NOT NULL,
  task_id TEXT,
  start_time TEXT NOT NULL,
  end_time TEXT NOT NULL,
  elapsed_seconds INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'scheduled',
  source TEXT NOT NULL DEFAULT 'assistant',
  external_event_id TEXT,
  created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_focus_start ON focus_blocks(user_id, start_time);
CREATE INDEX IF NOT EXISTS idx_focus_status ON focus_blocks(user_id, status);
CREATE INDEX IF NOT EXISTS idx_focus_task ON focus_blocks(task_id);

-- Calendar events table
CREATE TABLE IF NOT EXISTS calendar_events (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  external_id TEXT,
  title TEXT NOT NULL,
  start_time TEXT NOT NULL,
  end_time TEXT NOT NULL,
  source TEXT NOT NULL DEFAULT 'ics',
  synced_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_cal_start ON calendar_events(user_id, start_time);
CREATE UNIQUE INDEX IF NOT EXISTS idx_cal_external ON calendar_events(user_id, external_id);

-- Proposals table
CREATE TABLE IF NOT EXISTS proposals (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  type TEXT NOT NULL,
  data TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  flags TEXT NOT NULL DEFAULT '[]',
  created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_proposals_status ON proposals(user_id, status);

-- Decision logs table
CREATE TABLE IF NOT EXISTS decision_logs (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  proposal_id TEXT,
  action_type TEXT NOT NULL,
  accepted INTEGER NOT NULL,
  context TEXT NOT NULL DEFAULT '{}',
  created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_decisions_proposal ON decision_logs(proposal_id);

-- Suggestions table
CREATE TABLE IF NOT EXISTS suggestions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  type TEXT NOT NULL,
  priority TEXT NOT NULL DEFAULT 'medium',
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  target_module TEXT NOT NULL,
  actions TEXT NOT NULL DEFAULT '[]',
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TEXT NOT NULL
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_suggestion_dedupe
  ON suggestions(user_id, type, target_module) WHERE status='pending';
CREATE INDEX IF NOT EXISTS idx_suggestions_status ON suggestions(user_id, status);

-- Conversations table
CREATE TABLE IF NOT EXISTS conversations (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  session_id TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_conv_session ON conversations(user_id, session_id);

-- Messages table
CREATE TABLE IF NOT EXISTS messages (
  id TEXT PRIMARY KEY,
  conversation_id TEXT NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  role TEXT NOT NULL,
  content TEXT NOT NULL,
  tool_calls TEXT,
  created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_msg_conv ON messages(conversation_id, created_at);

-- Executed actions table
CREATE TABLE IF NOT EXISTS executed_actions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  action_name TEXT NOT NULL,
  params TEXT NOT NULL,
  result TEXT NOT NULL,
  created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_executed_user ON executed_actions(user_id, created_at);

-- Preferences table (key-value style with user_id as PK for single-user)
CREATE TABLE IF NOT EXISTS preferences (
  user_id TEXT PRIMARY KEY REFERENCES users(id),
  calendar_ics_path TEXT,
  calendar_source TEXT NOT NULL DEFAULT 'none',
  briefing_time TEXT NOT NULL DEFAULT '07:00',
  workout_time TEXT NOT NULL DEFAULT '17:00',
  focus_minutes INTEGER NOT NULL DEFAULT 25,
  break_minutes INTEGER NOT NULL DEFAULT 5,
  workout_days TEXT NOT NULL DEFAULT 'mon,wed,fri',
  chronotype TEXT NOT NULL DEFAULT 'unknown',
  memory_summary TEXT,
  user_model TEXT,
  settings TEXT NOT NULL DEFAULT '{}',
  theme TEXT NOT NULL DEFAULT 'dark',
  integrations TEXT NOT NULL DEFAULT '{}',
  updated_at TEXT NOT NULL
);

-- App events table (replaces Redis streams)
CREATE TABLE IF NOT EXISTS app_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL,
  event_type TEXT NOT NULL,
  payload TEXT NOT NULL,
  created_at TEXT NOT NULL,
  consumed_at TEXT
);
CREATE INDEX IF NOT EXISTS idx_app_events_user ON app_events(user_id, id);
CREATE INDEX IF NOT EXISTS idx_app_events_type ON app_events(event_type);