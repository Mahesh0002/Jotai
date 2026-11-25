const express = require('express');
const {
  getHabits,
  createHabit,
  updateHabit,
  deleteHabit
} = require('../controllers/habitController');
const {
  toggleCompletion,
  getAnalytics,
  getConsistency
} = require('../controllers/habitCompletionController');
// Local single-user UI routes; see docs/STATUS.md (no login flow yet).
const router = express.Router();

router.route('/analytics').get(getAnalytics);
router.route('/consistency').get(getConsistency);

router.route('/')
  .get(getHabits)
  .post(createHabit);

router.route('/:id')
  .patch(updateHabit)
  .delete(deleteHabit);

router.route('/:id/complete')
  .post(toggleCompletion);

module.exports = router;
