const express = require('express');
const router = express.Router();
const calendarController = require('../controllers/calendarController');
const serviceAuth = require('../middlewares/serviceAuth');

router.get('/sync', calendarController.syncCalendar);
router.get('/events', calendarController.getCalendarEvents);
router.post('/focus', calendarController.createFocusBlock);

module.exports = router;