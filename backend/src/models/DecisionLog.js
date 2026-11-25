const mongoose = require('mongoose');
const scopedPlugin = require('../middlewares/scopingPlugin');

const decisionLogSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true },
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

decisionLogSchema.plugin(scopedPlugin);

module.exports = mongoose.model('DecisionLog', decisionLogSchema);
