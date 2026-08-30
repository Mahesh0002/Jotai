const habitService = require('../services/habitService');
const ApiResponse = require('../utils/ApiResponse');
const ApiError = require('../utils/ApiError');

const createHabit = async (req, res, next) => {
  try {
    const habit = await habitService.createHabit(req.body);
    res.status(201).json(new ApiResponse(201, habit, 'Habit created successfully'));
  } catch (err) {
    next(new ApiError(400, err.message));
  }
};

const getHabits = async (req, res, next) => {
  try {
    const habits = await habitService.getHabits();
    res.status(200).json(new ApiResponse(200, habits, 'Habits retrieved successfully'));
  } catch (err) {
    next(new ApiError(500, err.message));
  }
};

const updateHabit = async (req, res, next) => {
  try {
    const habit = await habitService.updateHabit(req.params.id, req.body);
    if (!habit) return next(new ApiError(404, 'Habit not found'));
    res.status(200).json(new ApiResponse(200, habit, 'Habit updated successfully'));
  } catch (err) {
    next(new ApiError(400, err.message));
  }
};

const deleteHabit = async (req, res, next) => {
  try {
    const habit = await habitService.deleteHabit(req.params.id);
    if (!habit) return next(new ApiError(404, 'Habit not found'));
    res.status(200).json(new ApiResponse(200, null, 'Habit deleted successfully'));
  } catch (err) {
    next(new ApiError(500, err.message));
  }
};

module.exports = {
  createHabit,
  getHabits,
  updateHabit,
  deleteHabit,
};
