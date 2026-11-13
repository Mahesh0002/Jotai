const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const Task = require('./src/models/Task');
const FocusBlock = require('./src/models/FocusBlock');
const Habit = require('./src/models/Habit');
const HabitCompletion = require('./src/models/HabitCompletion');
const Goal = require('./src/models/Goal');
const Project = require('./src/models/Project');

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/jotai";

async function seedData() {
    try {
        await mongoose.connect(MONGODB_URI);
        console.log("Connected to MongoDB.");

        // Clear existing progress/analytics relevant data
        console.log("Clearing existing data...");
        await Task.deleteMany({});
        await FocusBlock.deleteMany({});
        await Habit.deleteMany({});
        await HabitCompletion.deleteMany({});
        await Goal.deleteMany({});
        await Project.deleteMany({});

        // Calculate Date ranges
        const now = new Date();
        const thirtyDaysAgo = new Date(now);
        thirtyDaysAgo.setDate(now.getDate() - 30);

        const getRandomDate = (start, end) => {
            return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
        };

        // 1. Projects
        const projects = await Project.insertMany([
            { name: "NLP Assignment", color: "#a855f7" },
            { name: "Traffic Project", color: "#14b8a6" },
            { name: "Learning", color: "#f59e0b" },
            { name: "Personal", color: "#3b82f6" }
        ]);

        // 2. Tasks
        const tasks = [];
        for (let i = 0; i < 40; i++) {
            const isCompleted = Math.random() > 0.3; // 70% completed
            const taskDate = getRandomDate(thirtyDaysAgo, now);
            const proj = projects[Math.floor(Math.random() * projects.length)];
            
            tasks.push({
                title: `Task ${i+1}`,
                status: isCompleted ? "completed" : "not_started",
                dueDate: new Date(taskDate.getTime() + 86400000), // due 1 day after
                completedAt: isCompleted ? taskDate : null,
                projectId: proj._id,
                xpReward: Math.floor(Math.random() * 50) + 10
            });
        }
        await Task.insertMany(tasks);
        console.log("Seeded Tasks.");

        // 3. Habits & Completions
        const habits = await Habit.insertMany([
            { name: "Morning Pages", frequencyType: "every_day" },
            { name: "Workout", frequencyType: "every_day" },
            { name: "No phone in bed", frequencyType: "every_day" },
            { name: "Read 20 mins", frequencyType: "every_day" }
        ]);

        const habitCompletions = [];
        for (const habit of habits) {
            let currentDate = new Date(thirtyDaysAgo);
            while (currentDate <= now) {
                if (Math.random() > 0.2) { // 80% completion rate
                    const dateStr = currentDate.toISOString().split('T')[0];
                    const completedTime = new Date(currentDate);
                    completedTime.setHours(completedTime.getHours() + 10);
                    
                    habitCompletions.push({
                        habitId: habit._id,
                        scheduledDate: dateStr,
                        completedAt: completedTime,
                        status: "completed",
                        xpAwarded: habit.xpReward || 10
                    });
                }
                currentDate.setDate(currentDate.getDate() + 1);
            }
        }
        await HabitCompletion.insertMany(habitCompletions);
        console.log("Seeded Habits.");

        // 4. Focus Blocks
        const focusBlocks = [];
        const focusTypes = ['deep_work', 'study', 'creative', 'admin', 'reading', 'break'];
        
        let currentDate = new Date(thirtyDaysAgo);
        while (currentDate <= now) {
            // 1 to 4 blocks per day
            const blocksToday = Math.floor(Math.random() * 4) + 1;
            let startHour = 9;
            for (let i = 0; i < blocksToday; i++) {
                const durMins = Math.floor(Math.random() * 60) + 30; // 30-90 mins
                const startTime = new Date(currentDate);
                startTime.setHours(startHour, 0, 0, 0);
                
                const endTime = new Date(startTime);
                endTime.setMinutes(endTime.getMinutes() + durMins);

                // Add mostly deep work or study
                let type = focusTypes[Math.floor(Math.random() * focusTypes.length)];
                if (Math.random() > 0.5) type = 'deep_work';

                focusBlocks.push({
                    title: `Focus Session ${i+1}`,
                    startTime,
                    endTime,
                    durationMinutes: durMins,
                    elapsedSeconds: durMins * 60,
                    status: 'completed',
                    type,
                    xpReward: durMins * 2
                });

                startHour += Math.floor(durMins / 60) + 1; // space them out
            }
            currentDate.setDate(currentDate.getDate() + 1);
        }
        await FocusBlock.insertMany(focusBlocks);
        console.log("Seeded Focus Blocks.");

        // 5. Goals
        await Goal.insertMany([
            { title: "Complete NLP Course", progress: 80, completed: false },
            { title: "Read 10 Books", progress: 30, completed: false },
            { title: "Launch App", progress: 100, completed: true }
        ]);
        console.log("Seeded Goals.");

        console.log("Seed complete!");
        process.exit(0);

    } catch (error) {
        console.error("Seed error:", error);
        process.exit(1);
    }
}

seedData();
