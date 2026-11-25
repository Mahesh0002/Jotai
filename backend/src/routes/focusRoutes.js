const express = require('express');
const {
  getBlocks,
  createBlock,
  updateBlock,
  deleteBlock,
  completeBlock
} = require('../controllers/focusBlockController');
// Local single-user UI routes; see docs/STATUS.md (no login flow yet).
const router = express.Router();

router.route('/')
  .get(getBlocks)
  .post(createBlock);

router.route('/:id')
  .patch(updateBlock)
  .delete(deleteBlock);

router.route('/:id/complete')
  .post(completeBlock);

module.exports = router;
