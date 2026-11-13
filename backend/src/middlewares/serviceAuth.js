const jwt = require('jsonwebtoken');
const config = require('../config');
const ApiError = require('../utils/ApiError');

const serviceAuth = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];

      // Check for service token (OR-logic layer)
      if (config.runnerServiceToken && token === config.runnerServiceToken) {
        req.service = 'runner';
        return next();
      }
      
      // If we had strict JWT logic, we would verify here.
      // But since the frontend doesn't send JWTs in this local single-user app,
      // we just let it fall through.
    }

    // Pass through normal frontend requests
    next();
  } catch (error) {
    next();
  }
};

module.exports = serviceAuth;
