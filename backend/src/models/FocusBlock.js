const mongoose = require('mongoose');

const focusBlockSchema = new mongoose.Schema({
  taskId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Task',
    required: false
  },
  title: {
    type: String,
    required: function() { return !this.taskId; }, // Require title if no task attached
    trim: true
  },
  startTime: {
    type: Date,
    required: true
  },
  endTime: {
    type: Date,
    required: true
  },
  durationMinutes: {
    type: Number,
    required: true
  },
  elapsedSeconds: {
    type: Number,
    default: 0
  },
  pausedSeconds: {
    type: Number,
    default: 0
  },
  notes: {
    type: String,
    trim: true,
    default: ''
  },
  distractions: [{
    timestamp: Date,
    category: String,
    duration: Number
  }],
  type: {
    type: String,
    enum: ['deep_work', 'study', 'creative', 'admin', 'reading', 'break', 'custom'],
    default: 'deep_work'
  },
  status: {
    type: String,
    enum: ['scheduled', 'in_progress', 'completed', 'skipped'],
    default: 'scheduled'
  },
  xpReward: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('FocusBlock', focusBlockSchema);
