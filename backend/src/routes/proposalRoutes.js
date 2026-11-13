const express = require('express');
const {
  createProposal,
  getProposals,
  updateProposalStatus
} = require('../controllers/proposalController');
const serviceAuth = require('../middlewares/serviceAuth');

const router = express.Router();

router.use(serviceAuth);

router.route('/')
  .get(getProposals)
  .post(createProposal);

router.route('/:id/status')
  .patch(updateProposalStatus);

module.exports = router;
