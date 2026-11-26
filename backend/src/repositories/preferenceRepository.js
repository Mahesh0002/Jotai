const BaseRepository = require('./baseRepository');
const { run, get } = require('../db');

class PreferenceRepository extends BaseRepository {
  constructor() {
    super('preferences', 'user_id');
  }

  get(userId) {
    return get(`SELECT * FROM preferences WHERE user_id = ?`, [userId]);
  }

  update(userId, data) {
    const now = this.now();
    const allowedKeys = Object.keys(data).filter(k => k !== 'user_id');
    if (allowedKeys.length === 0) return this.get(userId);

    const setClause = allowedKeys.map(k => `${k} = ?`).join(', ');
    const sql = `UPDATE preferences SET ${setClause}, updated_at = ? WHERE user_id = ?`;
    const values = [...allowedKeys.map(k => data[k]), now, userId];
    run(sql, values);
    return this.get(userId);
  }

  getMemorySummary(userId) {
    const row = get(`SELECT memory_summary, user_model FROM preferences WHERE user_id = ?`, [userId]);
    return {
      summary: row?.memory_summary || '',
      userModel: row?.user_model ? JSON.parse(row.user_model) : {},
    };
  }

  setMemorySummary(userId, summary, userModel = {}) {
    const now = this.now();
    run(
      `UPDATE preferences SET memory_summary = ?, user_model = ?, updated_at = ? WHERE user_id = ?`,
      [summary, JSON.stringify(userModel), now, userId]
    );
  }
}

module.exports = new PreferenceRepository();