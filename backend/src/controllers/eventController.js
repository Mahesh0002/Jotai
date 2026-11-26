const eventBus = require('../services/eventBus').eventBus;
const { serviceAuth } = require('../middlewares/serviceAuth');

/**
 * GET /api/v1/events
 * Long-poll for events
 * Query params: after (event ID), timeout (ms, default 20000)
 */
exports.getEvents = async (req, res, next) => {
  try {
    const userId = req.userId || 'local_user';
    const afterId = parseInt(req.query.after, 10) || 0;
    const timeout = Math.min(parseInt(req.query.timeout, 10) || 20000, 30000);

    // First check for existing events
    let events = await eventBus.getEvents(userId, afterId, 50);

    if (events.length > 0) {
      const lastId = events[events.length - 1].id;
      await eventBus.markConsumed(userId, lastId);
      return res.status(200).json({ success: true, data: { events, lastId } });
    }

    // No events, wait for new ones (long-poll)
    const waitPromise = new Promise((resolve) => {
      const handler = (event) => {
        if (event.userId === userId) {
          cleanup();
          resolve([event]);
        }
      };

      const cleanup = () => {
        eventBus.off('*', handler);
        clearTimeout(timer);
      };

      eventBus.on('*', handler);
      const timer = setTimeout(() => {
        cleanup();
        resolve([]);
      }, timeout);
    });

    const newEvents = await waitPromise;
    const lastId = newEvents.length > 0 ? newEvents[newEvents.length - 1].id : afterId;

    if (newEvents.length > 0) {
      await eventBus.markConsumed(userId, lastId);
    }

    res.status(200).json({ success: true, data: { events: newEvents, lastId } });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/v1/events
 * Internal endpoint to append events (service-to-service)
 * Requires serviceAuth middleware
 */
exports.postEvent = async (req, res, next) => {
  try {
    const { eventType, source, data, userId } = req.body;

    if (!eventType || !source || !data) {
      return res.status(400).json({ success: false, message: 'eventType, source, and data are required' });
    }

    const event = await eventBus.publish(eventType, source, data, userId || 'local_user');
    res.status(201).json({ success: true, data: event });
  } catch (error) {
    next(error);
  }
};