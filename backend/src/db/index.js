const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

let db = null;

/**
 * Get the database instance (lazy singleton)
 * @returns {Database}
 */
function getDb() {
  if (!db) {
    const dbPath = process.env.DB_PATH || './data/jotai.db';
    const dir = path.dirname(dbPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    db = new Database(dbPath);
    // Enable WAL mode and foreign keys
    db.pragma('journal_mode = WAL');
    db.pragma('foreign_keys = ON');
    db.pragma('synchronous = NORMAL');
    db.pragma('busy_timeout = 5000');
  }
  return db;
}

/**
 * Execute a query that modifies data (INSERT, UPDATE, DELETE)
 * @param {string} sql
 * @param {Array} params
 * @returns {object} { lastInsertRowid, changes }
 */
function run(sql, params = []) {
  const stmt = getDb().prepare(sql);
  const result = stmt.run(...params);
  return { lastInsertRowid: result.lastInsertRowid, changes: result.changes };
}

/**
 * Execute a query and return all rows
 * @param {string} sql
 * @param {Array} params
 * @returns {Array}
 */
function all(sql, params = []) {
  const stmt = getDb().prepare(sql);
  return stmt.all(...params);
}

/**
 * Execute a query and return the first row
 * @param {string} sql
 * @param {Array} params
 * @returns {object|null}
 */
function get(sql, params = []) {
  const stmt = getDb().prepare(sql);
  return stmt.get(...params);
}

/**
 * Execute a query and return a single value
 * @param {string} sql
 * @param {Array} params
 * @returns {any}
 */
function getValue(sql, params = []) {
  const row = get(sql, params);
  if (!row) return null;
  const keys = Object.keys(row);
  return row[keys[0]];
}

/**
 * Execute a transaction
 * @param {Function} fn
 * @returns {any}
 */
function transaction(fn) {
  const tx = getDb().transaction(fn);
  return tx();
}

/**
 * Close the database connection
 */
function close() {
  if (db) {
    db.close();
    db = null;
  }
}

/**
 * Initialize the database schema
 */
function initSchema() {
  const schemaPath = path.join(__dirname, 'schema.sql');
  const schema = fs.readFileSync(schemaPath, 'utf8');
  // Schema contains trigger bodies with internal semicolons; exec() handles
  // the full script correctly.
  getDb().exec(schema);
}

/**
 * Check if database is initialized (has users table)
 */
function isInitialized() {
  try {
    const result = get("SELECT name FROM sqlite_master WHERE type='table' AND name='users'");
    return !!result;
  } catch {
    return false;
  }
}

module.exports = {
  getDb,
  run,
  all,
  get,
  getValue,
  transaction,
  close,
  initSchema,
  isInitialized,
};