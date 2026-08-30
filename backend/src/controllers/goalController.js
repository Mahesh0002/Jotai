const goalService = require('../services/goalService');
const ApiResponse = require('../utils/ApiResponse');
const ApiError = require('../utils/ApiError');

const createGoal = async (req, res, next) => {
  try {
    const goal = await goalService.createGoal(req.body);
    res.status(201).json(new ApiResponse(201, goal, 'Goal created successfully'));
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
    const goal = await goalService.updateGoal(req.params.id, req.body);
    if (!goal) return next(new ApiError(404, 'Goal not found'));
    res.status(200).json(new ApiResponse(200, goal, 'Goal updated successfully'));
  } catch (err) {
    next(new ApiError(400, err.message));
  }
};

const deleteGoal = async (req, res, next) => {
  try {
    const goal = await goalService.deleteGoal(req.params.id);
    if (!goal) return next(new ApiError(404, 'Goal not found'));
    res.status(200).json(new ApiResponse(200, null, 'Goal deleted successfully'));
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
