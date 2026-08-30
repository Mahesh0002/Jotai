const mongoose = require('mongoose');

const habitSchema = new mongoose.Schema({
    text: {
        type: String,
        required: true,
        trim: true
    },
    frequency: {
        type: String,
        enum: ['daily', 'weekly', 'monthly'],
        default: 'daily'
    },
    completed: {
        type: Boolean,
        default: false
    },
    goalId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Goal'
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Habit', habitSchema);
