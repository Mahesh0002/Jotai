const test = require('node:test');
const assert = require('node:assert');
const express = require('express');
const request = require('supertest');
const jwt = require('jsonwebtoken');

const config = require('../src/config');
const serviceAuth = require('../src/middlewares/serviceAuth');
const errorHandler = require('../src/middlewares/errorHandler');

config.runnerServiceToken = 'runner-test-token';
config.jwtSecret = 'jwt-test-secret';
config.env = 'test';

function buildApp() {
  const app = express();
  app.use(express.json());
  app.get('/protected', serviceAuth, (req, res) => {
    res.json({
      user: req.user || null,
      service: req.service || null,
      authUserId: req.authUserId || null,
    });
  });
  app.get('/service-only', serviceAuth, (req, res) => {
    if (req.service !== 'runner') {
      return res.status(403).json({ error: 'service token required' });
    }
    return res.json({ ok: true });
  });
  app.use(errorHandler);
  return app;
}

test('serviceAuth rejects a missing token', async () => {
  const response = await request(buildApp()).get('/protected');
  assert.strictEqual(response.status, 401);
});

test('serviceAuth rejects an invalid token', async () => {
  const response = await request(buildApp())
    .get('/protected')
    .set('Authorization', 'Bearer not-a-real-token');
  assert.strictEqual(response.status, 401);
});

test('serviceAuth accepts the service token and marks req.service', async () => {
  const response = await request(buildApp())
    .get('/protected')
    .set('Authorization', 'Bearer runner-test-token');
  assert.strictEqual(response.status, 200);
  assert.strictEqual(response.body.service, 'runner');
  assert.strictEqual(response.body.user, null);
});

test('serviceAuth still accepts a valid user JWT', async () => {
  const token = jwt.sign({ sub: 'user-1', role: 'user' }, config.jwtSecret);
  const response = await request(buildApp())
    .get('/protected')
    .set('Authorization', `Bearer ${token}`);
  assert.strictEqual(response.status, 200);
  assert.strictEqual(response.body.user.sub, 'user-1');
  assert.strictEqual(response.body.service, null);
});

test('a user JWT cannot gain service privileges', async () => {
  const token = jwt.sign({ sub: 'user-1', role: 'user' }, config.jwtSecret);
  const response = await request(buildApp())
    .get('/service-only')
    .set('Authorization', `Bearer ${token}`);
  assert.strictEqual(response.status, 403);
});

test('impersonation header is ignored for a user JWT', async () => {
  const token = jwt.sign({ sub: 'user-1' }, config.jwtSecret);
  const response = await request(buildApp())
    .get('/protected')
    .set('Authorization', `Bearer ${token}`)
    .set('x-jotai-user-id', 'someone-else');
  assert.strictEqual(response.status, 200);
  assert.strictEqual(response.body.authUserId, null);
});

test('impersonation header is honored only for the service token', async () => {
  const response = await request(buildApp())
    .get('/protected')
    .set('Authorization', 'Bearer runner-test-token')
    .set('x-jotai-user-id', 'someone-else');
  assert.strictEqual(response.status, 200);
  assert.strictEqual(response.body.authUserId, 'someone-else');
});

test('tokensEqual does not crash on different-length strings', () => {
  assert.strictEqual(serviceAuth.tokensEqual('short', 'a-much-longer-token'), false);
});
