const test = require('node:test');
const assert = require('node:assert');
const express = require('express');
const request = require('supertest');

const { setupTestDb } = require('./helpers/testDb');
const { db, cleanup } = setupTestDb('preferences');

const preferenceRoutes = require('../src/routes/preferenceRoutes');

function buildApp() {
  const app = express();
  app.use(express.json());
  app.use('/preferences', preferenceRoutes);
  return app;
}

const now = new Date().toISOString();
db.run(
  `INSERT INTO preferences (user_id, theme, settings, integrations, updated_at) VALUES (?, ?, ?, ?, ?)`,
  ['local_user', 'dark', '{}', '{}', now]
);

test('preferences PUT persists the settings object', async () => {
  const response = await request(buildApp())
    .put('/preferences')
    .send({ theme: 'dark', settings: { theme: 'Dark', taskDue: false } });

  assert.strictEqual(response.status, 200);
  assert.strictEqual(response.body.settings.theme, 'Dark');
  assert.strictEqual(response.body.settings.taskDue, false);

  const row = db.get('SELECT settings FROM preferences WHERE user_id = ?', ['local_user']);
  assert.strictEqual(JSON.parse(row.settings).taskDue, false);
});

test('preferences GET returns saved settings', async () => {
  db.run(`UPDATE preferences SET settings = ? WHERE user_id = ?`, [
    JSON.stringify({ displayName: 'Jōtai Runner' }),
    'local_user',
  ]);

  const response = await request(buildApp()).get('/preferences');
  assert.strictEqual(response.status, 200);
  assert.strictEqual(response.body.settings.displayName, 'Jōtai Runner');
});

test.after(cleanup);
