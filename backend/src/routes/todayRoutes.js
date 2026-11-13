const express = require('express');
const router = express.Router();
const { getSummary, getCalendarEvents, getInsights } = require('../controllers/todayController');

router.get('/summary', getSummary);
router.get('/calendar', getCalendarEvents);
router.get('/insights', getInsights);

module.exports = router;
