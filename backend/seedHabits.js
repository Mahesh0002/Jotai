require('dotenv').config();
const mongoose = require('mongoose');
const Habit = require('./src/models/Habit');
const HabitCompletion = require('./src/models/HabitCompletion');

const seedHabits = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/jotai-db');
    console.log('Connected to MongoDB');

    // Clear existing
    await Habit.deleteMany({});
    await HabitCompletion.deleteMany({});
    console.log('Cleared existing habits data');

    // Create Habits
    const habitsToCreate = [
      { name: 'Morning Planning', icon: '☕', category: 'Productivity', frequencyType: 'every_day', time: '08:00', targetDurationMinutes: 15, xpReward: 20 },
      { name: 'Deep Work Block', icon: '🧠', category: 'Productivity', frequencyType: 'weekdays', targetDurationMinutes: 90, xpReward: 50 },
      { name: 'Read 20 pages', icon: '📚', category: 'Learning', frequencyType: 'every_day', targetDurationMinutes: 30, xpReward: 15 },
      { name: 'Exercise', icon: '🏃‍♂️', category: 'Health', frequencyType: 'weekdays', targetDurationMinutes: 45, xpReward: 30 },
      { name: 'Meditation', icon: '🧘', category: 'Mindset', frequencyType: 'every_day', targetDurationMinutes: 10, xpReward: 10 },
      { name: 'Journaling', icon: '📓', category: 'Mindset', frequencyType: 'every_day', targetDurationMinutes: 10, xpReward: 10 },
    ];

    const habits = await Habit.insertMany(habitsToCreate);
    console.log(`Created ${habits.length} habits`);

    // Generate Completions for the last 30 days to build a nice heatmap & streaks
    const completions = [];
    const today = new Date();
    
    // We'll generate completions for the last 30 days including today
    for (let i = 29; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const dateString = d.toLocaleDateString('en-CA'); // YYYY-MM-DD
      const isWeekend = d.getDay() === 0 || d.getDay() === 6;

      for (const habit of habits) {
        // Skip weekdays-only habits on weekends
        if (habit.frequencyType === 'weekdays' && isWeekend) continue;

        // Introduce some random misses for realism (e.g., 80% completion rate)
        // Ensure "Morning Planning" has a long streak to show off the UI
        let shouldComplete = Math.random() < 0.8;
        
        if (habit.name === 'Morning Planning' && i < 15) {
            shouldComplete = true; // 15 day active streak
        }
        
        if (shouldComplete) {
          completions.push({
            habitId: habit._id,
            scheduledDate: dateString,
            status: 'completed',
            completedAt: new Date(d.setHours(Math.floor(Math.random() * 8) + 8, 0, 0, 0)), // Random time between 8 AM and 4 PM
            xpAwarded: habit.xpReward
          });
        }
      }
    }

    await HabitCompletion.insertMany(completions);
    console.log(`Created ${completions.length} habit completions (Heatmap data populated)`);

    console.log('Seed completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding data:', error);
    process.exit(1);
  }
};

seedHabits();
