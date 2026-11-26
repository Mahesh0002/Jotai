const focusRepository = require('../repositories/focusRepository');
const taskRepository = require('../repositories/taskRepository');
const eventBus = require('../services/eventBus').eventBus;
const { v4: uuidv4 } = require('uuid');

exports.getBlocks = async (req, res, next) => {
  try {
    const userId = req.userId || 'local_user';
    const { start: startQuery, end: endQuery, startDate, endDate } = req.query;
    const start = startQuery || startDate;
    const end = endQuery || endDate;

    let blocks;
    if (start && end) {
      blocks = focusRepository.findByDateRange(userId, start, end);
    } else {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      blocks = focusRepository.findByDateRange(userId, today.toISOString(), tomorrow.toISOString());
    }

    res.status(200).json({ success: true, count: blocks.length, data: blocks });
  } catch (error) {
    next(error);
  }
};

exports.createBlock = async (req, res, next) => {
  try {
    const userId = req.userId || 'local_user';
    const block = focusRepository.create(userId, req.body);
    res.status(201).json({ success: true, data: block });
  } catch (error) {
    next(error);
  }
};

exports.updateBlock = async (req, res, next) => {
  try {
    const userId = req.userId || 'local_user';
    const block = focusRepository.update(userId, req.params.id, req.body);
    if (!block) return res.status(404).json({ success: false, message: 'Block not found' });
    res.status(200).json({ success: true, data: block });
  } catch (error) {
    next(error);
  }
};

exports.deleteBlock = async (req, res, next) => {
  try {
    const userId = req.userId || 'local_user';
    const deleted = focusRepository.delete(userId, req.params.id);
    if (!deleted) return res.status(404).json({ success: false, message: 'Block not found' });
    res.status(200).json({ success: true, data: { deleted: true } });
  } catch (error) {
    next(error);
  }
};

exports.completeBlock = async (req, res, next) => {
  try {
    const userId = req.userId || 'local_user';
    const { completeTask, elapsedSeconds, pausedSeconds, distractions, notes } = req.body;

    const block = focusRepository.findById(userId, req.params.id);
    if (!block) return res.status(404).json({ success: false, message: 'Block not found' });

    const updateData = { status: 'completed' };
    if (elapsedSeconds !== undefined) updateData.elapsed_seconds = elapsedSeconds;
    if (pausedSeconds !== undefined) updateData.paused_seconds = pausedSeconds;
    if (notes !== undefined) updateData.notes = notes;
    if (distractions !== undefined) updateData.distractions = JSON.stringify(distractions);

    const updated = focusRepository.update(userId, req.params.id, updateData);

    let updatedTask = null;
    if (completeTask && block.task_id) {
      updatedTask = taskRepository.complete(userId, block.task_id);
    }

    eventBus.publish('FOCUS_COMPLETED', { type: 'node', operation: 'focus.complete' }, { blockId: block.id }, userId);

    res.status(200).json({
      success: true,
      data: updated,
      task: updatedTask,
    });
  } catch (error) {
    next(error);
  }
};