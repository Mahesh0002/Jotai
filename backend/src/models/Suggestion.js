const mongoose = require('mongoose');
const scopedPlugin = require('../middlewares/scopingPlugin');

const suggestionSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true },
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

suggestionSchema.plugin(scopedPlugin);

module.exports = mongoose.model('Suggestion', suggestionSchema);
