const mongoose = require('mongoose');

const suggestionSchema = new mongoose.Schema({
  type: {
    type: String,
    required: true
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high'],
    default: 'medium'
  },
  title: {
    type: String,
    required: true
  },
  message: {
    type: String,
    required: true
  },
  targetModule: {
    type: String,
    required: true
  },
  actions: [{
    type: String
  }],
  status: {
    type: String,
    enum: ['pending', 'accepted', 'dismissed', 'expired', 'executed'],
    default: 'pending'
  }
}, { timestamps: true });

module.exports = mongoose.model('Suggestion', suggestionSchema);
