const Proposal = require('../models/Proposal');
const DecisionLog = require('../models/DecisionLog');

function extractAttributes(data) {
  if (!data || typeof data !== 'object') return {};
  const attributes = {};
  const keys = ['timeOfDay', 'durationMinutes', 'focusType', 'startTime', 'endTime', 'taskId'];
  for (const key of keys) {
    if (data[key] !== undefined) attributes[key] = data[key];
  }

  const block = Array.isArray(data.blocks) ? data.blocks[0] : null;
  if (block && typeof block === 'object') {
    for (const key of ['startTime', 'endTime', 'title', 'taskId']) {
      if (block[key] !== undefined && attributes[key] === undefined) {
        attributes[key] = block[key];
      }
    }
    if (attributes.durationMinutes === undefined && block.startTime && block.endTime) {
      const minutes = (new Date(block.endTime) - new Date(block.startTime)) / 60000;
      if (Number.isFinite(minutes) && minutes > 0) attributes.durationMinutes = minutes;
    }
  }
  return attributes;
}

exports.createProposal = async (req, res, next) => {
  try {
    const proposal = await Proposal.create(req.body);
    res.status(201).json({ success: true, data: proposal });
  } catch (error) {
    next(error);
  }
};

exports.getProposals = async (req, res, next) => {
  try {
    const { status } = req.query;
    const query = {};
    if (status) query.status = status;
    const proposals = await Proposal.find(query).sort({ createdAt: -1 });
    res.status(200).json({ success: true, count: proposals.length, data: proposals });
  } catch (error) {
    next(error);
  }
};

exports.updateProposalStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    if (!['pending', 'accepted', 'rejected'].includes(status)) {
      return res.status(400).json({ success: false, error: 'Invalid status' });
    }

    const proposal = await Proposal.findById(req.params.id);
    if (!proposal) {
      return res.status(404).json({ success: false, error: 'Proposal not found' });
    }

    const previous = proposal.status;
    proposal.status = status;
    await proposal.save();

    let decisionLog = null;
    if (status !== previous && (status === 'accepted' || status === 'rejected')) {
      decisionLog = await DecisionLog.create({
        proposalId: proposal._id,
        proposalType: proposal.type,
        decision: status,
        attributes: extractAttributes(proposal.data)
      });
    }

    res.status(200).json({ success: true, data: proposal, decisionLog });
  } catch (error) {
    next(error);
  }
};

exports.getDecisionLogs = async (req, res, next) => {
  try {
    const limit = Math.min(parseInt(req.query.limit, 10) || 200, 1000);
    const logs = await DecisionLog.find().sort({ createdAt: -1 }).limit(limit);
    res.status(200).json({ success: true, count: logs.length, data: logs });
  } catch (error) {
    next(error);
  }
};

exports.extractAttributes = extractAttributes;
