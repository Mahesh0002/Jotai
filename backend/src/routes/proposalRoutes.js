const express = require('express');
const {
  createProposal,
  getProposals,
  updateProposalStatus,
  getDecisionLogs
} = require('../controllers/proposalController');
const serviceAuth = require('../middlewares/serviceAuth');

const router = express.Router();

// Runner-only: creating proposals and reading the decision log.
router.get('/decisions', serviceAuth, getDecisionLogs);
router.post('/', serviceAuth, createProposal);

// Local UI routes (no login flow yet; see docs/STATUS.md limitation).
router.get('/', getProposals);
router.patch('/:id/status', updateProposalStatus);

module.exports = router;
