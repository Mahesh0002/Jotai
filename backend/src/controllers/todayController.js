const Goal = require('../models/Goal');
const Task = require('../models/Task');
const FocusBlock = require('../models/FocusBlock');
const HabitCompletion = require('../models/HabitCompletion');

// GET /api/v1/today/summary
exports.getSummary = async (req, res) => {
    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        // 1. Quests (Goals)
        const allGoals = await Goal.find();
        const questsCompleted = allGoals.filter(g => g.completed).length;
        const questsTotal = allGoals.length;

        // 2. Focus Time today
        const focusBlocks = await FocusBlock.find({
            startTime: { $gte: today, $lt: tomorrow },
            status: 'completed'
        });
        const focusSeconds = focusBlocks.reduce((acc, curr) => acc + (curr.elapsedSeconds || 0), 0);

        // 3. Streak (Mocked for now or derived)
        const streak = 12; // Example static value until proper streak engine exists

        // 4. Weekly Goal
        const weeklyGoal = 78; // Example percentage

        // 5. Habits Done Today
        const habitsDone = await HabitCompletion.countDocuments({
            status: 'completed',
            completedAt: { $gte: today, $lt: tomorrow }
        });

        // 6. Tasks Due Today
        const tasksDueToday = await Task.countDocuments({
            dueDate: { $gte: today, $lt: tomorrow },
            status: { $ne: 'completed' }
        });

        res.json({
            success: true,
            data: {
                quests: {
                    completed: questsCompleted,
                    total: questsTotal
                },
                focus: {
                    seconds: focusSeconds
                },
                streak,
                weeklyGoal,
                habits: {
                    completed: habitsDone
                },
                tasks: {
                    dueToday: tasksDueToday
                }
            }
        });
    } catch (error) {
        console.error("Error in getSummary:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// GET /api/v1/today/calendar
exports.getCalendarEvents = async (req, res) => {
    try {
        // Mocking real calendar events
        const todayStr = new Date().toISOString().split('T')[0];
        
        const events = [
            { title: "NLP Lecture", detail: "CS Building, Room 301", start: new Date(`${todayStr}T10:00:00`).getTime(), color: "bg-purple-500" },
            { title: "Project Meeting", detail: "Online", start: new Date(`${todayStr}T13:30:00`).getTime(), color: "bg-blue-500" },
            { title: "Gym", detail: "Downtown Fitness", start: new Date(`${todayStr}T16:00:00`).getTime(), color: "bg-emerald-500" },
            { title: "Assignment Deadline", detail: "NLP Assignment", start: new Date(`${todayStr}T18:00:00`).getTime(), color: "bg-red-500" },
            { title: "Dinner", detail: "With Sarah", start: new Date(`${todayStr}T19:30:00`).getTime(), color: "bg-amber-500" }
        ];

        res.json({ success: true, data: events });
    } catch (error) {
        console.error("Error in getCalendarEvents:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// GET /api/v1/today/insights
exports.getInsights = async (req, res) => {
    try {
        res.json({
            success: true,
            data: {
                type: "focus_window",
                headline: "You focus 34% better between 9:30 AM and 12:10 PM.",
                description: "Your deep-work sessions during this window are consistently longer and have fewer interruptions.",
                confidence: 0.87
            }
        });
    } catch (error) {
        console.error("Error in getInsights:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};
