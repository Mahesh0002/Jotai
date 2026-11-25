const ApiError = require('../utils/ApiError');

/** Runner service calls are allowed; UI requests need a valid user cookie/JWT. */
module.exports = (req, res, next) => {
  if (req.service === 'runner' || req.userId) return next();
  return next(new ApiError(401, 'Authentication required'));
};
