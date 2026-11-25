const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const config = require('../config');
const ApiError = require('../utils/ApiError');

function tokensEqual(left, right) {
  if (!left || !right) return false;
  const a = Buffer.from(String(left));
  const b = Buffer.from(String(right));
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

/**
 * Accepts EITHER a valid user JWT OR the Runner service token.
 * - service token -> req.service = 'runner' (and optional impersonation header)
 * - user JWT      -> req.user = decoded claims
 * Missing/invalid credentials are rejected with 401.
 */
const serviceAuth = (req, res, next) => {
  const header = req.headers.authorization || '';
  const [scheme, token] = header.split(' ');

  if (scheme !== 'Bearer' || !token) {
    return next(new ApiError(401, 'Authentication required'));
  }

  if (config.runnerServiceToken && tokensEqual(token, config.runnerServiceToken)) {
    req.service = 'runner';
    // Honored only on the service-token path.
    if (req.headers['x-jotai-user-id']) {
      req.authUserId = req.headers['x-jotai-user-id'];
    }
    return next();
  }

  try {
    req.user = jwt.verify(token, config.jwtSecret);
    return next();
  } catch (error) {
    return next(new ApiError(401, 'Invalid or expired token'));
  }
};

module.exports = serviceAuth;
module.exports.tokensEqual = tokensEqual;
