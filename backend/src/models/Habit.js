const mongoose = require('mongoose');
const scopedPlugin = require('../middlewares/scopingPlugin');

const habitSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true },
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  icon: {
    type: String,
    default: '✦'
  },
  category: {
    type: String,
    default: 'Uncategorized'
  },
  frequencyType: {
    type: String,
    enum: ['every_day', 'weekdays', 'weekends', 'custom'],
    default: 'every_day'
  },
  customDays: [{
    type: Number, // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
    min: 0,
    max: 6
  }],
  time: {
    type: String // e.g., '09:00 AM'
  },
  targetDurationMinutes: {
    type: Number
  },
  xpReward: {
    type: Number,
    default: 10
  },
  status: {
    type: String,
    enum: ['active', 'paused', 'archived'],
    default: 'active'
  }
}, {
  timestamps: true
});

habitSchema.plugin(scopedPlugin);

module.exports = mongoose.model('Habit', habitSchema);
