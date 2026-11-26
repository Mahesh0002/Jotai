const habitRepository = require('../repositories/habitRepository');

const createHabit = async (habitData) => {
  const userId = habitData.user_id || 'local_user';
  return habitRepository.create(userId, habitData);
};

const getHabits = async (userId = 'local_user') => {
  return habitRepository.find(userId, { orderBy: 'created_at DESC' });
};

const getHabitById = async (id, userId = 'local_user') => {
  return habitRepository.findById(userId, id);
};

const updateHabit = async (id, updateData, userId = 'local_user') => {
  return habitRepository.update(userId, id, updateData);
};

const deleteHabit = async (id, userId = 'local_user') => {
  return habitRepository.delete(userId, id);
};

module.exports = {
  createHabit,
  getHabits,
  getHabitById,
  updateHabit,
  deleteHabit,
};