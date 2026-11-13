const FocusBlock = require('../models/FocusBlock');
const Task = require('../models/Task');
const HabitCompletion = require('../models/HabitCompletion');
const Habit = require('../models/Habit');
const Goal = require('../models/Goal'); // Assuming Goal exists, if not we'll mock it or catch error

const getRange = (req) => {
    let { period, startDate, endDate } = req.query;
    if (startDate && endDate) {
        return { start: new Date(startDate), end: new Date(endDate) };
    }
    const now = new Date();
    let start = new Date();
    start.setHours(0,0,0,0); // start of today

    if (period === 'month') {
        start.setMonth(now.getMonth() - 1);
    } else if (period === 'year') {
        start.setFullYear(now.getFullYear() - 1);
    } else if (period === 'today') {
        // already start of today
    } else {
        // default week
        start.setDate(now.getDate() - 6); // 7 days inclusive
    }
    return { start, end: now };
};

// GET /api/v1/analytics/focus
exports.getFocusAnalytics = async (req, res) => {
    try {
        const { start, end } = getRange(req);
        
        const blocks = await FocusBlock.find({
            startTime: { $gte: start, $lte: end },
            status: 'completed'
        });

        let deepWork = 0;
        let projectWork = 0;
        let meetings = 0;
        let breaks = 0;

        const focusByDay = {};
        
        let d = new Date(start);
        while (d <= end) {
            focusByDay[d.toISOString().split('T')[0]] = 0;
            d.setDate(d.getDate() + 1);
        }

        blocks.forEach(b => {
            const actualSeconds = b.elapsedSeconds || (b.durationMinutes * 60);
            
            if (['deep_work', 'study', 'reading'].includes(b.type)) deepWork += actualSeconds;
            else if (['creative', 'custom'].includes(b.type)) projectWork += actualSeconds;
            else if (['admin'].includes(b.type)) meetings += actualSeconds;
            else if (['break'].includes(b.type)) breaks += actualSeconds;
            else deepWork += actualSeconds; // default

            const dateStr = b.startTime.toISOString().split('T')[0];
            if (focusByDay[dateStr] !== undefined) {
                focusByDay[dateStr] += actualSeconds;
            } else {
                focusByDay[dateStr] = actualSeconds;
            }
        });

        const total = deepWork + projectWork + meetings + breaks;

        const focusByDayArray = Object.keys(focusByDay).sort().map(date => {
            const dateObj = new Date(date);
            const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
            return {
                date,
                day: days[dateObj.getDay()],
                focusSeconds: focusByDay[date]
            };
        });

        res.json({
            success: true,
            data: {
                deepWork,
                projectWork,
                meetings,
                breaks,
                total,
                focusByDay: focusByDayArray
            }
        });

    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
};

// GET /api/v1/analytics/tasks
exports.getTasksAnalytics = async (req, res) => {
    try {
        const { start, end } = getRange(req);
        
        // Find tasks due or completed in the range
        const tasks = await Task.find({
            $or: [
                { dueDate: { $gte: start, $lte: end } },
                { completedAt: { $gte: start, $lte: end } }
            ]
        }).populate('projectId');

        const groups = {};

        tasks.forEach(t => {
            const catName = t.projectId ? t.projectId.name : 'Personal';
            if (!groups[catName]) {
                groups[catName] = { total: 0, completed: 0 };
            }
            groups[catName].total += 1;
            if (t.status === 'completed') {
                groups[catName].completed += 1;
            }
        });

        // Format for frontend
        const data = Object.keys(groups).map(key => ({
            id: key, // Using name as ID for simplicity
            label: key,
            completed: groups[key].completed,
            total: groups[key].total,
            percent: Math.round((groups[key].completed / groups[key].total) * 100)
        })).sort((a, b) => b.percent - a.percent); // sort by completion rate

        // Calculate "All Tasks"
        const allCompleted = data.reduce((sum, item) => sum + item.completed, 0);
        const allTotal = data.reduce((sum, item) => sum + item.total, 0);
        const allPercent = allTotal > 0 ? Math.round((allCompleted / allTotal) * 100) : 0;

        res.json({
            success: true,
            data: {
                all: { label: 'All Tasks', completed: allCompleted, total: allTotal, percent: allPercent },
                groups: data
            }
        });

    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
};

// GET /api/v1/analytics/xp
exports.getXpAnalytics = async (req, res) => {
    try {
        const { start, end } = getRange(req);
        
        const blocks = await FocusBlock.find({ endTime: { $gte: start, $lte: end }, status: 'completed' });
        const tasks = await Task.find({ completedAt: { $gte: start, $lte: end }, status: 'completed' });
        const habits = await HabitCompletion.find({ completedAt: { $gte: start, $lte: end }, status: 'completed' });

        const xpByDay = {};
        
        let d = new Date(start);
        while (d <= end) {
            xpByDay[d.toISOString().split('T')[0]] = 0;
            d.setDate(d.getDate() + 1);
        }

        const addXP = (dateStr, xp) => {
            if (!dateStr) return;
            const day = dateStr.split('T')[0];
            if (xpByDay[day] !== undefined) {
                xpByDay[day] += (xp || 0);
            } else {
                xpByDay[day] = (xp || 0);
            }
        };

        blocks.forEach(b => addXP(b.endTime.toISOString(), b.xpReward));
        tasks.forEach(t => addXP(t.completedAt.toISOString(), t.xpReward));
        habits.forEach(h => addXP(h.completedAt.toISOString(), h.xpAwarded));

        // Format for frontend
        const data = Object.keys(xpByDay).sort().map(date => {
            // Convert to Mon, Tue, etc.
            const dateObj = new Date(date);
            const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
            return {
                date,
                day: days[dateObj.getDay()],
                xp: xpByDay[date]
            };
        });

        res.json({
            success: true,
            data
        });

    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
};

// GET /api/v1/analytics/kpis
exports.getKpis = async (req, res) => {
    try {
        const { start, end } = getRange(req);
        
        // 1. Completion Rate
        const tasks = await Task.find({
            $or: [
                { dueDate: { $gte: start, $lte: end } },
                { completedAt: { $gte: start, $lte: end } }
            ]
        });
        const completedTasks = tasks.filter(t => t.status === 'completed').length;
        const completionRate = tasks.length > 0 ? (completedTasks / tasks.length) * 100 : 0;

        // 2. Focus Time
        const blocks = await FocusBlock.find({ startTime: { $gte: start, $lte: end }, status: 'completed' });
        let focusTimeSeconds = 0;
        blocks.forEach(b => {
            focusTimeSeconds += b.elapsedSeconds || (b.durationMinutes * 60);
        });

        // 3. Best Streak (global across all active habits)
        const habits = await Habit.find({ status: 'active' });
        const allComps = await HabitCompletion.find({ status: 'completed' });
        let bestStreak = 0;
        habits.forEach(h => {
            const comps = allComps.filter(c => c.habitId.toString() === h._id.toString());
            if (comps.length > bestStreak) bestStreak = comps.length;
        });

        // 4. Active Goals
        let activeGoals = 0;
        try {
            activeGoals = await Goal.countDocuments({ status: 'active' });
        } catch (e) {
            activeGoals = 0; // If Goal model doesn't exist or isn't populated
        }

        // 5. Total XP
        let totalXp = 0;
        blocks.forEach(b => totalXp += (b.xpReward || 0));
        tasks.filter(t => t.status === 'completed').forEach(t => totalXp += (t.xpReward || 0));
        
        const habitsInRange = await HabitCompletion.find({ completedAt: { $gte: start, $lte: end }, status: 'completed' });
        habitsInRange.forEach(h => totalXp += (h.xpAwarded || 0));

        res.json({
            success: true,
            data: {
                completionRate: Math.round(completionRate * 10) / 10,
                focusTimeSeconds,
                bestStreak,
                activeGoals,
                totalXp
            }
        });

    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
};
