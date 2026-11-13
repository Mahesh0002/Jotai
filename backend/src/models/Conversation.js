const mongoose = require('mongoose');

const conversationSchema = new mongoose.Schema({
  title: {
    type: String,
    default: 'New Conversation'
  },
  context: {
    type: String,
    default: 'general'
  },
  active: {
    type: Boolean,
    default: true
  }
}, { timestamps: true });

module.exports = mongoose.model('Conversation', conversationSchema);
