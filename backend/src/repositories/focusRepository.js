const BaseRepository = require('./baseRepository');
const { v4: uuidv4 } = require('uuid');
const { run, all, get, transaction } = require('../db');

class FocusRepository extends BaseRepository {
  constructor() {
    super('focus_blocks');
  }

  findByDateRange(userId, start, end) {
    return all(
      `SELECT * FROM focus_blocks WHERE user_id = ? AND start_time >= ? AND start_time < ? ORDER BY start_time ASC`,
      [userId, start, end]
    );
  }

  findActive(userId) {
    return get(
      `SELECT * FROM focus_blocks WHERE user_id = ? AND status = 'active' ORDER BY start_time ASC LIMIT 1`,
      [userId]
    );
  }

  findScheduled(userId) {
    const now = new Date().toISOString();
    return all(
      `SELECT * FROM focus_blocks WHERE user_id = ? AND status = 'scheduled' AND start_time >= ? ORDER BY start_time ASC`,
      [userId, now]
    );
  }

  getTodayStats(userId) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const todaySeconds = get(
      `SELECT COALESCE(SUM(elapsed_seconds), 0) as total FROM focus_blocks
       WHERE user_id = ? AND status = 'completed' AND start_time >= ? AND start_time < ?`,
      [userId, today.toISOString(), tomorrow.toISOString()]
    );

    const weekAgo = new Date(today);
    weekAgo.setDate(weekAgo.getDate() - 7);
    const weekSeconds = get(
      `SELECT COALESCE(SUM(elapsed_seconds), 0) as total FROM focus_blocks
       WHERE user_id = ? AND status = 'completed' AND start_time >= ?`,
      [userId, weekAgo.toISOString()]
    );

    const sessionsToday = get(
      `SELECT COUNT(*) as count FROM focus_blocks
       WHERE user_id = ? AND status = 'completed' AND start_time >= ? AND start_time < ?`,
      [userId, today.toISOString(), tomorrow.toISOString()]
    );

    // Best hour (hour with most focus minutes in last 30 days)
    const monthAgo = new Date(today);
    monthAgo.setDate(monthAgo.getDate() - 30);
    const bestHour = get(
      `SELECT CAST(strftime('%H', start_time) AS INTEGER) as hour,
              COALESCE(SUM(elapsed_seconds), 0) as total
       FROM focus_blocks
       WHERE user_id = ? AND status = 'completed' AND start_time >= ?
       GROUP BY hour
       ORDER BY total DESC
       LIMIT 1`,
      [userId, monthAgo.toISOString()]
    );

    return {
      today_seconds: todaySeconds?.total || 0,
      week_seconds: weekSeconds?.total || 0,
      sessions_today: sessionsToday?.count || 0,
      best_hour: bestHour?.hour ?? null,
    };
  }

  getAvailableMinutes(userId, calendarEvents = []) {
    // Calculate available focus minutes from now until end of day
    // excluding calendar events and scheduled focus blocks
    const now = new Date();
    const endOfDay = new Date(now);
    endOfDay.setHours(23, 59, 59, 999);

    const blocks = this.findScheduled(userId);
    const allEvents = [...calendarEvents, ...blocks.filter(b => b.status !== 'cancelled')];

    // Simple calculation: total minutes from now to end of day minus busy time
    const totalMinutes = Math.floor((endOfDay - now) / 60000);
    let busyMinutes = 0;

    for (const event of allEvents) {
      const eventStart = new Date(event.start_time);
      const eventEnd = new Date(event.end_time);
      if (eventEnd <= now || eventStart >= endOfDay) continue;

      const start = eventStart > now ? eventStart : now;
      const end = eventEnd < endOfDay ? eventEnd : endOfDay;
      busyMinutes += Math.max(0, Math.floor((end - start) / 60000));
    }

    return Math.max(0, totalMinutes - busyMinutes);
  }
}

module.exports = new FocusRepository();