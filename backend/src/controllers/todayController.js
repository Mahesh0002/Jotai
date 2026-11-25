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

// GET /api/v1/today/calendar?startDate=...&endDate=...
// NOTE: synthetic events, not a real calendar integration. The Runner labels
// this data as synthetic in its planning prompt.
exports.getCalendarEvents = async (req, res) => {
    try {
        const start = req.query.startDate ? new Date(req.query.startDate) : new Date();
        const end = req.query.endDate
            ? new Date(req.query.endDate)
            : new Date(start.getTime() + 24 * 60 * 60 * 1000);

        const templates = [
            { title: "NLP Lecture", detail: "CS Building, Room 301", time: "10:00", minutes: 60, color: "bg-purple-500" },
            { title: "Project Meeting", detail: "Online", time: "13:30", minutes: 45, color: "bg-blue-500" },
            { title: "Gym", detail: "Downtown Fitness", time: "16:00", minutes: 60, color: "bg-emerald-500" },
            { title: "Assignment Deadline", detail: "NLP Assignment", time: "18:00", minutes: 30, color: "bg-red-500" },
            { title: "Dinner", detail: "With Sarah", time: "19:30", minutes: 60, color: "bg-amber-500" }
        ];

        const events = [];
        const cursor = new Date(start);
        cursor.setHours(0, 0, 0, 0);
        let day = 0;
        while (cursor < end && day < 14) {
            const dayStr = cursor.toISOString().split('T')[0];
            for (const template of templates) {
                const eventStart = new Date(`${dayStr}T${template.time}:00`);
                events.push({
                    title: template.title,
                    detail: template.detail,
                    start: eventStart.getTime(),
                    end: eventStart.getTime() + template.minutes * 60 * 1000,
                    color: template.color
                });
            }
            cursor.setDate(cursor.getDate() + 1);
            day += 1;
        }

        res.json({ success: true, data: events, synthetic: true });
    } catch (error) {
        console.error("Error in getCalendarEvents:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// GET /api/v1/today/insights
// Deterministic aggregation of completed focus blocks (no LLM call).
exports.getInsights = async (req, res) => {
    try {
        const since = new Date();
        since.setDate(since.getDate() - 30);

        const blocks = await FocusBlock.find({
            status: 'completed',
            startTime: { $gte: since }
        });

        if (blocks.length < 3) {
            return res.json({
                success: true,
                data: null,
                message: 'Complete at least three focus sessions to unlock an insight.'
            });
        }

        const minutesByHour = new Map();
        for (const block of blocks) {
            const date = new Date(block.startTime);
            if (Number.isNaN(date.getTime())) continue;
            const hour = date.getHours();
            const minutes = Number(block.durationMinutes) || 0;
            minutesByHour.set(hour, (minutesByHour.get(hour) || 0) + minutes);
        }

        if (minutesByHour.size === 0) {
            return res.json({ success: true, data: null, message: 'No usable focus sessions yet.' });
        }

        const ranked = [...minutesByHour.entries()].sort((a, b) => b[1] - a[1]);
        const [bestHour, bestMinutes] = ranked[0];
        const totalMinutes = [...minutesByHour.values()].reduce((sum, value) => sum + value, 0);
        const averageMinutes = totalMinutes / minutesByHour.size;
        const lift = averageMinutes > 0
            ? Math.round(((bestMinutes - averageMinutes) / averageMinutes) * 100)
            : 0;
        const start = `${String(bestHour).padStart(2, '0')}:00`;
        const end = `${String((bestHour + 1) % 24).padStart(2, '0')}:00`;

        res.json({
            success: true,
            data: {
                type: 'focus_window',
                headline: lift > 0
                    ? `You focus ${lift}% longer around ${start}–${end}.`
                    : 'Your focus time is fairly even across the day.',
                description: `Based on ${blocks.length} completed focus sessions in the last 30 days. Your strongest window is ${start}–${end}, with ${Math.round(bestMinutes)} focused minutes.`,
                confidence: Math.min(0.95, 0.5 + blocks.length / 100)
            }
        });
    } catch (error) {
        console.error("Error in getInsights:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};
