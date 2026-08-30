const mongoose = require('mongoose');

const analyticsSchema = new mongoose.Schema({
    focusTime: {
        type: Number,
        default: 0
    },
    streaks: {
        type: Number,
        default: 0
    },
    dailyActivity: {
        type: [Number],
        default: [0, 0, 0, 0, 0, 0, 0] // 7 days
    },
    lastUpdated: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Analytics', analyticsSchema);
