const express = require('express');
const router = express.Router();
const Analytics = require('../models/Analytics');

// GET analytics
router.get('/', async (req, res) => {
    try {
        // Assuming single user for now, get the first document or create one
        let analytics = await Analytics.findOne();
        if (!analytics) {
            analytics = new Analytics();
            await analytics.save();
        }
        res.json(analytics);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// POST update analytics
router.post('/', async (req, res) => {
    try {
        let analytics = await Analytics.findOne();
        if (!analytics) {
            analytics = new Analytics();
        }

        if (req.body.focusTime != null) analytics.focusTime = req.body.focusTime;
        if (req.body.streaks != null) analytics.streaks = req.body.streaks;
        if (req.body.dailyActivity != null) analytics.dailyActivity = req.body.dailyActivity;

        analytics.lastUpdated = Date.now();

        const updatedAnalytics = await analytics.save();
        res.json(updatedAnalytics);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

module.exports = router;
