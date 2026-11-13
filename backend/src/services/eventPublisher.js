const Redis = require('ioredis');
const { v4: uuidv4 } = require('uuid');

// Connect to Redis if configured, otherwise we can safely ignore or log for now.
// For Phase 1A, we'll try to connect to localhost Redis by default.
let redisClient = null;
try {
  redisClient = new Redis(process.env.REDIS_URL || 'redis://localhost:6379', {
    retryStrategy: (times) => Math.min(times * 50, 2000),
    maxRetriesPerRequest: 1, // Don't block forever if Redis is down
  });
  
  redisClient.on('error', (err) => {
    console.error('Redis error:', err.message);
  });
} catch (e) {
  console.warn('Could not initialize Redis client for EventPublisher');
}

/**
 * EventPublisher abstraction for emitting domain events to Redis Streams.
 * This is designed to be outbox-ready (e.g., later we can save to MongoDB first).
 */
class EventPublisher {
  /**
   * Publish a domain event.
   * @param {string} eventType e.g., 'TASK_COMPLETED'
   * @param {object} source e.g., { type: 'node', operation: 'task.complete' }
   * @param {object} data The event payload
   * @param {string} userId The user id (optional for now)
   */
  static async publish(eventType, source, data, userId = 'system') {
    const event = {
      eventId: uuidv4(),
      eventType,
      userId,
      timestamp: new Date().toISOString(),
      source,
      data
    };

    // TODO: For strict outbox pattern, save `event` to MongoDB Outbox collection here within a session/transaction.

    if (redisClient && redisClient.status === 'ready') {
      try {
        // XADD key * field stringified-value
        await redisClient.xadd(
          'jotai:events',
          '*',
          'payload',
          JSON.stringify(event)
        );
        console.log(`[EventPublisher] Published ${eventType} (${event.eventId})`);
      } catch (err) {
        console.error(`[EventPublisher] Failed to publish ${eventType} to Redis:`, err.message);
      }
    } else {
      console.log(`[EventPublisher] Redis not ready. Dropped event ${eventType} (${event.eventId})`);
    }

    return event;
  }
}

module.exports = EventPublisher;
