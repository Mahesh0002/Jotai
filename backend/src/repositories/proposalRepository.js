const BaseRepository = require('./baseRepository');
const { v4: uuidv4 } = require('uuid');
const { run, all, get, transaction } = require('../db');

class ProposalRepository extends BaseRepository {
  constructor() {
    super('proposals');
  }

  findPending(userId) {
    return this.find(userId, { where: { status: 'pending' }, orderBy: 'created_at DESC' });
  }

  findAll(userId) {
    return this.find(userId, { orderBy: 'created_at DESC' });
  }

  accept(userId, id) {
    const now = this.now();
    return this.update(userId, id, { status: 'accepted', updated_at: now });
  }

  reject(userId, id) {
    const now = this.now();
    return this.update(userId, id, { status: 'rejected', updated_at: now });
  }

  logDecision(userId, proposalId, actionType, accepted, context = {}) {
    const id = uuidv4();
    const now = this.now();
    run(
      `INSERT INTO decision_logs (id, user_id, proposal_id, action_type, accepted, context, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [id, userId, proposalId, actionType, accepted ? 1 : 0, JSON.stringify(context), now]
    );
    return { id, user_id: userId, proposal_id: proposalId, action_type: actionType, accepted: accepted ? 1 : 0, context, created_at: now };
  }

  getDecisions(userId, limit = 200) {
    return all(
      `SELECT * FROM decision_logs WHERE user_id = ? ORDER BY created_at DESC LIMIT ?`,
      [userId, limit]
    );
  }
}

module.exports = new ProposalRepository();