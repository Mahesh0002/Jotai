const taskRepository = require('../repositories/taskRepository');
const eventBus = require('../services/eventBus').eventBus;
const { v4: uuidv4 } = require('uuid');
const { run, get } = require('../db');

const getTasks = async (req, res, next) => {
  try {
    const userId = req.userId || 'local_user';
    const { status, priority, projectId, isStarred, date, startDate, endDate } = req.query;

    let tasks;
    if (date === 'today') {
      tasks = taskRepository.findDueToday(userId);
    } else if (date === 'upcoming') {
      tasks = taskRepository.findByStatus(userId, 'not_started');
    } else if (status) {
      tasks = taskRepository.findByStatus(userId, status);
    } else if (projectId) {
      tasks = taskRepository.findByProject(userId, projectId);
    } else {
      tasks = taskRepository.find(userId, { orderBy: 'created_at DESC' });
    }

    // Apply additional filters
    if (priority) {
      tasks = tasks.filter(t => t.priority === priority);
    }
    if (isStarred === 'true') {
      tasks = tasks.filter(t => t.is_starred === 1);
    }
    if (startDate || endDate) {
      tasks = tasks.filter(t => {
        if (!t.due_date) return false;
        const due = new Date(t.due_date);
        if (startDate && due < new Date(startDate)) return false;
        if (endDate && due > new Date(endDate)) return false;
        return true;
      });
    }

    res.status(200).json({ success: true, count: tasks.length, data: tasks });
  } catch (error) {
    next(error);
  }
};

const getNextAction = async (req, res, next) => {
  try {
    const userId = req.userId || 'local_user';
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    let task = taskRepository.queryOne(
      `SELECT * FROM tasks WHERE user_id = ? AND status != 'completed' AND due_date >= ? AND due_date < ? AND priority = 'high' ORDER BY created_at ASC LIMIT 1`,
      [userId, today.toISOString(), tomorrow.toISOString()]
    );
    let reason = "Due today and marked high priority.";

    if (!task) {
      task = taskRepository.queryOne(
        `SELECT * FROM tasks WHERE user_id = ? AND status != 'completed' AND due_date >= ? AND due_date < ? ORDER BY priority ASC, created_at ASC LIMIT 1`,
        [userId, today.toISOString(), tomorrow.toISOString()]
      );
      reason = "Due today.";
    }

    if (!task) {
      task = taskRepository.queryOne(
        `SELECT * FROM tasks WHERE user_id = ? AND status != 'completed' AND priority = 'high' ORDER BY created_at ASC LIMIT 1`,
        [userId]
      );
      reason = "High priority task.";
    }

    if (!task) {
      task = taskRepository.queryOne(
        `SELECT * FROM tasks WHERE user_id = ? AND status != 'completed' ORDER BY created_at ASC LIMIT 1`,
        [userId]
      );
      reason = "Next available task.";
    }

    if (!task) {
      return res.status(200).json({ success: true, data: null, reason: "No tasks left!" });
    }

    // Parse JSON fields
    task.tags = JSON.parse(task.tags || '[]');
    task.subtasks = JSON.parse(task.subtasks || '[]');

    res.status(200).json({ success: true, data: task, reason });
  } catch (error) {
    next(error);
  }
};

const createTask = async (req, res, next) => {
  try {
    const userId = req.userId || 'local_user';
    const { actionId, ...taskData } = req.body;

    // Idempotency check
    if (actionId) {
      const existingAction = get(
        `SELECT result FROM executed_actions WHERE action_id = ?`,
        [actionId]
      );
      if (existingAction) {
        return res.status(200).json(JSON.parse(existingAction.result));
      }
    }

    const task = taskRepository.create(userId, taskData);

    // Emit event
    eventBus.publish('TASK_CREATED', { type: 'node', operation: 'task.create' }, { taskId: task.id }, userId);

    const result = {
      success: true,
      action: 'task.create',
      data: task,
      effects: ['TASK_CREATED'],
      ui: { invalidate: ['tasks', 'today'] },
    };

    if (actionId) {
      run(
        `INSERT INTO executed_actions (id, user_id, action_name, params, result, created_at) VALUES (?, ?, ?, ?, ?, ?)`,
        [actionId, userId, 'task.create', JSON.stringify(taskData), JSON.stringify(result), new Date().toISOString()]
      );
    }

    res.status(201).json(result);
  } catch (error) {
    next(error);
  }
};

const getTask = async (req, res, next) => {
  try {
    const userId = req.userId || 'local_user';
    const task = taskRepository.findById(userId, req.params.id);
    if (!task) return res.status(404).json({ success: false, message: 'Task not found' });

    // Parse JSON fields
    task.tags = JSON.parse(task.tags || '[]');
    task.subtasks = JSON.parse(task.subtasks || '[]');

    res.status(200).json({ success: true, data: task });
  } catch (error) {
    next(error);
  }
};

const updateTask = async (req, res, next) => {
  try {
    const userId = req.userId || 'local_user';
    const task = taskRepository.update(userId, req.params.id, req.body);
    if (!task) return res.status(404).json({ success: false, message: 'Task not found' });

    task.tags = JSON.parse(task.tags || '[]');
    task.subtasks = JSON.parse(task.subtasks || '[]');

    res.status(200).json({ success: true, data: task });
  } catch (error) {
    next(error);
  }
};

const completeTask = async (req, res, next) => {
  try {
    const userId = req.userId || 'local_user';
    const { actionId } = req.body || {};

    if (actionId) {
      const existingAction = get(
        `SELECT result FROM executed_actions WHERE action_id = ?`,
        [actionId]
      );
      if (existingAction) {
        return res.status(200).json(JSON.parse(existingAction.result));
      }
    }

    const task = taskRepository.findById(userId, req.params.id);
    if (!task) return res.status(404).json({ success: false, message: 'Task not found' });

    // Calculate XP reward
    let xpReward = 10;
    if (task.priority === 'high') xpReward += 20;
    if (task.priority === 'medium') xpReward += 10;
    if (task.estimated_minutes > 60) xpReward += 10;

    const completedTask = taskRepository.complete(userId, req.params.id);
    completedTask.xp_reward = xpReward;

    // Update xp_reward in DB
    run(
      `UPDATE tasks SET xp_reward = ? WHERE id = ? AND user_id = ?`,
      [xpReward, req.params.id, userId]
    );

    eventBus.publish('TASK_COMPLETED', { type: 'node', operation: 'task.complete' }, { taskId: task.id, xpAwarded: xpReward }, userId);

    const result = {
      success: true,
      action: 'task.complete',
      data: completedTask,
      effects: ['TASK_COMPLETED', 'XP_UPDATED'],
      ui: { invalidate: ['tasks', 'today', 'progress'] },
    };

    if (actionId) {
      run(
        `INSERT INTO executed_actions (id, user_id, action_name, params, result, created_at) VALUES (?, ?, ?, ?, ?, ?)`,
        [actionId, userId, 'task.complete', JSON.stringify({ taskId: req.params.id }), JSON.stringify(result), new Date().toISOString()]
      );
    }

    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

const toggleSubtask = async (req, res, next) => {
  try {
    const userId = req.userId || 'local_user';
    const task = taskRepository.findById(userId, req.params.id);
    if (!task) return res.status(404).json({ success: false, message: 'Task not found' });

    const subtasks = JSON.parse(task.subtasks || '[]');
    const subtask = subtasks.find(s => s.id === req.params.subtaskId);
    if (!subtask) return res.status(404).json({ success: false, message: 'Subtask not found' });

    subtask.isCompleted = req.body.isCompleted !== undefined ? req.body.isCompleted : !subtask.isCompleted;
    const updated = taskRepository.update(userId, req.params.id, { subtasks: JSON.stringify(subtasks) });

    res.status(200).json({ success: true, data: updated });
  } catch (error) {
    next(error);
  }
};

const deleteTask = async (req, res, next) => {
  try {
    const userId = req.userId || 'local_user';
    const { actionId } = req.body || {};

    // Check for actionId for confirmation
    if (!actionId) {
      return res.status(400).json({ success: false, message: 'actionId required for delete' });
    }

    // Verify action exists and is pending
    const pending = get(
      `SELECT * FROM executed_actions WHERE id = ? AND action_name = 'task.delete'`,
      [actionId]
    );
    if (!pending) {
      return res.status(400).json({ success: false, message: 'Invalid or expired actionId' });
    }

    const deleted = taskRepository.delete(userId, req.params.id);
    if (!deleted) return res.status(404).json({ success: false, message: 'Task not found' });

    eventBus.publish('TASK_DELETED', { type: 'node', operation: 'task.delete' }, { taskId: req.params.id }, userId);

    const result = { success: true, data: { deleted: true }, ui: { invalidate: ['tasks', 'today'] } };
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getTasks,
  getNextAction,
  createTask,
  getTask,
  updateTask,
  completeTask,
  toggleSubtask,
  deleteTask,
};