const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const config = require('../config');
const { run, get } = require('../db');
const ApiError = require('../utils/ApiError');

const router = express.Router();
const COOKIE = 'jotai_token';
const MAX_AGE = 7 * 24 * 60 * 60 * 1000;
const LOCAL_USER_ID = 'local_user';

function signToken(userId, username) {
  return jwt.sign(
    { sub: userId, username },
    config.jwtSecret,
    { expiresIn: '7d' },
  );
}

function setCookie(res, token) {
  res.cookie(COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: config.env === 'production',
    maxAge: MAX_AGE,
    path: '/',
  });
}

// POST /api/v1/auth/login - username/password or passwordless local mode
router.post('/login', async (req, res, next) => {
  try {
    const { username, password, email } = req.body || {};

    // If credentials provided, verify them
    if ((username || email) && password) {
      const user = get(
        `SELECT * FROM users WHERE username = ? OR email = ?`,
        [username || email, email || username]
      );
      if (!user || !user.password_hash) {
        return res.status(401).json({ success: false, error: 'Invalid credentials' });
      }
      const valid = await bcrypt.compare(password, user.password_hash);
      if (!valid) {
        return res.status(401).json({ success: false, error: 'Invalid credentials' });
      }
      const token = signToken(user.id, user.username || user.display_name);
      setCookie(res, token);
      return res.json({ success: true, data: { id: user.id, username: user.username || user.display_name } });
    }

    // Passwordless local mode (existing behavior)
    const user = get(`SELECT * FROM users WHERE id = ?`, [LOCAL_USER_ID]);
    if (!user) {
      run(
        `INSERT INTO users (id, display_name, username, email, chronotype, created_at) VALUES (?, ?, ?, ?, ?, ?)`,
        [LOCAL_USER_ID, 'Local User', 'local', 'local@jotai.local', 'unknown', new Date().toISOString()]
      );
    }

    const token = signToken(LOCAL_USER_ID, 'Local User');
    setCookie(res, token);
    res.json({ success: true, data: { id: LOCAL_USER_ID, username: 'Local User' } });
  } catch (err) {
    next(new ApiError(400, err.message));
  }
});

// POST /api/v1/auth/logout
router.post('/logout', (req, res) => {
  res.clearCookie(COOKIE, { path: '/' });
  res.json({ success: true });
});

// GET /api/v1/auth/me
router.get('/me', (req, res) => {
  res.json({
    success: true,
    data: req.userId ? { id: req.userId, username: 'Local User' } : null,
  });
});

module.exports = router;