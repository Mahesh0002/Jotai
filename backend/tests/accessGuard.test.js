const test = require('node:test');
const assert = require('node:assert');
const express = require('express');
const request = require('supertest');
const jwt = require('jsonwebtoken');

const config = require('../src/config');
const { contextMiddleware } = require('../src/middlewares/requestContext');
const requireUser = require('../src/middlewares/requireUser');
const errorHandler = require('../src/middlewares/errorHandler');

function buildApp() {
  const app = express();
  app.use(express.json());
  app.use(contextMiddleware);
  app.use(requireUser);
  app.get('/probe', (req, res) => {
    res.json({ service: req.service || null, userId: req.userId || null });
  });
  app.use(errorHandler);
  return app;
}

test('unauthenticated API requests are rejected with 401', async () => {
  const response = await request(buildApp()).get('/probe');
  assert.strictEqual(response.status, 401);
  assert.strictEqual(response.body.message, 'Authentication required');
});

test('runner service token is accepted without a user id', async () => {
  const originalToken = config.runnerServiceToken;
  config.runnerServiceToken = 'runner-secret';
  try {
    const response = await request(buildApp())
      .get('/probe')
      .set('Authorization', 'Bearer runner-secret');
    assert.strictEqual(response.status, 200);
    assert.strictEqual(response.body.service, 'runner');
    assert.strictEqual(response.body.userId, null);
  } finally {
    config.runnerServiceToken = originalToken;
  }
});

test('runner service token can impersonate a user via header', async () => {
  const originalToken = config.runnerServiceToken;
  config.runnerServiceToken = 'runner-secret';
  try {
    const response = await request(buildApp())
      .get('/probe')
      .set('Authorization', 'Bearer runner-secret')
      .set('x-jotai-user-id', 'user-9');
    assert.strictEqual(response.status, 200);
    assert.strictEqual(response.body.userId, 'user-9');
  } finally {
    config.runnerServiceToken = originalToken;
  }
});

test('a valid auth cookie is accepted and exposes the user id', async () => {
  const token = jwt.sign({ sub: 'user-42', username: 'tester' }, config.jwtSecret);
  const response = await request(buildApp())
    .get('/probe')
    .set('Cookie', `jotai_token=${token}`);
  assert.strictEqual(response.status, 200);
  assert.strictEqual(response.body.userId, 'user-42');
});

test('an invalid auth cookie is treated as unauthenticated', async () => {
  const response = await request(buildApp())
    .get('/probe')
    .set('Cookie', 'jotai_token=garbage');
  assert.strictEqual(response.status, 401);
});
