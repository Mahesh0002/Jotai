const express = require('express');
const router = express.Router();
const eventController = require('../controllers/eventController');
const serviceAuth = require('../middlewares/serviceAuth');

router.get('/', eventController.getEvents);
router.post('/', serviceAuth, eventController.postEvent);

module.exports = router;