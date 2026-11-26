const { getDb, isInitialized } = require('../db');
const { PRIVACY_MODE } = require('../middlewares/egressGuard');

/**
 * GET /api/v1/health
 * Health check endpoint
 */
exports.getHealth = (req, res) => {
  const dbOk = isInitialized();
  const db = getDb();
  let dbStatus = 'disconnected';

  if (dbOk) {
    try {
      db.prepare('SELECT 1').get();
      dbStatus = 'ok';
    } catch {
      dbStatus = 'error';
    }
  }

  res.status(200).json({
    success: true,
    data: {
      ok: dbStatus === 'ok',
      db: dbStatus,
      privacyMode: PRIVACY_MODE,
      offline: PRIVACY_MODE === 'strict',
    },
  });
};

/**
 * GET /health (root level, for load balancers)
 */
exports.getRootHealth = (req, res) => {
  res.status(200).json({ ok: true });
};