const mongoose = require('mongoose');

const decisionLogSchema = new mongoose.Schema({
  proposalId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Proposal',
    required: true
  },
  proposalType: {
    type: String,
    required: true
  },
  decision: {
    type: String,
    enum: ['accepted', 'rejected'],
    required: true
  },
  attributes: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

module.exports = mongoose.model('DecisionLog', decisionLogSchema);
