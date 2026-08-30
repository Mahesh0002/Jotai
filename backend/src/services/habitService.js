const Habit = require('../models/Habit');

const createHabit = async (habitData) => {
  const habit = new Habit(habitData);
  return await habit.save();
};

const getHabits = async () => {
  return await Habit.find().sort({ createdAt: -1 });
};

const getHabitById = async (id) => {
  return await Habit.findById(id);
};

const updateHabit = async (id, updateData) => {
  return await Habit.findByIdAndUpdate(id, updateData, { new: true });
};

const deleteHabit = async (id) => {
  return await Habit.findByIdAndDelete(id);
};

module.exports = {
  createHabit,
  getHabits,
  getHabitById,
  updateHabit,
  deleteHabit,
};
