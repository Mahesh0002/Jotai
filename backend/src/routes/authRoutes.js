const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const config = require('../config');
const ApiError = require('../utils/ApiError');

const router = express.Router();
const COOKIE = 'jotai_token';
const MAX_AGE = 7 * 24 * 60 * 60 * 1000;

function signToken(user) {
  return jwt.sign(
    { sub: user._id.toString(), username: user.username },
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

function validate(body) {
  const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
  const password = typeof body.password === 'string' ? body.password : '';
  if (!email || !password) return { error: 'Email and password are required' };
  if (password.length < 8) return { error: 'Password must be at least 8 characters' };
  return { email, password };
}

router.post('/register', async (req, res, next) => {
  try {
    const { error, email, password } = validate(req.body || {});
    if (error) return next(new ApiError(400, error));
    if (await User.findOne({ email })) return next(new ApiError(400, 'Email already registered'));

    const username =
      (typeof req.body.username === 'string' && req.body.username.trim()) || email.split('@')[0];
    const user = await User.create({
      username,
      email,
      passwordHash: await bcrypt.hash(password, 10),
    });

    setCookie(res, signToken(user));
    res.status(201).json({ success: true, data: { id: user._id, username, email } });
  } catch (err) {
    next(new ApiError(400, err.message));
  }
});

router.post('/login', async (req, res, next) => {
  try {
    const { error, email, password } = validate(req.body || {});
    if (error) return next(new ApiError(400, error));

    const user = await User.findOne({ email });
    if (!user || !user.passwordHash || !(await bcrypt.compare(password, user.passwordHash))) {
      return next(new ApiError(401, 'Invalid email or password'));
    }

    setCookie(res, signToken(user));
    res.json({ success: true, data: { id: user._id, username: user.username, email } });
  } catch (err) {
    next(new ApiError(400, err.message));
  }
});

router.post('/logout', (req, res) => {
  res.clearCookie(COOKIE, { path: '/' });
  res.json({ success: true });
});

router.get('/me', (req, res) => {
  res.json({
    success: true,
    data: req.userId ? { id: req.userId, username: req.user && req.user.username } : null,
  });
});

module.exports = router;
