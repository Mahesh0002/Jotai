const mongoose = require('mongoose');

const ProposalSchema = new mongoose.Schema({
  type: {
    type: String,
    required: true,
    enum: ['schedule_proposal', 'habit_insight']
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

module.exports = mongoose.model('Proposal', ProposalSchema);
