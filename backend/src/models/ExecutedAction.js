const mongoose = require('mongoose');

const executedActionSchema = new mongoose.Schema({
  actionId: {
    type: String,
    required: true,
    unique: true
  },
  actionName: {
    type: String,
    required: true
  },
  result: {
    type: mongoose.Schema.Types.Mixed
  }
}, { timestamps: true });

// TTL index to automatically clear idempotency keys after 24 hours
executedActionSchema.index({ createdAt: 1 }, { expireAfterSeconds: 86400 });

module.exports = mongoose.model('ExecutedAction', executedActionSchema);
