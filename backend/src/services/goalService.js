const Goal = require('../models/Goal');

const createGoal = async (goalData) => {
  const goal = new Goal(goalData);
  return await goal.save();
};

const getGoals = async () => {
  return await Goal.find().sort({ createdAt: -1 });
};

const getGoalById = async (id) => {
  return await Goal.findById(id);
};

const updateGoal = async (id, updateData) => {
  return await Goal.findByIdAndUpdate(id, updateData, { new: true });
};

const deleteGoal = async (id) => {
  return await Goal.findByIdAndDelete(id);
};

module.exports = {
  createGoal,
  getGoals,
  getGoalById,
  updateGoal,
  deleteGoal,
};
