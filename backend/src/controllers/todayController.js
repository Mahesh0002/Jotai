const taskRepository = require('../repositories/taskRepository');
const goalRepository = require('../repositories/goalRepository');
const focusRepository = require('../repositories/focusRepository');
const habitRepository = require('../repositories/habitRepository');
const calendarService = require('../services/calendarService');
const preferenceRepository = require('../repositories/preferenceRepository');

/**
 * GET /api/v1/today/summary
 * Returns TodaySummary shape for daily briefing
 */
exports.getSummary = async (req, res, next) => {
  try {
    const userId = req.userId || 'local_user';
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const [goals, focusBlocks, habitsDone, tasksDueToday, streak] = await Promise.all([
      goalRepository.find(userId),
      focusRepository.query(
        `SELECT COALESCE(SUM(elapsed_seconds), 0) as total FROM focus_blocks
         WHERE user_id = ? AND status = 'completed' AND start_time >= ? AND start_time < ?`,
        [userId, today.toISOString(), tomorrow.toISOString()]
      ),
      habitRepository.getTodayCompletions(userId),
      taskRepository.findDueToday(userId),
      // Calculate streak from habit completions
      (async () => {
        const habits = await habitRepository.findActive(userId);
        let maxStreak = 0;
        for (const h of habits) {
          const s = habitRepository.getStreak(userId, h.id);
          if (s > maxStreak) maxStreak = s;
        }
        return maxStreak;
      })(),
    ]);

    const questsCompleted = goals.filter(g => g.status === 'completed').length;
    const questsTotal = goals.length;

    res.status(200).json({
      success: true,
      data: {
        quests: { completed: questsCompleted, total: questsTotal },
        focus: { seconds: focusBlocks[0]?.total || 0 },
        streak,
        weeklyGoal: 64, // Could be from preferences
        habits: { completed: habitsDone.length, total: goals.length }, // habits total from active habits
        tasks: { dueToday: tasksDueToday.length, completedToday: 0, overdue: 0 },
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/v1/today/calendar
 * Returns calendar events from local ICS file (no external calls)
 */
exports.getCalendarEvents = async (req, res, next) => {
  try {
    const userId = req.userId || 'local_user';
    const start = req.query.startDate ? new Date(req.query.startDate) : new Date();
    const end = req.query.endDate
      ? new Date(req.query.endDate)
      : new Date(start.getTime() + 24 * 60 * 60 * 1000);

    const result = await calendarService.syncCalendar(userId);
    const events = result.events.filter(
      e => new Date(e.start_time) < end && new Date(e.end_time) > start
    );

    res.status(200).json({
      success: true,
      data: events,
      configured: result.configured,
      source: result.source,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/v1/today/insights
 * Deterministic focus window insight
 */
exports.getInsights = async (req, res, next) => {
  try {
    const userId = req.userId || 'local_user';
    const since = new Date();
    since.setDate(since.getDate() - 30);

    const blocks = await focusRepository.query(
      `SELECT start_time, elapsed_seconds FROM focus_blocks
       WHERE user_id = ? AND status = 'completed' AND start_time >= ?`,
      [userId, since.toISOString()]
    );

    if (blocks.length < 3) {
      return res.status(200).json({
        success: true,
        data: null,
        message: 'Complete at least three focus sessions to unlock an insight.',
      });
    }

    const minutesByHour = new Map();
    for (const block of blocks) {
      const date = new Date(block.start_time);
      if (Number.isNaN(date.getTime())) continue;
      const hour = date.getHours();
      const minutes = Number(block.elapsed_seconds || 0) / 60;
      minutesByHour.set(hour, (minutesByHour.get(hour) || 0) + minutes);
    }

    if (minutesByHour.size === 0) {
      return res.status(200).json({ success: true, data: null, message: 'No usable focus sessions yet.' });
    }

    const ranked = [...minutesByHour.entries()].sort((a, b) => b[1] - a[1]);
    const [bestHour, bestMinutes] = ranked[0];
    const totalMinutes = [...minutesByHour.values()].reduce((sum, v) => sum + v, 0);
    const averageMinutes = totalMinutes / minutesByHour.size;
    const lift = averageMinutes > 0
      ? Math.round(((bestMinutes - averageMinutes) / averageMinutes) * 100)
      : 0;
    const start = `${String(bestHour).padStart(2, '0')}:00`;
    const end = `${String((bestHour + 1) % 24).padStart(2, '0')}:00`;

    res.status(200).json({
      success: true,
      data: {
        type: 'focus_window',
        headline: lift > 0
          ? `You focus ${lift}% longer around ${start}–${end}.`
          : 'Your focus time is fairly even across the day.',
        description: `Based on ${blocks.length} completed focus sessions in the last 30 days. Your strongest window is ${start}–${end}, with ${Math.round(bestMinutes)} focused minutes.`,
        confidence: Math.min(0.95, 0.5 + blocks.length / 100),
      },
    });
  } catch (error) {
    next(error);
  }
};