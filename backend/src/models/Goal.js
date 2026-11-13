const mongoose = require('mongoose');

const goalSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String,
        trim: true
    },
    // Canonical status field — used by analytics, assistant, and all future code
    status: {
        type: String,
        enum: ['active', 'completed', 'archived'],
        default: 'active'
    },
    // Legacy boolean field — kept in sync by pre-save hook for backward compat
    completed: {
        type: Boolean,
        default: false
    },
    progress: {
        type: Number,
        default: 0,
        min: 0,
        max: 100
    },
    dueDate: {
        type: Date
    }
}, {
    timestamps: true
});

// Keep completed boolean in sync with status
goalSchema.pre('save', function (next) {
    this.completed = this.status === 'completed';
    next();
});

module.exports = mongoose.model('Goal', goalSchema);
