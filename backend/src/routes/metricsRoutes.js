const express = require('express');
const router = express.Router();
const metricsController = require('../controllers/metricsController');

router.get('/status', metricsController.getStatus);
router.get('/weekly', metricsController.getWeeklyMetrics);

module.exports = router;