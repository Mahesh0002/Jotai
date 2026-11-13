const express = require('express');
const {
  getBlocks,
  createBlock,
  updateBlock,
  deleteBlock,
  completeBlock
} = require('../controllers/focusBlockController');
const serviceAuth = require('../middlewares/serviceAuth');

const router = express.Router();
router.use(serviceAuth);

router.route('/')
  .get(getBlocks)
  .post(createBlock);

router.route('/:id')
  .patch(updateBlock)
  .delete(deleteBlock);

router.route('/:id/complete')
  .post(completeBlock);

module.exports = router;
