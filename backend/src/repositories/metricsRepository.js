const { all, get } = require('../db');

class MetricsRepository {
  getWeekly(userId) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Daily trend for last 7 days
    const trend = [];
    for (let i = 6; i >= 0; i--) {
      const day = new Date(today);
      day.setDate(day.getDate() - i);
      const nextDay = new Date(day);
      nextDay.setDate(nextDay.getDate() + 1);

      const dayStart = day.toISOString();
      const dayEnd = nextDay.toISOString();

      const focusMinutes = get(
        `SELECT COALESCE(SUM(elapsed_seconds), 0) / 60.0 as minutes FROM focus_blocks
         WHERE user_id = ? AND status = 'completed' AND start_time >= ? AND start_time < ?`,
        [userId, dayStart, dayEnd]
      );

      const tasksDue = get(
        `SELECT COUNT(*) as count FROM tasks
         WHERE user_id = ? AND due_date >= ? AND due_date < ?`,
        [userId, dayStart, dayEnd]
      );

      const tasksCompleted = get(
        `SELECT COUNT(*) as count FROM tasks
         WHERE user_id = ? AND completed_at >= ? AND completed_at < ?`,
        [userId, dayStart, dayEnd]
      );

      const habitCompletions = get(
        `SELECT COUNT(DISTINCT habit_id) as count FROM habit_completions
         WHERE user_id = ? AND completed_at >= ? AND completed_at < ? AND status = 'completed'`,
        [userId, dayStart, dayEnd]
      );

      trend.push({
        date: day.toISOString().split('T')[0],
        focus_minutes: Math.round(focusMinutes?.minutes || 0),
        tasks_due: tasksDue?.count || 0,
        tasks_completed: tasksCompleted?.count || 0,
        habits_completed: habitCompletions?.count || 0,
      });
    }

    // Focus minutes (last 7 days)
    const weekAgo = new Date(today);
    weekAgo.setDate(weekAgo.getDate() - 7);
    const focusMinutes = get(
      `SELECT COALESCE(SUM(elapsed_seconds), 0) / 60.0 as minutes FROM focus_blocks
       WHERE user_id = ? AND status = 'completed' AND start_time >= ?`,
      [userId, weekAgo.toISOString()]
    );

    // Task completion rate (last 7 days)
    const tasksDueWeek = get(
      `SELECT COUNT(*) as count FROM tasks WHERE user_id = ? AND due_date >= ?`,
      [userId, weekAgo.toISOString()]
    );
    const tasksCompletedWeek = get(
      `SELECT COUNT(*) as count FROM tasks WHERE user_id = ? AND completed_at >= ?`,
      [userId, weekAgo.toISOString()]
    );

    // Plan adherence: accepted schedule proposals with completed focus blocks / total accepted
    const acceptedProposals = get(
      `SELECT COUNT(*) as count FROM proposals WHERE user_id = ? AND type = 'schedule_proposal' AND status = 'accepted'`,
      [userId]
    );
    const completedFromProposals = get(
      `SELECT COUNT(DISTINCT fb.id) as count FROM focus_blocks fb
       JOIN proposals p ON fb.task_id IN (SELECT json_extract(value, '$.taskId') FROM json_each(p.data))
       WHERE fb.user_id = ? AND fb.status = 'completed' AND p.status = 'accepted'`,
      [userId]
    );

    // Break regularity: accepted break suggestions / sent break reminders
    const breakRemindersSent = get(
      `SELECT COUNT(*) as count FROM suggestions WHERE user_id = ? AND type = 'break_reminder'`,
      [userId]
    );
    const breakRemindersAccepted = get(
      `SELECT COUNT(*) as count FROM suggestions WHERE user_id = ? AND type = 'break_reminder' AND status IN ('accepted', 'executed')`,
      [userId]
    );

    // Workout consistency
    const workoutDays = all(
      `SELECT DISTINCT date(completed_at) as day FROM habit_completions hc
       JOIN habits h ON hc.habit_id = h.id
       WHERE hc.user_id = ? AND h.category = 'workout' AND hc.status = 'completed'
       AND hc.completed_at >= ?`,
      [userId, weekAgo.toISOString()]
    );
    const prefs = get(`SELECT workout_days FROM preferences WHERE user_id = ?`, [userId]);
    const plannedDays = prefs?.workout_days ? prefs.workout_days.split(',').length : 3;
    const workoutConsistency = plannedDays > 0 ? Math.round((workoutDays.length / plannedDays) * 100) : 0;

    return {
      focus_minutes: Math.round(focusMinutes?.minutes || 0),
      task_completion_rate: tasksDueWeek?.count > 0 ? Math.round((tasksCompletedWeek?.count || 0) / tasksDueWeek.count * 100) : 0,
      plan_adherence: acceptedProposals?.count > 0 ? Math.round((completedFromProposals?.count || 0) / acceptedProposals.count * 100) : 0,
      break_regularity: breakRemindersSent?.count > 0 ? Math.round((breakRemindersAccepted?.count || 0) / breakRemindersSent.count * 100) : 0,
      workout_consistency: workoutConsistency,
      trend,
    };
  }

  getStatusSnapshot(userId) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const weekAgo = new Date(today);
    weekAgo.setDate(weekAgo.getDate() - 7);

    // Focus
    const focus = get(
      `SELECT
         COALESCE(SUM(CASE WHEN start_time >= ? AND start_time < ? THEN elapsed_seconds ELSE 0 END), 0) as today_seconds,
         COALESCE(SUM(CASE WHEN start_time >= ? THEN elapsed_seconds ELSE 0 END), 0) as week_seconds,
         COALESCE(SUM(CASE WHEN start_time >= ? AND start_time < ? THEN 1 ELSE 0 END), 0) as sessions_today
       FROM focus_blocks WHERE user_id = ? AND status = 'completed'`,
      [today.toISOString(), tomorrow.toISOString(), weekAgo.toISOString(), today.toISOString(), tomorrow.toISOString(), userId]
    );

    // Best hour (last 30 days)
    const monthAgo = new Date(today);
    monthAgo.setDate(monthAgo.getDate() - 30);
    const bestHour = get(
      `SELECT CAST(strftime('%H', start_time) AS INTEGER) as hour,
              COALESCE(SUM(elapsed_seconds), 0) as total
       FROM focus_blocks
       WHERE user_id = ? AND status = 'completed' AND start_time >= ?
       GROUP BY hour ORDER BY total DESC LIMIT 1`,
      [userId, monthAgo.toISOString()]
    );

    // Tasks
    const tasksDueToday = get(
      `SELECT COUNT(*) as count FROM tasks WHERE user_id = ? AND due_date >= ? AND due_date < ? AND status != 'completed'`,
      [userId, today.toISOString(), tomorrow.toISOString()]
    );
    const tasksCompletedToday = get(
      `SELECT COUNT(*) as count FROM tasks WHERE user_id = ? AND completed_at >= ? AND completed_at < ?`,
      [userId, today.toISOString(), tomorrow.toISOString()]
    );
    const tasksOverdue = get(
      `SELECT COUNT(*) as count FROM tasks WHERE user_id = ? AND due_date < ? AND status != 'completed'`,
      [userId, today.toISOString()]
    );
    const tasksDueWeek = get(
      `SELECT COUNT(*) as count FROM tasks WHERE user_id = ? AND due_date >= ?`,
      [userId, weekAgo.toISOString()]
    );
    const tasksCompletedWeek = get(
      `SELECT COUNT(*) as count FROM tasks WHERE user_id = ? AND completed_at >= ?`,
      [userId, weekAgo.toISOString()]
    );

    // Habits
    const habitsTotal = get(
      `SELECT COUNT(*) as count FROM habits WHERE user_id = ? AND status = 'active'`,
      [userId]
    );
    const habitsCompletedToday = get(
      `SELECT COUNT(DISTINCT habit_id) as count FROM habit_completions
       WHERE user_id = ? AND completed_at >= ? AND completed_at < ? AND status = 'completed'`,
      [userId, today.toISOString(), tomorrow.toISOString()]
    );

    // Streak (max across habits)
    const habits = all(`SELECT id FROM habits WHERE user_id = ? AND status = 'active'`, [userId]);
    let maxStreak = 0;
    for (const h of habits) {
      const completions = all(
        `SELECT DISTINCT date(completed_at) as day FROM habit_completions
         WHERE user_id = ? AND habit_id = ? AND status = 'completed' ORDER BY day DESC`,
        [userId, h.id]
      );
      let streak = 0;
      let expected = new Date();
      expected.setHours(0, 0, 0, 0);
      for (const c of completions) {
        const compDate = new Date(c.day + 'T00:00:00');
        const diff = Math.floor((expected - compDate) / (1000 * 60 * 60 * 24));
        if (diff === 0 || (diff === 1 && streak === 0)) {
          streak++;
          expected.setDate(expected.getDate() - 1);
        } else break;
      }
      if (streak > maxStreak) maxStreak = streak;
    }

    // Goals
    const goalsActive = get(
      `SELECT COUNT(*) as count FROM goals WHERE user_id = ? AND status = 'active'`,
      [userId]
    );
    const goalsCompletedWeek = get(
      `SELECT COUNT(*) as count FROM goals WHERE user_id = ? AND status = 'completed' AND updated_at >= ?`,
      [userId, weekAgo.toISOString()]
    );
    const goalsAvgProgress = get(
      `SELECT AVG(progress) as avg FROM goals WHERE user_id = ? AND status = 'active'`,
      [userId]
    );

    // Calendar
    const eventsToday = get(
      `SELECT COUNT(*) as count FROM calendar_events WHERE user_id = ? AND start_time < ? AND end_time > ?`,
      [userId, tomorrow.toISOString(), today.toISOString()]
    );
    const freeMinutes = this.getFreeMinutesNext48h(userId);

    // Workout
    const lastWorkout = get(
      `SELECT MAX(hc.completed_at) as last FROM habit_completions hc
       JOIN habits h ON hc.habit_id = h.id
       WHERE hc.user_id = ? AND h.category = 'workout' AND hc.status = 'completed'`,
      [userId]
    );
    const workoutsThisWeek = get(
      `SELECT COUNT(DISTINCT date(hc.completed_at)) as count FROM habit_completions hc
       JOIN habits h ON hc.habit_id = h.id
       WHERE hc.user_id = ? AND h.category = 'workout' AND hc.status = 'completed' AND hc.completed_at >= ?`,
      [userId, weekAgo.toISOString()]
    );

    return {
      generated_at: new Date().toISOString(),
      focus: {
        today_seconds: focus?.today_seconds || 0,
        week_seconds: focus?.week_seconds || 0,
        sessions_today: focus?.sessions_today || 0,
        best_hour: bestHour?.hour ?? null,
      },
      tasks: {
        due_today: tasksDueToday?.count || 0,
        completed_today: tasksCompletedToday?.count || 0,
        overdue: tasksOverdue?.count || 0,
        completion_rate_7d: tasksDueWeek?.count > 0 ? Math.round((tasksCompletedWeek?.count || 0) / tasksDueWeek.count * 100) : 0,
      },
      habits: {
        completed_today: habitsCompletedToday?.count || 0,
        total: habitsTotal?.count || 0,
        current_streak: maxStreak,
      },
      goals: {
        active: goalsActive?.count || 0,
        completed_this_week: goalsCompletedWeek?.count || 0,
        avg_progress: Math.round(goalsAvgProgress?.avg || 0),
      },
      calendar: {
        events_today: eventsToday?.count || 0,
        free_minutes_next_48h: freeMinutes,
      },
      workout: {
        last_completed: lastWorkout?.last || null,
        workouts_this_week: workoutsThisWeek?.count || 0,
      },
    };
  }

  getFreeMinutesNext48h(userId) {
    const now = new Date();
    const in48h = new Date(now.getTime() + 48 * 60 * 60 * 1000);

    // Get calendar events and focus blocks in next 48h
    const events = all(
      `SELECT start_time, end_time FROM calendar_events WHERE user_id = ? AND start_time < ? AND end_time > ?`,
      [userId, in48h.toISOString(), now.toISOString()]
    );
    const blocks = all(
      `SELECT start_time, end_time FROM focus_blocks WHERE user_id = ? AND status != 'cancelled' AND start_time < ? AND end_time > ?`,
      [userId, in48h.toISOString(), now.toISOString()]
    );

    const allBusy = [...events, ...blocks].map(e => ({
      start: new Date(e.start_time),
      end: new Date(e.end_time),
    }));

    // Merge overlapping intervals
    allBusy.sort((a, b) => a.start - b.start);
    const merged = [];
    for (const interval of allBusy) {
      if (merged.length === 0 || interval.start > merged[merged.length - 1].end) {
        merged.push({ ...interval });
      } else {
        merged[merged.length - 1].end = new Date(Math.max(merged[merged.length - 1].end, interval.end));
      }
    }

    // Calculate free minutes
    let freeMinutes = 0;
    let cursor = now;
    for (const interval of merged) {
      if (cursor < interval.start) {
        freeMinutes += Math.floor((interval.start - cursor) / 60000);
      }
      cursor = new Date(Math.max(cursor, interval.end));
    }
    if (cursor < in48h) {
      freeMinutes += Math.floor((in48h - cursor) / 60000);
    }

    return freeMinutes;
  }
}

module.exports = new MetricsRepository();