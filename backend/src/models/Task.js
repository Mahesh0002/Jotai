const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema({
  title: { 
    type: String, 
    required: true,
    trim: true
  },
  description: { 
    type: String, 
    default: "",
    trim: true
  },
  status: { 
    type: String, 
    enum: ["not_started", "in_progress", "blocked", "completed"], 
    default: "not_started" 
  },
  priority: { 
    type: String, 
    enum: ["high", "medium", "low"], 
    default: "medium" 
  },
  dueDate: { 
    type: Date 
  },
  estimatedMinutes: { 
    type: Number 
  },
  projectId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Project' 
  },
  tags: [{ 
    type: String 
  }],
  subtasks: [{
    title: { type: String, required: true },
    isCompleted: { type: Boolean, default: false }
  }],
  isStarred: { 
    type: Boolean, 
    default: false 
  },
  completedAt: { 
    type: Date 
  },
  xpReward: { 
    type: Number, 
    default: 0 
  },
  userId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User' 
  }
}, { 
  timestamps: true 
});

module.exports = mongoose.model('Task', taskSchema);
