const habitRepository = require('../repositories/habitRepository');
const eventBus = require('../services/eventBus').eventBus;
const { run, all } = require('../db');

exports.getHabits = async (req, res, next) => {
  try {
    const userId = req.userId || 'local_user';
    const { date, status } = req.query;

    let query = {};
    if (status === 'all') {
      // return all
    } else if (status) {
      query.status = status;
    } else {
      query.status = { $ne: 'archived' };
    }

    let habits = habitRepository.find(userId, { where: query, orderBy: 'created_at DESC' });

    if (date) {
      // Get completions for that date
      const completions = all(
        `SELECT * FROM habit_completions WHERE user_id = ? AND date(completed_at) = ?`,
        [userId, date]
      );
      const completionMap = {};
      for (const c of completions) {
        completionMap[c.habit_id] = c;
      }

      // Get all completions for streak calculation
      const allCompletions = all(
        `SELECT * FROM habit_completions WHERE user_id = ? AND status = 'completed' ORDER BY completed_at DESC`,
        [userId]
      );

      habits = habits.map(habit => {
        const hObj = { ...habit };
        const comp = completionMap[habit.id];
        hObj.isCompletedToday = comp && comp.status === 'completed' ? true : false;

        // Basic streak calculation
        const habitCompletions = allCompletions.filter(c => c.habit_id === habit.id);
        hObj.currentStreak = habitCompletions.length;

        return hObj;
      });
    }

    res.status(200).json({ success: true, count: habits.length, data: habits });
  } catch (error) {
    next(error);
  }
};

exports.createHabit = async (req, res, next) => {
  try {
    const userId = req.userId || 'local_user';
    const habit = habitRepository.create(userId, req.body);

    eventBus.publish('HABIT_CREATED', { type: 'node', operation: 'habit.create' }, { habitId: habit.id }, userId);

    res.status(201).json({
      success: true,
      action: 'habit.create',
      data: habit,
      effects: ['HABIT_CREATED'],
      ui: { invalidate: ['habits', 'today'] },
    });
  } catch (error) {
    next(error);
  }
};

exports.updateHabit = async (req, res, next) => {
  try {
    const userId = req.userId || 'local_user';
    const habit = habitRepository.update(userId, req.params.id, req.body);
    if (!habit) return res.status(404).json({ success: false, message: 'Habit not found' });
    res.status(200).json({ success: true, data: habit });
  } catch (error) {
    next(error);
  }
};

exports.deleteHabit = async (req, res, next) => {
  try {
    const userId = req.userId || 'local_user';
    const { actionId } = req.body || {};

    // Check for actionId for confirmation
    if (!actionId) {
      return res.status(400).json({ success: false, message: 'actionId required for delete' });
    }

    // Verify action exists and is pending
    // (In a real implementation, this would check the confirmation store)
    
    const deleted = habitRepository.delete(userId, req.params.id);
    if (!deleted) return res.status(404).json({ success: false, message: 'Habit not found' });

    // Delete completion history
    run(`DELETE FROM habit_completions WHERE habit_id = ? AND user_id = ?`, [req.params.id, userId]);

    eventBus.publish('HABIT_DELETED', { type: 'node', operation: 'habit.delete' }, { habitId: req.params.id }, userId);

    res.status(200).json({
      success: true,
      action: 'habit.delete',
      data: {},
      effects: ['HABIT_DELETED'],
      ui: { invalidate: ['habits', 'today', 'habitAnalytics'] },
    });
  } catch (error) {
    next(error);
  }
};