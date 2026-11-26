const EventEmitter = require('events');
const { v4: uuidv4 } = require('uuid');
const { run, all, get } = require('../db');

class EventBus extends EventEmitter {
  constructor() {
    super();
    this.setMaxListeners(100);
  }

  /**
   * Publish an event to the local EventEmitter and persist to app_events table
   */
  async publish(eventType, source, data, userId = 'local_user') {
    const event = {
      eventId: uuidv4(),
      eventType,
      userId,
      timestamp: new Date().toISOString(),
      source,
      data,
    };

    // Emit to local listeners (for long-poll notification)
    this.emit(eventType, event);
    this.emit('*', event);

    // Persist to database for long-poll consumers
    try {
      run(
        `INSERT INTO app_events (user_id, event_type, payload, created_at) VALUES (?, ?, ?, ?)`,
        [userId, eventType, JSON.stringify(event), event.timestamp]
      );
    } catch (err) {
      console.error('[EventBus] Failed to persist event:', err.message);
    }

    return event;
  }

  /**
   * Get events after a given ID for long-polling
   */
  async getEvents(userId, afterId, limit = 100) {
    const events = all(
      `SELECT * FROM app_events WHERE user_id = ? AND id > ? ORDER BY id ASC LIMIT ?`,
      [userId, afterId || 0, limit]
    );
    return events.map(e => ({
      ...e,
      payload: typeof e.payload === 'string' ? JSON.parse(e.payload) : e.payload,
    }));
  }

  /**
   * Get the latest event ID
   */
  async getLastEventId(userId) {
    const row = get(
      `SELECT MAX(id) as max_id FROM app_events WHERE user_id = ?`,
      [userId]
    );
    return row?.max_id || 0;
  }

  /**
   * Mark events as consumed (optional, for cleanup)
   */
  async markConsumed(userId, upToId) {
    run(
      `UPDATE app_events SET consumed_at = ? WHERE user_id = ? AND id <= ? AND consumed_at IS NULL`,
      [new Date().toISOString(), userId, upToId]
    );
  }
}

// Singleton instance
const eventBus = new EventBus();

module.exports = { EventBus, eventBus };