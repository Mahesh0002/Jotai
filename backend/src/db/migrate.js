const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcryptjs');
const { initSchema, run, get, all, transaction, isInitialized, close } = require('./index');

const DEFAULT_USER_ID = 'local_user';
const DEMO_USERNAME = 'demo';
const DEMO_PASSWORD = 'demo1234';

/** Add columns introduced after the initial schema (safe to call repeatedly). */
function ensureColumns() {
  const additions = {
    users: {
      username: `TEXT`,
      email: `TEXT`,
      password_hash: `TEXT`,
    },
    preferences: {
      settings: `TEXT NOT NULL DEFAULT '{}'`,
      theme: `TEXT NOT NULL DEFAULT 'dark'`,
      integrations: `TEXT NOT NULL DEFAULT '{}'`,
    },
  };

  for (const [table, columns] of Object.entries(additions)) {
    const existing = new Set(all(`PRAGMA table_info(${table})`).map((row) => row.name));
    for (const [column, definition] of Object.entries(columns)) {
      if (!existing.has(column)) {
        run(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`);
      }
    }
  }
}

/**
 * Seed the database with default user and preferences
 */
async function seedDefaults() {
  const now = new Date().toISOString();

  // Check if user exists
  const existingUser = get('SELECT id FROM users WHERE id = ?', [DEFAULT_USER_ID]);
  if (!existingUser) {
    run(
      `INSERT INTO users (id, display_name, username, email, chronotype, created_at) VALUES (?, ?, ?, ?, ?, ?)`,
      [DEFAULT_USER_ID, 'Local User', 'local', 'local@jotai.local', 'unknown', now]
    );
    console.log('Created default user: local_user');
  }

  // Seed demo user with password
  const demoUser = get('SELECT id FROM users WHERE username = ?', [DEMO_USERNAME]);
  if (!demoUser) {
    const hash = await bcrypt.hash(DEMO_PASSWORD, 10);
    run(
      `INSERT INTO users (id, display_name, username, email, password_hash, chronotype, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [DEMO_USERNAME, 'Demo User', DEMO_USERNAME, 'demo@jotai.local', hash, 'unknown', now]
    );
    console.log(`Created demo user: demo / ${DEMO_PASSWORD}`);
  }

  // Seed default preferences
  const existingPrefs = get('SELECT user_id FROM preferences WHERE user_id = ?', [DEFAULT_USER_ID]);
  if (!existingPrefs) {
    run(
      `INSERT INTO preferences (
        user_id, calendar_ics_path, calendar_source, briefing_time, workout_time,
        focus_minutes, break_minutes, workout_days, chronotype, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        DEFAULT_USER_ID,
        './data/incoming.ics',
        'none',
        '07:00',
        '17:00',
        25,
        5,
        'mon,wed,fri',
        'unknown',
        now,
      ]
    );
    console.log('Created default preferences');
  }
}

/**
 * Run migration
 */
async function migrate() {
  console.log('Starting database migration...');

  // Schema statements are all IF NOT EXISTS, so always run them. This also
  // repairs databases that were only partially created by a failed migration.
  console.log(isInitialized() ? 'Ensuring schema...' : 'Creating schema...');
  initSchema();
  ensureColumns();
  console.log('Schema ready');

  console.log('Seeding defaults...');
  transaction(() => {
    seedDefaults();
  });

  console.log('Migration complete!');
  close();
}

// Run if called directly
if (require.main === module) {
  migrate().catch((err) => {
    console.error('Migration failed:', err);
    process.exit(1);
  });
}

module.exports = { migrate, seedDefaults, ensureColumns, DEFAULT_USER_ID };