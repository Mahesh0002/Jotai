const mongoose = require('mongoose');
const scopedPlugin = require('../middlewares/scopingPlugin');

const habitCompletionSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true },
  habitId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Habit',
    required: true
  },
  scheduledDate: {
    type: String, // Format: YYYY-MM-DD
    required: true
  },
  completedAt: {
    type: Date,
    default: Date.now
  },
  status: {
    type: String,
    enum: ['completed', 'missed', 'skipped'],
    default: 'completed'
  },
  xpAwarded: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Ensure a habit can only have one completion record per scheduled date
habitCompletionSchema.index({ habitId: 1, scheduledDate: 1 }, { unique: true });

habitCompletionSchema.plugin(scopedPlugin);

module.exports = mongoose.model('HabitCompletion', habitCompletionSchema);
