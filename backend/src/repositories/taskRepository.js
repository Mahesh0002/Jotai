const BaseRepository = require('./baseRepository');
const { run, all, get, transaction } = require('../db');

class TaskRepository extends BaseRepository {
  constructor() {
    super('tasks');
  }

  findByStatus(userId, status) {
    return this.find(userId, { where: { status }, orderBy: 'due_date ASC' });
  }

  findDueToday(userId) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    return all(
      `SELECT * FROM tasks WHERE user_id = ? AND due_date >= ? AND due_date < ? AND status != 'completed' ORDER BY due_date ASC`,
      [userId, today.toISOString(), tomorrow.toISOString()]
    );
  }

  findOverdue(userId) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return all(
      `SELECT * FROM tasks WHERE user_id = ? AND due_date < ? AND status != 'completed' ORDER BY due_date ASC`,
      [userId, today.toISOString()]
    );
  }

  findByProject(userId, projectId) {
    return this.find(userId, { where: { project_id: projectId }, orderBy: 'due_date ASC' });
  }

  complete(userId, id) {
    const now = this.now();
    return this.update(userId, id, {
      status: 'completed',
      completed_at: now,
    });
  }

  getStats(userId) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const weekAgo = new Date(today);
    weekAgo.setDate(weekAgo.getDate() - 7);

    const dueToday = get(
      `SELECT COUNT(*) as count FROM tasks WHERE user_id = ? AND due_date >= ? AND due_date < ? AND status != 'completed'`,
      [userId, today.toISOString(), tomorrow.toISOString()]
    );

    const completedToday = get(
      `SELECT COUNT(*) as count FROM tasks WHERE user_id = ? AND completed_at >= ? AND completed_at < ?`,
      [userId, today.toISOString(), tomorrow.toISOString()]
    );

    const overdue = get(
      `SELECT COUNT(*) as count FROM tasks WHERE user_id = ? AND due_date < ? AND status != 'completed'`,
      [userId, today.toISOString()]
    );

    const completedWeek = get(
      `SELECT COUNT(*) as count FROM tasks WHERE user_id = ? AND completed_at >= ?`,
      [userId, weekAgo.toISOString()]
    );

    const dueWeek = get(
      `SELECT COUNT(*) as count FROM tasks WHERE user_id = ? AND due_date >= ?`,
      [userId, weekAgo.toISOString()]
    );

    return {
      due_today: dueToday?.count || 0,
      completed_today: completedToday?.count || 0,
      overdue: overdue?.count || 0,
      completion_rate_7d: dueWeek?.count > 0 ? Math.round((completedWeek?.count || 0) / dueWeek.count * 100) : 0,
    };
  }
}

module.exports = new TaskRepository();