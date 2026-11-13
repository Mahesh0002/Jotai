const Habit = require('../models/Habit');
const HabitCompletion = require('../models/HabitCompletion');

// GET /api/v1/habits
// Get all habits, optionally appending completion status for a given date
exports.getHabits = async (req, res) => {
  try {
    const { date, status } = req.query; // YYYY-MM-DD
    
    // Determine filter based on status query
    let query = {};
    if (status === 'all') {
      // return all
    } else if (status) {
      query.status = status;
    } else {
      query.status = { $ne: 'archived' }; // default behavior
    }

    const habits = await Habit.find(query).sort({ createdAt: -1 });

    if (!date) {
      return res.status(200).json({ success: true, count: habits.length, data: habits });
    }

    // If date is provided, fetch completions for that date
    const completions = await HabitCompletion.find({ scheduledDate: date });
    const completionMap = completions.reduce((acc, comp) => {
      acc[comp.habitId.toString()] = comp;
      return acc;
    }, {});

    // Compute basic streaks for each habit
    // Note: In a production app, streak calculation would happen via aggregation or async job, 
    // but we compute a basic "current streak" here for the payload.
    const allCompletions = await HabitCompletion.find({ status: 'completed' }).sort({ scheduledDate: -1 });
    
    const enhancedHabits = habits.map(habit => {
      const hObj = habit.toObject();
      const comp = completionMap[habit._id.toString()];
      hObj.isCompletedToday = comp && comp.status === 'completed' ? true : false;
      
      // Basic Streak Calculation
      let streak = 0;
      const habitCompletions = allCompletions.filter(c => c.habitId.toString() === habit._id.toString());
      // A robust streak engine needs to know the schedule (e.g. Mon/Wed/Fri).
      // For now, we count consecutive scheduled completions.
      // We'll simplify to just count how many times it was completed.
      hObj.currentStreak = habitCompletions.length; 
      
      return hObj;
    });

    res.status(200).json({ success: true, count: enhancedHabits.length, data: enhancedHabits });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

// POST /api/v1/habits
exports.createHabit = async (req, res) => {
  try {
    const habit = await Habit.create(req.body);
    res.status(201).json({
      success: true,
      action: 'habit.create',
      data: habit,
      effects: ['HABIT_CREATED'],
      ui: { invalidate: ['habits', 'today'] }
    });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

// PATCH /api/v1/habits/:id
exports.updateHabit = async (req, res) => {
  try {
    const habit = await Habit.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });

    if (!habit) return res.status(404).json({ success: false, error: 'Habit not found' });
    res.status(200).json({ success: true, data: habit });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

// DELETE /api/v1/habits/:id
exports.deleteHabit = async (req, res) => {
  try {
    const habit = await Habit.findByIdAndDelete(req.params.id);
    if (!habit) return res.status(404).json({ success: false, error: 'Habit not found' });
    
    // Also delete completion history
    await HabitCompletion.deleteMany({ habitId: req.params.id });

    res.status(200).json({
      success: true,
      action: 'habit.delete',
      data: {},
      effects: ['HABIT_DELETED'],
      ui: { invalidate: ['habits', 'today', 'habitAnalytics'] }
    });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};


