const BaseRepository = require('./baseRepository');
const { v4: uuidv4 } = require('uuid');
const { run, all, get, transaction } = require('../db');

class CalendarRepository extends BaseRepository {
  constructor() {
    super('calendar_events');
  }

  findByDateRange(userId, start, end) {
    return all(
      `SELECT * FROM calendar_events WHERE user_id = ? AND start_time < ? AND end_time > ? ORDER BY start_time ASC`,
      [userId, end, start]
    );
  }

  upsertEvents(userId, events) {
    // events: [{ external_id, title, start_time, end_time, source }]
    const now = this.now();
    const results = [];
    for (const event of events) {
      if (!event.external_id) continue;
      const existing = get(
        `SELECT id FROM calendar_events WHERE user_id = ? AND external_id = ?`,
        [userId, event.external_id]
      );
      if (existing) {
        run(
          `UPDATE calendar_events SET title = ?, start_time = ?, end_time = ?, source = ?, synced_at = ?
           WHERE id = ?`,
          [event.title, event.start_time, event.end_time, event.source || 'ics', now, existing.id]
        );
        results.push({ ...event, id: existing.id });
      } else {
        const id = uuidv4();
        run(
          `INSERT INTO calendar_events (id, user_id, external_id, title, start_time, end_time, source, synced_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          [id, userId, event.external_id, event.title, event.start_time, event.end_time, event.source || 'ics', now]
        );
        results.push({ ...event, id });
      }
    }
    return results;
  }

  getSyncStatus(userId) {
    const count = get(
      `SELECT COUNT(*) as count FROM calendar_events WHERE user_id = ?`,
      [userId]
    );
    const lastSync = get(
      `SELECT MAX(synced_at) as last_synced FROM calendar_events WHERE user_id = ?`,
      [userId]
    );
    return {
      configured: (count?.count || 0) > 0,
      event_count: count?.count || 0,
      last_synced: lastSync?.last_synced || null,
    };
  }
}

module.exports = new CalendarRepository();