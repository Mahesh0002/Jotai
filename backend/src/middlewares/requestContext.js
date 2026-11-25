const { AsyncLocalStorage } = require('node:async_hooks');
const jwt = require('jsonwebtoken');
const config = require('../config');
const { tokensEqual } = require('./serviceAuth');

const userContext = new AsyncLocalStorage();

function readCookie(req, name) {
  const header = req.headers.cookie || '';
  for (const part of header.split(';')) {
    const [key, ...rest] = part.trim().split('=');
    if (key === name) return decodeURIComponent(rest.join('='));
  }
  return null;
}

/** Identifies the caller and propagates its user id into async request context. */
function contextMiddleware(req, res, next) {
  const header = req.headers.authorization || '';
  const [scheme, token] = header.split(' ');
  let userId = null;

  if (config.runnerServiceToken && scheme === 'Bearer' && tokensEqual(token, config.runnerServiceToken)) {
    req.service = 'runner';
    if (req.headers['x-jotai-user-id']) userId = String(req.headers['x-jotai-user-id']);
  } else {
    const candidate = readCookie(req, 'jotai_token') || (scheme === 'Bearer' ? token : null);
    if (candidate) {
      try {
        req.user = jwt.verify(candidate, config.jwtSecret);
        userId = req.user.sub || req.user.id || null;
      } catch (error) {
        // Invalid/expired token is treated as unauthenticated.
      }
    }
  }

  req.userId = userId;
  return userContext.run(userId, () => next());
}

module.exports = { contextMiddleware, userContext, readCookie };
