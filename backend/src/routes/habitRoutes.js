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
const serviceAuth = require('../middlewares/serviceAuth');

const router = express.Router();
router.use(serviceAuth);

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
