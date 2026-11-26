const test = require('node:test');
const assert = require('node:assert');
const express = require('express');
const request = require('supertest');

const { setupTestDb } = require('./helpers/testDb');
const { db, cleanup } = setupTestDb('insights');

const todayRoutes = require('../src/routes/todayRoutes');

function buildApp() {
  const app = express();
  app.use(express.json());
  app.use('/today', todayRoutes);
  return app;
}

function insertFocusBlock(id, daysAgo, hour, minutes) {
  const start = new Date();
  start.setDate(start.getDate() - daysAgo);
  start.setHours(hour, 0, 0, 0);
  db.run(
    `INSERT INTO focus_blocks (id, user_id, title, start_time, end_time, elapsed_seconds, status, source, created_at)
     VALUES (?, ?, ?, ?, ?, ?, 'completed', 'assistant', ?)`,
    [
      id,
      'local_user',
      'Focus',
      start.toISOString(),
      new Date(start.getTime() + minutes * 60000).toISOString(),
      minutes * 60,
      new Date().toISOString(),
    ]
  );
}

test('focus insight is computed from completed focus sessions', async () => {
  insertFocusBlock('block-1', 6, 9, 100);
  insertFocusBlock('block-2', 5, 9, 80);
  insertFocusBlock('block-3', 4, 15, 30);

  const response = await request(buildApp()).get('/today/insights');
  assert.strictEqual(response.status, 200);
  assert.strictEqual(response.body.success, true);
  assert.strictEqual(response.body.data.type, 'focus_window');
  assert.match(response.body.data.headline, /focus 71% longer around 09:00–10:00/);
  assert.match(response.body.data.description, /3 completed focus sessions/);
  assert.ok(response.body.data.confidence > 0.5);
  assert.ok(response.body.data.confidence <= 0.95);
});

test('insight is null when there is not enough focus history', async () => {
  db.run('DELETE FROM focus_blocks');
  insertFocusBlock('block-4', 1, 9, 60);

  const response = await request(buildApp()).get('/today/insights');
  assert.strictEqual(response.status, 200);
  assert.strictEqual(response.body.data, null);
  assert.match(response.body.message, /at least three/i);
});

test.after(cleanup);
