const metricsService = require('../services/metricsService');

/**
 * GET /api/v1/status
 * Returns computed status snapshot with real numbers
 */
exports.getStatus = async (req, res, next) => {
  try {
    const userId = req.userId || 'local_user';
    const status = await metricsService.getStatusSnapshot(userId);
    res.status(200).json({ success: true, data: status });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/v1/metrics/weekly
 * Returns weekly productivity metrics
 */
exports.getWeeklyMetrics = async (req, res, next) => {
  try {
    const userId = req.userId || 'local_user';
    const metrics = await metricsService.getWeeklyMetrics(userId);
    res.status(200).json({ success: true, data: metrics });
  } catch (error) {
    next(error);
  }
};