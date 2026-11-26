const { all } = require('../db');

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

/** Resolve the requested date window as ISO strings for SQLite comparisons. */
function getRange(req) {
  const { period, startDate, endDate } = req.query;
  const now = new Date();
  if (startDate && endDate) {
    return { start: new Date(startDate).toISOString(), end: new Date(endDate).toISOString() };
  }

  const start = new Date(now);
  start.setHours(0, 0, 0, 0);
  if (period === 'month') start.setMonth(start.getMonth() - 1);
  else if (period === 'year') start.setFullYear(start.getFullYear() - 1);
  else if (period === 'today') {
    // already start of today
  } else start.setDate(start.getDate() - 6);

  return { start: start.toISOString(), end: now.toISOString() };
}

function dayKeys(start, end) {
  const keys = [];
  const cursor = new Date(start);
  cursor.setUTCHours(0, 0, 0, 0);
  const last = new Date(end);
  last.setUTCHours(0, 0, 0, 0);
  while (cursor <= last && keys.length < 400) {
    keys.push(cursor.toISOString().slice(0, 10));
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }
  return keys;
}

function dayLabel(date) {
  return DAY_NAMES[new Date(`${date}T00:00:00Z`).getUTCDay()];
}

function categorize(block) {
  const text = `${block.title || ''} ${block.source || ''}`.toLowerCase();
  if (/break|rest/.test(text)) return 'breaks';
  if (/meeting|admin|call/.test(text)) return 'meetings';
  if (/creative|project|design|build/.test(text)) return 'projectWork';
  return 'deepWork';
}

// GET /api/v1/analytics/focus
exports.getFocusAnalytics = (req, res, next) => {
  try {
    const userId = req.userId || 'local_user';
    const { start, end } = getRange(req);
    const blocks = all(
      `SELECT * FROM focus_blocks
       WHERE user_id = ? AND status = 'completed' AND start_time >= ? AND start_time <= ?`,
      [userId, start, end]
    );

    const totals = { deepWork: 0, projectWork: 0, meetings: 0, breaks: 0 };
    const byDay = Object.fromEntries(dayKeys(start, end).map((day) => [day, 0]));
    for (const block of blocks) {
      const seconds = block.elapsed_seconds || 0;
      totals[categorize(block)] += seconds;
      const day = String(block.start_time).slice(0, 10);
      byDay[day] = (byDay[day] || 0) + seconds;
    }

    res.json({
      success: true,
      data: {
        ...totals,
        total: Object.values(totals).reduce((sum, value) => sum + value, 0),
        focusByDay: Object.keys(byDay)
          .sort()
          .map((date) => ({ date, day: dayLabel(date), focusSeconds: byDay[date] })),
      },
    });
  } catch (err) {
    next(err);
  }
};

// GET /api/v1/analytics/tasks
exports.getTasksAnalytics = (req, res, next) => {
  try {
    const userId = req.userId || 'local_user';
    const { start, end } = getRange(req);
    const tasks = all(
      `SELECT t.status, t.project_id, p.name AS project_name
       FROM tasks t LEFT JOIN projects p ON p.id = t.project_id
       WHERE t.user_id = ?
         AND ((t.due_date IS NOT NULL AND t.due_date >= ? AND t.due_date <= ?)
           OR (t.completed_at IS NOT NULL AND t.completed_at >= ? AND t.completed_at <= ?))`,
      [userId, start, end, start, end]
    );

    const groups = {};
    for (const task of tasks) {
      const label = task.project_name || 'Personal';
      const group = (groups[label] ||= { total: 0, completed: 0 });
      group.total += 1;
      if (task.status === 'completed') group.completed += 1;
    }

    const data = Object.entries(groups)
      .map(([label, group]) => ({
        id: label,
        label,
        completed: group.completed,
        total: group.total,
        percent: group.total ? Math.round((group.completed / group.total) * 100) : 0,
      }))
      .sort((a, b) => b.percent - a.percent);

    const allCompleted = data.reduce((sum, item) => sum + item.completed, 0);
    const allTotal = data.reduce((sum, item) => sum + item.total, 0);
    res.json({
      success: true,
      data: {
        all: {
          label: 'All Tasks',
          completed: allCompleted,
          total: allTotal,
          percent: allTotal ? Math.round((allCompleted / allTotal) * 100) : 0,
        },
        groups: data,
      },
    });
  } catch (err) {
    next(err);
  }
};

// GET /api/v1/analytics/xp
exports.getXpAnalytics = (req, res, next) => {
  try {
    const userId = req.userId || 'local_user';
    const { start, end } = getRange(req);
    const xpByDay = Object.fromEntries(dayKeys(start, end).map((day) => [day, 0]));
    const add = (timestamp, xp) => {
      if (!timestamp) return;
      const day = String(timestamp).slice(0, 10);
      if (day in xpByDay) xpByDay[day] += xp || 0;
    };

    for (const block of all(
      `SELECT end_time, elapsed_seconds FROM focus_blocks
       WHERE user_id = ? AND status = 'completed' AND end_time >= ? AND end_time <= ?`,
      [userId, start, end]
    )) {
      add(block.end_time, Math.round((block.elapsed_seconds || 0) / 60));
    }
    for (const task of all(
      `SELECT completed_at, xp_reward FROM tasks
       WHERE user_id = ? AND status = 'completed' AND completed_at >= ? AND completed_at <= ?`,
      [userId, start, end]
    )) {
      add(task.completed_at, task.xp_reward);
    }
    for (const habit of all(
      `SELECT completed_at FROM habit_completions
       WHERE user_id = ? AND status = 'completed' AND completed_at >= ? AND completed_at <= ?`,
      [userId, start, end]
    )) {
      add(habit.completed_at, 10);
    }

    res.json({
      success: true,
      data: Object.keys(xpByDay)
        .sort()
        .map((date) => ({ date, day: dayLabel(date), xp: xpByDay[date] })),
    });
  } catch (err) {
    next(err);
  }
};

// GET /api/v1/analytics/kpis
exports.getKpis = (req, res, next) => {
  try {
    const userId = req.userId || 'local_user';
    const { start, end } = getRange(req);
    const tasks = all(
      `SELECT status, xp_reward FROM tasks
       WHERE user_id = ?
         AND ((due_date IS NOT NULL AND due_date >= ? AND due_date <= ?)
           OR (completed_at IS NOT NULL AND completed_at >= ? AND completed_at <= ?))`,
      [userId, start, end, start, end]
    );
    const blocks = all(
      `SELECT elapsed_seconds, start_time FROM focus_blocks
       WHERE user_id = ? AND status = 'completed' AND start_time >= ? AND start_time <= ?`,
      [userId, start, end]
    );
    const habitCounts = all(
      `SELECT habit_id, COUNT(*) AS count FROM habit_completions
       WHERE user_id = ? AND status = 'completed' GROUP BY habit_id`,
      [userId]
    );
    const activeGoals = all(`SELECT COUNT(*) AS count FROM goals WHERE user_id = ? AND status = 'active'`, [userId])[0].count;

    const completedTasks = tasks.filter((task) => task.status === 'completed').length;
    const focusTimeSeconds = blocks.reduce((sum, block) => sum + (block.elapsed_seconds || 0), 0);
    const totalXp =
      tasks.filter((task) => task.status === 'completed').reduce((sum, task) => sum + (task.xp_reward || 0), 0) +
      blocks.reduce((sum, block) => sum + Math.round((block.elapsed_seconds || 0) / 60), 0) +
      all(
        `SELECT COUNT(*) AS count FROM habit_completions
         WHERE user_id = ? AND status = 'completed' AND completed_at >= ? AND completed_at <= ?`,
        [userId, start, end]
      )[0].count * 10;

    res.json({
      success: true,
      data: {
        completionRate: tasks.length ? Math.round((completedTasks / tasks.length) * 1000) / 10 : 0,
        focusTimeSeconds,
        bestStreak: habitCounts.reduce((max, row) => Math.max(max, row.count), 0),
        activeGoals,
        totalXp,
      },
    });
  } catch (err) {
    next(err);
  }
};
