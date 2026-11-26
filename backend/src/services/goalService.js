const goalRepository = require('../repositories/goalRepository');

const createGoal = async (goalData) => {
  const userId = goalData.user_id || 'local_user';
  return goalRepository.create(userId, goalData);
};

const getGoals = async (userId = 'local_user') => {
  return goalRepository.find(userId, { orderBy: 'created_at DESC' });
};

const getGoalById = async (id, userId = 'local_user') => {
  return goalRepository.findById(userId, id);
};

const updateGoal = async (id, updateData, userId = 'local_user') => {
  return goalRepository.update(userId, id, updateData);
};

const deleteGoal = async (id, userId = 'local_user') => {
  return goalRepository.delete(userId, id);
};

module.exports = {
  createGoal,
  getGoals,
  getGoalById,
  updateGoal,
  deleteGoal,
};