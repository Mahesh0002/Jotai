const fs = require('fs');
const path = require('path');

/** Creates an isolated SQLite database for a test file. Call before requiring app modules. */
function setupTestDb(name) {
  const file = path.join('/tmp/opencode', `jotai-${name}-${process.pid}.db`);
  for (const suffix of ['', '-wal', '-shm']) {
    try { fs.unlinkSync(file + suffix); } catch { /* not created yet */ }
  }

  process.env.DB_PATH = file;
  const db = require('../../src/db');
  db.initSchema();
  require('../../src/db/migrate').ensureColumns();
  db.run(
    `INSERT INTO users (id, display_name, chronotype, created_at) VALUES (?, ?, ?, ?)`,
    ['local_user', 'Local User', 'unknown', new Date().toISOString()]
  );

  return {
    db,
    file,
    cleanup() {
      db.close();
      for (const suffix of ['', '-wal', '-shm']) {
        try { fs.unlinkSync(file + suffix); } catch { /* already gone */ }
      }
    },
  };
}

module.exports = { setupTestDb };
