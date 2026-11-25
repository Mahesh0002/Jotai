const test = require('node:test');
const assert = require('node:assert');
const express = require('express');
const request = require('supertest');
const bcrypt = require('bcryptjs');

const User = require('../src/models/User');
const authRoutes = require('../src/routes/authRoutes');
const { contextMiddleware } = require('../src/middlewares/requestContext');
const errorHandler = require('../src/middlewares/errorHandler');

function buildApp() {
  const app = express();
  app.use(express.json());
  app.use('/auth', contextMiddleware, authRoutes);
  app.use(errorHandler);
  return app;
}

test('register sets an HTTP-only cookie and /me reads it', async () => {
  const originalFind = User.findOne;
  const originalCreate = User.create;
  User.findOne = async () => null;
  User.create = async (doc) => ({ _id: 'user-1', ...doc });

  try {
    const app = buildApp();
    const registered = await request(app)
      .post('/auth/register')
      .send({ email: 'runner@example.com', password: 'password123', username: 'runner' });
    assert.strictEqual(registered.status, 201);
    const cookie = registered.headers['set-cookie'][0];
    assert.match(cookie, /jotai_token=/);
    assert.match(cookie, /HttpOnly/i);

    const me = await request(app).get('/auth/me').set('Cookie', cookie);
    assert.strictEqual(me.body.data.id, 'user-1');
    assert.strictEqual(me.body.data.username, 'runner');
  } finally {
    User.findOne = originalFind;
    User.create = originalCreate;
  }
});

test('login rejects a wrong password and accepts the right one', async () => {
  const originalFind = User.findOne;
  const passwordHash = await bcrypt.hash('password123', 4);
  User.findOne = async () => ({
    _id: 'user-2',
    username: 'runner',
    email: 'runner@example.com',
    passwordHash,
  });

  try {
    const app = buildApp();
    const wrong = await request(app)
      .post('/auth/login')
      .send({ email: 'runner@example.com', password: 'wrong-password' });
    assert.strictEqual(wrong.status, 401);

    const right = await request(app)
      .post('/auth/login')
      .send({ email: 'runner@example.com', password: 'password123' });
    assert.strictEqual(right.status, 200);
    assert.match(right.headers['set-cookie'][0], /HttpOnly/i);
  } finally {
    User.findOne = originalFind;
  }
});

test('logout clears the auth cookie', async () => {
  const response = await request(buildApp()).post('/auth/logout');
  assert.strictEqual(response.status, 200);
  assert.match(response.headers['set-cookie'][0], /jotai_token=;/);
});
