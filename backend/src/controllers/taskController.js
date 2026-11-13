const Task = require('../models/Task');
const ExecutedAction = require('../models/ExecutedAction');
const EventPublisher = require('../services/eventPublisher');

// @desc    Get all tasks with optional filters
// @route   GET /api/v1/tasks
exports.getTasks = async (req, res, next) => {
  try {
    const { status, priority, projectId, isStarred, date } = req.query;
    let query = {}; // TODO: Add userId filtering once auth is wired up

    if (status) query.status = status;
    if (priority) query.priority = priority;
    if (projectId) query.projectId = projectId;
    if (isStarred === 'true') query.isStarred = true;

    // Filter by date concepts (today, upcoming)
    if (date === 'today') {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      
      query.dueDate = {
        $gte: today,
        $lt: tomorrow
      };
    } else if (date === 'upcoming') {
      const tomorrow = new Date();
      tomorrow.setHours(0, 0, 0, 0);
      tomorrow.setDate(tomorrow.getDate() + 1);
      
      query.dueDate = {
        $gte: tomorrow
      };
    }

    const tasks = await Task.find(query).populate('projectId', 'name color').sort({ createdAt: -1 });
    res.status(200).json({ success: true, count: tasks.length, data: tasks });
  } catch (error) {
    next(error);
  }
};

// @desc    Get next action
// @route   GET /api/v1/tasks/next-action
exports.getNextAction = async (req, res, next) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Find incomplete high priority tasks due today
    let task = await Task.findOne({
      status: { $ne: 'completed' },
      dueDate: { $gte: today, $lt: tomorrow },
      priority: 'high'
    }).populate('projectId', 'name color').sort({ createdAt: 1 });
    
    let reason = "Due today and marked high priority.";

    // If none, find any incomplete task due today
    if (!task) {
      task = await Task.findOne({
        status: { $ne: 'completed' },
        dueDate: { $gte: today, $lt: tomorrow }
      }).populate('projectId', 'name color').sort({ priority: 1, createdAt: 1 });
      reason = "Due today.";
    }

    // If none, find the oldest incomplete high priority task
    if (!task) {
      task = await Task.findOne({
        status: { $ne: 'completed' },
        priority: 'high'
      }).populate('projectId', 'name color').sort({ createdAt: 1 });
      reason = "High priority task.";
    }
    
    // Fallback: any incomplete task
    if (!task) {
      task = await Task.findOne({
        status: { $ne: 'completed' }
      }).populate('projectId', 'name color').sort({ createdAt: 1 });
      reason = "Next available task.";
    }

    if (!task) {
      return res.status(200).json({ success: true, data: null, reason: "No tasks left!" });
    }

    res.status(200).json({ success: true, data: task, reason });
  } catch (error) {
    next(error);
  }
};

// @desc    Create a new task
// @route   POST /api/v1/tasks
exports.createTask = async (req, res, next) => {
  try {
    const { actionId, ...taskData } = req.body;
    
    // Idempotency check
    if (actionId) {
      const existingAction = await ExecutedAction.findOne({ actionId });
      if (existingAction) {
        return res.status(200).json(existingAction.result);
      }
    }

    const task = await Task.create(taskData); // TODO: Add req.user.id

    // Emit event
    await EventPublisher.publish('TASK_CREATED', { type: 'node', operation: 'task.create' }, { taskId: task._id });

    const result = { 
      success: true, 
      action: 'task.create',
      data: task,
      effects: ['TASK_CREATED'],
      ui: { invalidate: ['tasks', 'today'] }
    };

    if (actionId) {
      await ExecutedAction.create({ actionId, actionName: 'task.create', result });
    }

    res.status(201).json(result);
  } catch (error) {
    next(error);
  }
};

// @desc    Get a single task
// @route   GET /api/v1/tasks/:id
exports.getTask = async (req, res, next) => {
  try {
    const task = await Task.findById(req.params.id).populate('projectId', 'name color');
    if (!task) return res.status(404).json({ success: false, error: 'Task not found' });
    res.status(200).json({ success: true, data: task });
  } catch (error) {
    next(error);
  }
};

// @desc    Update task (status, priority, details)
// @route   PATCH /api/v1/tasks/:id
exports.updateTask = async (req, res, next) => {
  try {
    const task = await Task.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    }).populate('projectId', 'name color');

    if (!task) return res.status(404).json({ success: false, error: 'Task not found' });
    res.status(200).json({ success: true, data: task });
  } catch (error) {
    next(error);
  }
};

// @desc    Complete task & award XP
// @route   POST /api/v1/tasks/:id/complete
exports.completeTask = async (req, res, next) => {
  try {
    const { actionId } = req.body || {};

    if (actionId) {
      const existingAction = await ExecutedAction.findOne({ actionId });
      if (existingAction) {
        return res.status(200).json(existingAction.result);
      }
    }

    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ success: false, error: 'Task not found' });
    
    // Calculate XP reward based on priority/estimation if needed, simple logic for now
    let xpReward = 10;
    if (task.priority === 'high') xpReward += 20;
    if (task.priority === 'medium') xpReward += 10;
    if (task.estimatedMinutes > 60) xpReward += 10;

    task.status = 'completed';
    task.completedAt = new Date();
    task.xpReward = xpReward;
    await task.save();

    // TODO: When User/Runner model is wired up, increment User XP here.

    await EventPublisher.publish('TASK_COMPLETED', { type: 'node', operation: 'task.complete' }, { taskId: task._id, xpAwarded: xpReward });

    const result = { 
      success: true, 
      action: 'task.complete',
      data: task,
      effects: ['TASK_COMPLETED', 'XP_UPDATED'],
      ui: { invalidate: ['tasks', 'today', 'progress'] }
    };

    if (actionId) {
      await ExecutedAction.create({ actionId, actionName: 'task.complete', result });
    }

    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

// @desc    Toggle Subtask
// @route   PATCH /api/v1/tasks/:id/subtasks/:subtaskId
exports.toggleSubtask = async (req, res, next) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ success: false, error: 'Task not found' });

    const subtask = task.subtasks.id(req.params.subtaskId);
    if (!subtask) return res.status(404).json({ success: false, error: 'Subtask not found' });

    subtask.isCompleted = req.body.isCompleted !== undefined ? req.body.isCompleted : !subtask.isCompleted;
    await task.save();

    res.status(200).json({ success: true, data: task });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete task
// @route   DELETE /api/v1/tasks/:id
exports.deleteTask = async (req, res, next) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ success: false, error: 'Task not found' });
    
    await task.deleteOne();
    res.status(200).json({ success: true, data: {} });
  } catch (error) {
    next(error);
  }
};
