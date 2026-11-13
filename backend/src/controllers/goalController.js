const goalService = require('../services/goalService');
const ApiResponse = require('../utils/ApiResponse');
const ApiError = require('../utils/ApiError');

const createGoal = async (req, res, next) => {
  try {
    const goal = await goalService.createGoal(req.body);
    // Return ActionResult format for runner compatibility + ui invalidation hints
    res.status(201).json({
      success: true,
      action: 'goal.create',
      data: goal,
      effects: ['GOAL_CREATED'],
      ui: { invalidate: ['goals', 'today'] }
    });
  } catch (err) {
    next(new ApiError(400, err.message));
  }
};

const getGoals = async (req, res, next) => {
  try {
    const goals = await goalService.getGoals();
    res.status(200).json(new ApiResponse(200, goals, 'Goals retrieved successfully'));
  } catch (err) {
    next(new ApiError(500, err.message));
  }
};

const getGoalById = async (req, res, next) => {
  try {
    const goal = await goalService.getGoalById(req.params.id);
    if (!goal) return next(new ApiError(404, 'Goal not found'));
    res.status(200).json(new ApiResponse(200, goal, 'Goal retrieved successfully'));
  } catch (err) {
    next(new ApiError(500, err.message));
  }
};

const updateGoal = async (req, res, next) => {
  try {
    // If caller sends `completed` boolean, translate to status for consistency
    const updateData = { ...req.body };
    if (typeof updateData.completed === 'boolean' && updateData.status === undefined) {
      updateData.status = updateData.completed ? 'completed' : 'active';
    }
    // If status is set, sync completed boolean
    if (updateData.status !== undefined) {
      updateData.completed = updateData.status === 'completed';
    }

    const goal = await goalService.updateGoal(req.params.id, updateData);
    if (!goal) return next(new ApiError(404, 'Goal not found'));
    res.status(200).json({
      success: true,
      action: 'goal.update',
      data: goal,
      ui: { invalidate: ['goals', 'today'] }
    });
  } catch (err) {
    next(new ApiError(400, err.message));
  }
};

const deleteGoal = async (req, res, next) => {
  try {
    const goal = await goalService.deleteGoal(req.params.id);
    if (!goal) return next(new ApiError(404, 'Goal not found'));
    res.status(200).json({
      success: true,
      action: 'goal.delete',
      data: null,
      effects: ['GOAL_DELETED'],
      ui: { invalidate: ['goals', 'today'] }
    });
  } catch (err) {
    next(new ApiError(500, err.message));
  }
};

module.exports = {
  createGoal,
  getGoals,
  getGoalById,
  updateGoal,
  deleteGoal,
};
