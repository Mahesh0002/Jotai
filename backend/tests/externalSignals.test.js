const test = require('node:test');
const assert = require('node:assert');
const express = require('express');
const request = require('supertest');

const { egressGuard } = require('../src/middlewares/egressGuard');

function buildApp() {
  const app = express();
  app.use(egressGuard);
  for (const name of ['news', 'stocks', 'weather', 'ai', 'integrations']) {
    app.get(`/api/v1/${name}`, (req, res) => res.json({ success: true, name }));
  }
  app.get('/api/v1/tasks', (req, res) => res.json({ success: true, name: 'tasks' }));
  return app;
}

for (const name of ['news', 'stocks', 'weather', 'ai', 'integrations']) {
  test(`external ${name} endpoint is disabled in privacy mode`, async () => {
    const response = await request(buildApp()).get(`/api/v1/${name}`);
    assert.strictEqual(response.status, 404);
    assert.match(response.body.message, /privacy mode/i);
  });
}

test('local endpoints remain available', async () => {
  const response = await request(buildApp()).get('/api/v1/tasks');
  assert.strictEqual(response.status, 200);
  assert.strictEqual(response.body.name, 'tasks');
});
