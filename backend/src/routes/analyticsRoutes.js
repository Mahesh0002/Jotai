const express = require('express');
const {
    getFocusAnalytics,
    getTasksAnalytics,
    getXpAnalytics,
    getKpis
} = require('../controllers/analyticsController');

const router = express.Router();

router.get('/focus', getFocusAnalytics);
router.get('/tasks', getTasksAnalytics);
router.get('/xp', getXpAnalytics);
router.get('/kpis', getKpis);

module.exports = router;
