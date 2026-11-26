const metricsRepository = require('../repositories/metricsRepository');
const focusRepository = require('../repositories/focusRepository');
const taskRepository = require('../repositories/taskRepository');
const habitRepository = require('../repositories/habitRepository');
const goalRepository = require('../repositories/goalRepository');
const calendarRepository = require('../repositories/calendarRepository');
const preferenceRepository = require('../repositories/preferenceRepository');

async function getContextSnapshot(userId) {
  const now = new Date();
  const today = new Date(now);
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  // Parallel queries for performance
  const [
    tasksRemaining,
    tasksCompletedToday,
    overdueTasks,
    focusBlocksToday,
    habitsData,
    goalsData,
    topTasks,
    nextEvents,
    activeFocus,
    prefs,
  ] = await Promise.all([
    taskRepository.count(userId, { status: { $ne: 'completed' }, due_date: { $gte: today.toISOString(), $lt: tomorrow.toISOString() } }),
    taskRepository.count(userId, { completed_at: { $gte: today.toISOString(), $lt: tomorrow.toISOString() } }),
    taskRepository.count(userId, { status: { $ne: 'completed' }, due_date: { $lt: today.toISOString() } }),
    focusRepository.query(
      `SELECT COALESCE(SUM(elapsed_seconds), 0) as total FROM focus_blocks
       WHERE user_id = ? AND status = 'completed' AND start_time >= ? AND start_time < ?`,
      [userId, today.toISOString(), tomorrow.toISOString()]
    ),
    habitRepository.getStats(userId),
    goalRepository.getStats(userId),
    taskRepository.find(userId, { where: { status: { $ne: 'completed' } }, orderBy: 'priority DESC, due_date ASC', limit: 5 }),
    calendarRepository.findByDateRange(userId, now.toISOString(), new Date(now.getTime() + 48 * 60 * 60 * 1000).toISOString()),
    focusRepository.findActive(userId),
    preferenceRepository.get(userId),
  ]);

  // Calculate XP and level (simple formula: 100 XP per level)
  const totalXp = await focusRepository.query(
    `SELECT COALESCE(SUM(elapsed_seconds), 0) / 60 as xp FROM focus_blocks WHERE user_id = ? AND status = 'completed'`,
    [userId]
  );
  const xp = Math.floor((totalXp?.[0]?.xp || 0) * 2); // 2 XP per focus minute
  const level = Math.floor(xp / 100) + 1;
  const xpToNext = (level * 100) - xp;

  // Available focus minutes from calendar gaps
  const availableFocusMinutes = focusRepository.getAvailableMinutes(userId, nextEvents);

  return {
    time: now.toISOString(),
    today: {
      tasks_remaining: tasksRemaining,
      tasks_completed: tasksCompletedToday,
      overdue_tasks: overdueTasks,
      focus_seconds_today: focusBlocksToday[0]?.total || 0,
      available_focus_minutes: availableFocusMinutes,
      habits_completed: habitsData.completed_today,
      habits_total: habitsData.total,
    },
    focus: {
      active: !!activeFocus,
      blockId: activeFocus?.id,
      startedAt: activeFocus?.start_time,
    },
    progress: {
      level,
      xp,
      xp_to_next: xpToNext,
    },
    goals: goalsData.active > 0 ? [
      { id: '', title: 'Active Goals', status: 'active', progress: goalsData.avg_progress }
    ] : [],
    top_tasks: topTasks.map(t => ({
      id: t.id,
      title: t.title,
      priority: t.priority,
      dueDate: t.due_date,
    })),
    next_events: nextEvents.slice(0, 5).map(e => ({
      title: e.title,
      start: e.start_time,
      end: e.end_time,
    })),
  };
}

async function getStatusSnapshot(userId) {
  return metricsRepository.getStatusSnapshot(userId);
}

async function getWeeklyMetrics(userId) {
  return metricsRepository.getWeekly(userId);
}

module.exports = {
  getContextSnapshot,
  getStatusSnapshot,
  getWeeklyMetrics,
};