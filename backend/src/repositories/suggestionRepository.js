const BaseRepository = require('./baseRepository');
const { v4: uuidv4 } = require('uuid');
const { run, all, get, transaction } = require('../db');

class SuggestionRepository extends BaseRepository {
  constructor() {
    super('suggestions');
  }

  findPending(userId, targetModule = null) {
    let sql = `SELECT * FROM suggestions WHERE user_id = ? AND status = 'pending'`;
    const params = [userId];

    if (targetModule) {
      sql += ` AND target_module = ?`;
      params.push(targetModule);
    }
    sql += ` ORDER BY priority DESC, created_at DESC`;
    return all(sql, params);
  }

  findByTypeAndTarget(userId, type, targetModule) {
    return get(
      `SELECT * FROM suggestions WHERE user_id = ? AND type = ? AND target_module = ? AND status = 'pending'`,
      [userId, type, targetModule]
    );
  }

  create(userId, data) {
    // Check for duplicate pending suggestion
    const existing = this.findByTypeAndTarget(userId, data.type, data.targetModule);
    if (existing) {
      return existing;
    }
    return super.create(userId, data);
  }

  updateStatus(userId, id, action) {
    const statusMap = {
      accept: 'accepted',
      dismiss: 'dismissed',
      execute: 'executed',
    };
    const status = statusMap[action];
    if (!status) throw new Error(`Invalid action: ${action}`);
    return this.update(userId, id, { status });
  }

  cleanupExpired(userId) {
    const now = this.now();
    // Mark suggestions older than 24 hours as expired
    return run(
      `UPDATE suggestions SET status = 'expired' WHERE user_id = ? AND status = 'pending' AND datetime(created_at) < datetime(?, '-24 hours')`,
      [userId, now]
    );
  }
}

module.exports = new SuggestionRepository();