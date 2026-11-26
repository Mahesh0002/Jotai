const BaseRepository = require('./baseRepository');
const { run, all, get } = require('../db');

class GoalRepository extends BaseRepository {
  constructor() {
    super('goals');
  }

  findActive(userId) {
    return this.find(userId, { where: { status: 'active' }, orderBy: 'created_at DESC' });
  }

  findCompleted(userId) {
    return this.find(userId, { where: { status: 'completed' }, orderBy: 'updated_at DESC' });
  }

  getStats(userId) {
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);

    const active = get(
      `SELECT COUNT(*) as count FROM goals WHERE user_id = ? AND status = 'active'`,
      [userId]
    );

    const completedWeek = get(
      `SELECT COUNT(*) as count FROM goals WHERE user_id = ? AND status = 'completed' AND updated_at >= ?`,
      [userId, weekAgo.toISOString()]
    );

    const avgProgress = get(
      `SELECT AVG(progress) as avg FROM goals WHERE user_id = ? AND status = 'active'`,
      [userId]
    );

    return {
      active: active?.count || 0,
      completed_this_week: completedWeek?.count || 0,
      avg_progress: Math.round(avgProgress?.avg || 0),
    };
  }
}

module.exports = new GoalRepository();