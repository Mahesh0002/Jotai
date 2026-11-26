const { v4: uuidv4 } = require('uuid');
const { all, get, run } = require('../db');

const userIdOf = (req) => req.userId || 'local_user';

function dayRange(req) {
  const { period, startDate, endDate } = req.query;
  const now = new Date();
  if (startDate && endDate) {
    return {
      start: new Date(startDate),
      end: new Date(endDate),
    };
  }

  const start = new Date(now);
  start.setHours(0, 0, 0, 0);
  if (period === 'month') start.setMonth(start.getMonth() - 1);
  else start.setDate(start.getDate() - 6);
  return { start, end: now };
}

function daysBetween(start, end) {
  const days = [];
  const cursor = new Date(start);
  cursor.setHours(0, 0, 0, 0);
  const last = new Date(end);
  last.setHours(0, 0, 0, 0);
  while (cursor <= last && days.length < 400) {
    days.push(cursor.toISOString().slice(0, 10));
    cursor.setDate(cursor.getDate() + 1);
  }
  return days;
}

// POST /api/v1/habits/:id/complete
// Toggle completion status for a specific date
exports.toggleCompletion = (req, res, next) => {
  try {
    const userId = userIdOf(req);
    const { date, status } = req.body;
    if (!date) return res.status(400).json({ success: false, error: 'Please provide a date' });

    const habit = get(`SELECT * FROM habits WHERE id = ? AND user_id = ?`, [req.params.id, userId]);
    if (!habit) return res.status(404).json({ success: false, error: 'Habit not found' });

    const existing = get(
      `SELECT * FROM habit_completions WHERE habit_id = ? AND user_id = ? AND date(completed_at) = ?`,
      [req.params.id, userId, date]
    );

    if (status === 'completed') {
      if (existing) {
        run(`UPDATE habit_completions SET status = 'completed' WHERE id = ?`, [existing.id]);
      } else {
        run(
          `INSERT INTO habit_completions (id, habit_id, user_id, completed_at, status)
           VALUES (?, ?, ?, ?, 'completed')`,
          [uuidv4(), req.params.id, userId, new Date().toISOString()]
        );
      }
    } else if (existing) {
      run(`DELETE FROM habit_completions WHERE id = ?`, [existing.id]);
    }

    res.status(200).json({
      success: true,
      data: { habit_id: req.params.id, date, status: status === 'completed' ? 'completed' : 'pending' },
      ui: { invalidate: ['habits', 'today', 'analytics'] },
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/v1/habits/analytics
// Computes score, streaks, and heatmap from SQLite completion rows
exports.getAnalytics = (req, res, next) => {
  try {
    const userId = userIdOf(req);
    const habits = all(`SELECT * FROM habits WHERE user_id = ? AND status = 'active'`, [userId]);
    const completions = all(
      `SELECT habit_id, completed_at FROM habit_completions WHERE user_id = ? AND status = 'completed'`,
      [userId]
    );

    const expected = habits.length * 7 || 1;
    const score = Math.min(100, Math.round((completions.length / expected) * 100));
    const streakByHabit = {};
    const heatmap = {};
    for (const completion of completions) {
      streakByHabit[completion.habit_id] = (streakByHabit[completion.habit_id] || 0) + 1;
      const day = String(completion.completed_at).slice(0, 10);
      heatmap[day] = (heatmap[day] || 0) + 1;
    }

    const streaks = habits
      .map((habit) => ({
        habitId: habit.id,
        name: habit.name,
        icon: habit.category,
        currentStreak: streakByHabit[habit.id] || 0,
      }))
      .sort((a, b) => b.currentStreak - a.currentStreak);

    res.status(200).json({
      success: true,
      data: {
        score,
        scoreTrend: 0,
        streaks,
        heatmap,
        topHabits: streaks.slice(0, 3).map((streak) => ({
          ...streak,
          completionRate: expected ? Math.round((streak.currentStreak / 7) * 100) : 0,
        })),
      },
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/v1/habits/consistency
// Returns completion data for the habit grid
exports.getConsistency = (req, res, next) => {
  try {
    const userId = userIdOf(req);
    const { start, end } = dayRange(req);
    const days = daysBetween(start, end);
    const habits = all(`SELECT * FROM habits WHERE user_id = ? AND status = 'active'`, [userId]);
    const completions = all(
      `SELECT habit_id, date(completed_at) AS day FROM habit_completions
       WHERE user_id = ? AND status = 'completed' AND date(completed_at) >= ? AND date(completed_at) <= ?`,
      [userId, days[0], days[days.length - 1]]
    );

    const completedByHabit = {};
    for (const completion of completions) {
      (completedByHabit[completion.habit_id] ||= new Set()).add(completion.day);
    }

    res.status(200).json({
      success: true,
      data: habits.map((habit) => {
        const completedDays = completedByHabit[habit.id] || new Set();
        return {
          id: habit.id,
          name: habit.name,
          streak: completedDays.size,
          days: days.map((day) => completedDays.has(day)),
        };
      }),
    });
  } catch (error) {
    next(error);
  }
};
