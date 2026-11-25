const mongoose = require('mongoose');
const scopedPlugin = require('../middlewares/scopingPlugin');

const ProposalSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true },
  type: {
    type: String,
    required: true,
    enum: ['schedule_proposal', 'habit_insight', 'subtask_suggestion']
  },
  data: {
    type: mongoose.Schema.Types.Mixed,
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'accepted', 'rejected'],
    default: 'pending'
  },
  flags: {
    type: [String],
    default: []
  }
}, { timestamps: true });

ProposalSchema.plugin(scopedPlugin);

module.exports = mongoose.model('Proposal', ProposalSchema);
