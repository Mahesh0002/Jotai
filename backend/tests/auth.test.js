const test = require('node:test');
const assert = require('node:assert');
const express = require('express');
const request = require('supertest');
const bcrypt = require('bcryptjs');

const { setupTestDb } = require('./helpers/testDb');
const { db, cleanup } = setupTestDb('auth');

const authRoutes = require('../src/routes/authRoutes');
const { contextMiddleware } = require('../src/middlewares/requestContext');
const errorHandler = require('../src/middlewares/errorHandler');

function buildApp() {
  const app = express();
  app.use(express.json());
  app.use(contextMiddleware);
  app.use('/auth', contextMiddleware, authRoutes);
  app.use(errorHandler);
  return app;
}

test('local login sets an HTTP-only cookie and /me reads it', async () => {
  const app = buildApp();
  const login = await request(app).post('/auth/login').send({});
  assert.strictEqual(login.status, 200);
  const cookie = login.headers['set-cookie'][0];
  assert.match(cookie, /jotai_token=/);
  assert.match(cookie, /HttpOnly/i);

  const me = await request(app).get('/auth/me').set('Cookie', cookie);
  assert.strictEqual(me.status, 200);
  assert.strictEqual(me.body.data.id, 'local_user');
  assert.ok(me.body.data.username);
});

test('login rejects a wrong password and accepts the right one', async () => {
  const passwordHash = await bcrypt.hash('password123', 4);
  db.run(
    `INSERT INTO users (id, display_name, username, email, password_hash, chronotype, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    ['user-2', 'Runner', 'runner', 'runner@example.com', passwordHash, 'unknown', new Date().toISOString()]
  );

  const app = buildApp();
  const wrong = await request(app)
    .post('/auth/login')
    .send({ email: 'runner@example.com', password: 'wrong-password' });
  assert.strictEqual(wrong.status, 401);

  const right = await request(app)
    .post('/auth/login')
    .send({ email: 'runner@example.com', password: 'password123' });
  assert.strictEqual(right.status, 200);
  assert.strictEqual(right.body.data.id, 'user-2');
  assert.match(right.headers['set-cookie'][0], /HttpOnly/i);
});

test('logout clears the auth cookie', async () => {
  const response = await request(buildApp()).post('/auth/logout');
  assert.strictEqual(response.status, 200);
  assert.match(response.headers['set-cookie'][0], /jotai_token=;/);
});

test.after(cleanup);
