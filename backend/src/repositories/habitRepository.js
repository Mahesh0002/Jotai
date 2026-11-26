const BaseRepository = require('./baseRepository');
const { v4: uuidv4 } = require('uuid');
const { run, all, get, transaction } = require('../db');

class HabitRepository extends BaseRepository {
  constructor() {
    super('habits');
  }

  findActive(userId) {
    return this.find(userId, { where: { status: 'active' }, orderBy: 'created_at DESC' });
  }

  findByCategory(userId, category) {
    return this.find(userId, { where: { category, status: 'active' }, orderBy: 'name ASC' });
  }

  // Habit completions
  addCompletion(userId, habitId) {
    const id = uuidv4();
    const now = this.now();
    run(
      `INSERT INTO habit_completions (id, habit_id, user_id, completed_at, status) VALUES (?, ?, ?, ?, 'completed')`,
      [id, habitId, userId, now]
    );
    return { id, habit_id: habitId, user_id: userId, completed_at: now, status: 'completed' };
  }

  getCompletions(userId, habitId, startDate, endDate) {
    let sql = `SELECT * FROM habit_completions WHERE user_id = ? AND habit_id = ?`;
    const params = [userId, habitId];

    if (startDate) {
      sql += ` AND completed_at >= ?`;
      params.push(startDate);
    }
    if (endDate) {
      sql += ` AND completed_at < ?`;
      params.push(endDate);
    }
    sql += ` ORDER BY completed_at DESC`;
    return all(sql, params);
  }

  getTodayCompletions(userId) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    return all(
      `SELECT hc.*, h.name, h.category FROM habit_completions hc
       JOIN habits h ON hc.habit_id = h.id
       WHERE hc.user_id = ? AND hc.completed_at >= ? AND hc.completed_at < ?
       ORDER BY hc.completed_at DESC`,
      [userId, today.toISOString(), tomorrow.toISOString()]
    );
  }

  getStreak(userId, habitId) {
    // Calculate current streak (consecutive days with completion)
    const completions = all(
      `SELECT DISTINCT date(completed_at) as day FROM habit_completions
       WHERE user_id = ? AND habit_id = ? AND status = 'completed'
       ORDER BY day DESC`,
      [userId, habitId]
    );

    if (completions.length === 0) return 0;

    let streak = 0;
    let expectedDate = new Date();
    expectedDate.setHours(0, 0, 0, 0);

    for (const c of completions) {
      const compDate = new Date(c.day + 'T00:00:00');
      const diffDays = Math.floor((expectedDate - compDate) / (1000 * 60 * 60 * 24));

      if (diffDays === 0) {
        streak++;
        expectedDate.setDate(expectedDate.getDate() - 1);
      } else if (diffDays === 1 && streak === 0) {
        // Missed today but completed yesterday - streak continues from yesterday
        streak++;
        expectedDate.setDate(expectedDate.getDate() - 1);
      } else {
        break;
      }
    }
    return streak;
  }

  getStats(userId) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const total = get(
      `SELECT COUNT(*) as count FROM habits WHERE user_id = ? AND status = 'active'`,
      [userId]
    );

    const completedToday = get(
      `SELECT COUNT(DISTINCT habit_id) as count FROM habit_completions
       WHERE user_id = ? AND completed_at >= ? AND completed_at < ? AND status = 'completed'`,
      [userId, today.toISOString(), tomorrow.toISOString()]
    );

    // Get max streak across all habits
    const habits = this.findActive(userId);
    let maxStreak = 0;
    for (const habit of habits) {
      const streak = this.getStreak(userId, habit.id);
      if (streak > maxStreak) maxStreak = streak;
    }

    return {
      completed_today: completedToday?.count || 0,
      total: total?.count || 0,
      current_streak: maxStreak,
    };
  }

  getWorkoutHistory(userId, weeks = 8) {
    const since = new Date();
    since.setDate(since.getDate() - weeks * 7);

    return all(
      `SELECT hc.completed_at, h.name FROM habit_completions hc
       JOIN habits h ON hc.habit_id = h.id
       WHERE hc.user_id = ? AND h.category = 'workout' AND hc.completed_at >= ?
       ORDER BY hc.completed_at DESC`,
      [userId, since.toISOString()]
    );
  }
}

module.exports = new HabitRepository();