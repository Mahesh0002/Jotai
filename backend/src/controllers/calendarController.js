const calendarService = require('../services/calendarService');
const calendarRepository = require('../repositories/calendarRepository');
const focusRepository = require('../repositories/focusRepository');
const eventBus = require('../services/eventBus').eventBus;
const preferenceRepository = require('../repositories/preferenceRepository');

/**
 * GET /api/v1/calendar/sync
 * Sync and return calendar events
 */
exports.syncCalendar = async (req, res, next) => {
  try {
    const userId = req.userId || 'local_user';
    const result = await calendarService.syncCalendar(userId);
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/v1/calendar/focus
 * Create a focus block AND rewrite the outbound ICS file
 */
exports.createFocusBlock = async (req, res, next) => {
  try {
    const userId = req.userId || 'local_user';
    const { title, taskId, startTime, endTime } = req.body;

    if (!title || !startTime || !endTime) {
      return res.status(400).json({ success: false, message: 'title, startTime, and endTime are required' });
    }

    const newBlock = {
      title,
      task_id: taskId || null,
      start_time: startTime,
      end_time: endTime,
      status: 'scheduled',
      source: 'assistant',
    };

    // Check for conflicts
    const conflictCheck = await calendarService.checkScheduleConstraints(userId, newBlock);
    if (conflictCheck.conflict) {
      return res.status(409).json({
        success: false,
        message: `Schedule conflict with ${conflictCheck.with}: ${conflictCheck.event.title}`,
        conflict: conflictCheck,
      });
    }

    // Create the focus block
    const block = focusRepository.create(userId, newBlock);

    // Write updated ICS file
    const prefs = preferenceRepository.get(userId);
    const outboundPath = prefs?.calendar_outbound_ics_path || './data/jotai-calendar.ics';
    const icsPath = await calendarService.writeCalendarIcs(userId, outboundPath);

    // Emit event
    eventBus.publish('SCHEDULE_UPDATED', { type: 'node', operation: 'calendar.focus' }, { blockId: block.id }, userId);

    res.status(201).json({
      success: true,
      data: { block, icsPath },
      ui: { invalidate: ['focus', 'today', 'calendar'] },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/v1/calendar/events
 * Get calendar events for a date range (alias for sync)
 */
exports.getCalendarEvents = async (req, res, next) => {
  try {
    const userId = req.userId || 'local_user';
    const startDate = req.query.startDate ? new Date(req.query.startDate) : new Date();
    const endDate = req.query.endDate
      ? new Date(req.query.endDate)
      : new Date(startDate.getTime() + 24 * 60 * 60 * 1000);

    const events = calendarRepository.findByDateRange(userId, startDate.toISOString(), endDate.toISOString());
    const prefs = preferenceRepository.get(userId);

    res.status(200).json({
      success: true,
      data: events,
      configured: prefs?.calendar_source !== 'none',
      source: prefs?.calendar_source || 'none',
    });
  } catch (error) {
    next(error);
  }
};