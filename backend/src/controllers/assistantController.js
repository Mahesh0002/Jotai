const Task = require('../models/Task');
const Habit = require('../models/Habit');
const Suggestion = require('../models/Suggestion');

// @desc    Get aggregated context for Assistant
// @route   GET /api/v1/assistant/context
exports.getContext = async (req, res, next) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const [tasksRemaining, overdueTasks, habits] = await Promise.all([
      Task.countDocuments({ status: { $ne: 'completed' }, dueDate: { $gte: today, $lt: tomorrow } }),
      Task.countDocuments({ status: { $ne: 'completed' }, dueDate: { $lt: today } }),
      Habit.find({ status: 'active' })  // fixed: was `{ active: true }` but schema uses `status`
    ]);

    res.status(200).json({
      success: true,
      data: {
        time: new Date().toISOString(),
        today: {
          tasks_remaining: tasksRemaining,
          overdue_tasks: overdueTasks,
          available_focus_minutes: 120 // mock for now
        },
        focus: {
          active: false
        },
        progress: {
          level: 1, // mock for now
          xp: 0
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create a suggestion
// @route   POST /api/v1/assistant/suggestions
exports.createSuggestion = async (req, res, next) => {
  try {
    const { type, priority, title, message, targetModule, actions } = req.body;

    // Deduplication logic: Check if a pending suggestion of this type and target already exists
    const existing = await Suggestion.findOne({ type, targetModule, status: 'pending' });
    if (existing) {
      return res.status(200).json({ success: true, data: existing, message: 'Suggestion already exists' });
    }

    const suggestion = await Suggestion.create({
      type, priority, title, message, targetModule, actions
    });

    res.status(201).json({ success: true, data: suggestion });
  } catch (error) {
    next(error);
  }
};

// @desc    Get pending suggestions
// @route   GET /api/v1/assistant/suggestions
exports.getSuggestions = async (req, res, next) => {
  try {
    const { targetModule } = req.query;
    let query = { status: 'pending' };
    if (targetModule) query.targetModule = targetModule;

    const suggestions = await Suggestion.find(query).sort({ priority: -1, createdAt: -1 });
    res.status(200).json({ success: true, count: suggestions.length, data: suggestions });
  } catch (error) {
    next(error);
  }
};

// @desc    Accept, dismiss, or execute a suggestion
// @route   POST /api/v1/assistant/suggestions/:id/:action
exports.updateSuggestionStatus = async (req, res, next) => {
  try {
    const { id, action } = req.params; // action = 'accept', 'dismiss', 'execute'
    
    if (!['accept', 'dismiss', 'execute'].includes(action)) {
      return res.status(400).json({ success: false, error: 'Invalid action' });
    }

    const suggestion = await Suggestion.findById(id);
    if (!suggestion) {
      return res.status(404).json({ success: false, error: 'Suggestion not found' });
    }

    // Map the route action to the schema status enum
    let newStatus = action === 'execute' ? 'executed' : (action === 'accept' ? 'accepted' : 'dismissed');

    suggestion.status = newStatus;
    await suggestion.save();

    res.status(200).json({ success: true, data: suggestion });
  } catch (error) {
    next(error);
  }
};
