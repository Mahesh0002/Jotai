const Proposal = require('../models/Proposal');

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
    let query = {};
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
    const proposal = await Proposal.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true, runValidators: true }
    );
    if (!proposal) {
      return res.status(404).json({ success: false, error: 'Proposal not found' });
    }
    res.status(200).json({ success: true, data: proposal });
  } catch (error) {
    next(error);
  }
};
