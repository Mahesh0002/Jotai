const { v4: uuidv4 } = require('uuid');
const { run, all, get, transaction } = require('../db');

const columnCache = new Map();

class BaseRepository {
  constructor(tableName, idColumn = 'id') {
    this.tableName = tableName;
    this.idColumn = idColumn;
  }

  /**
   * Generate a new UUID
   */
  generateId() {
    return uuidv4();
  }

  /**
   * Get current timestamp in ISO format
   */
  now() {
    return new Date().toISOString();
  }

  /**
   * Find all records for a user
   * @param {string} userId
   * @param {object} options - { where, orderBy, limit, offset }
   */
  find(userId, options = {}) {
    let sql = `SELECT * FROM ${this.tableName} WHERE user_id = ?`;
    const params = [userId];

    if (options.where) {
      const clauses = [];
      for (const [key, value] of Object.entries(options.where)) {
        if (value === null) {
          clauses.push(`${key} IS NULL`);
        } else if (value && typeof value === 'object' && '$ne' in value) {
          clauses.push(`${key} != ?`);
          params.push(value.$ne);
        } else {
          clauses.push(`${key} = ?`);
          params.push(value);
        }
      }
      if (clauses.length) {
        sql += ` AND ${clauses.join(' AND ')}`;
      }
    }

    if (options.orderBy) {
      sql += ` ORDER BY ${options.orderBy}`;
    }

    if (options.limit) {
      sql += ` LIMIT ?`;
      params.push(options.limit);
      if (options.offset) {
        sql += ` OFFSET ?`;
        params.push(options.offset);
      }
    }

    return all(sql, params);
  }

  /**
   * Find a single record by ID and user
   */
  findById(userId, id) {
    return get(
      `SELECT * FROM ${this.tableName} WHERE user_id = ? AND ${this.idColumn} = ?`,
      [userId, id]
    );
  }

  /** Cached set of real columns, since not every table tracks updated_at. */
  columns() {
    if (!columnCache.has(this.tableName)) {
      const rows = all(`PRAGMA table_info(${this.tableName})`);
      columnCache.set(this.tableName, new Set(rows.map(row => row.name)));
    }
    return columnCache.get(this.tableName);
  }

  /**
   * Create a new record
   * @param {string} userId
   * @param {object} data
   */
  create(userId, data) {
    const id = data.id || this.generateId();
    const now = this.now();
    const available = this.columns();

    const columns = ['user_id', this.idColumn];
    const values = [userId, id];
    if (available.has('created_at')) {
      columns.push('created_at');
      values.push(now);
    }
    if (available.has('updated_at')) {
      columns.push('updated_at');
      values.push(now);
    }
    for (const [key, value] of Object.entries(data)) {
      if (key === 'id' || key === 'user_id' || key === 'created_at' || key === 'updated_at' || !available.has(key)) continue;
      columns.push(key);
      values.push(value);
    }

    const placeholders = columns.map(() => '?').join(', ');
    const sql = `INSERT INTO ${this.tableName} (${columns.join(', ')}) VALUES (${placeholders})`;
    run(sql, values);
    return this.findById(userId, id);
  }

  /**
   * Update a record
   * @param {string} userId
   * @param {string} id
   * @param {object} data
   */
  update(userId, id, data) {
    const now = this.now();
    const available = this.columns();
    const assignments = Object.entries(data)
      .filter(([key]) => !['id', 'user_id', 'created_at', 'updated_at'].includes(key) && available.has(key));

    if (available.has('updated_at')) {
      assignments.push(['updated_at', now]);
    }
    if (assignments.length === 0) return this.findById(userId, id);

    const setClause = assignments.map(([key]) => `${key} = ?`).join(', ');
    const sql = `UPDATE ${this.tableName} SET ${setClause} WHERE user_id = ? AND ${this.idColumn} = ?`;

    const values = [...assignments.map(([, value]) => value), userId, id];
    run(sql, values);
    return this.findById(userId, id);
  }

  /**
   * Delete a record
   * @param {string} userId
   * @param {string} id
   */
  delete(userId, id) {
    const result = run(
      `DELETE FROM ${this.tableName} WHERE user_id = ? AND ${this.idColumn} = ?`,
      [userId, id]
    );
    return result.changes > 0;
  }

  /**
   * Count records for a user
   */
  count(userId, where = {}) {
    let sql = `SELECT COUNT(*) as count FROM ${this.tableName} WHERE user_id = ?`;
    const params = [userId];

    if (Object.keys(where).length > 0) {
      const conditions = Object.entries(where)
        .map(([key, value]) => {
          if (value === null) return `${key} IS NULL`;
          return `${key} = ?`;
        })
        .join(' AND ');
      if (conditions) {
        sql += ` AND ${conditions}`;
        params.push(...Object.values(where).filter(v => v !== null));
      }
    }

    const row = get(sql, params);
    return row ? row.count : 0;
  }

  /**
   * Execute a custom query
   */
  query(sql, params = []) {
    return all(sql, params);
  }

  /**
   * Execute a custom query returning one row
   */
  queryOne(sql, params = []) {
    return get(sql, params);
  }
}

module.exports = BaseRepository;