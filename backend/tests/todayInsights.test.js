const test = require('node:test');
const assert = require('node:assert');
const express = require('express');
const request = require('supertest');

const FocusBlock = require('../src/models/FocusBlock');
const todayRoutes = require('../src/routes/todayRoutes');

function buildApp() {
  const app = express();
  app.use(express.json());
  app.use('/today', todayRoutes);
  return app;
}

test('focus insight is computed from completed focus sessions', async () => {
  const originalFind = FocusBlock.find;
  FocusBlock.find = async (query) => {
    assert.strictEqual(query.status, 'completed');
    assert.ok(query.startTime.$gte instanceof Date);
    return [
      { startTime: new Date('2026-11-20T09:00:00'), durationMinutes: 100 },
      { startTime: new Date('2026-11-21T09:30:00'), durationMinutes: 80 },
      { startTime: new Date('2026-11-22T15:00:00'), durationMinutes: 30 },
    ];
  };

  try {
    const response = await request(buildApp()).get('/today/insights');
    assert.strictEqual(response.status, 200);
    assert.strictEqual(response.body.success, true);
    assert.strictEqual(response.body.data.type, 'focus_window');
    assert.match(response.body.data.headline, /focus 71% longer around 09:00–10:00/);
    assert.match(response.body.data.description, /3 completed focus sessions/);
    assert.ok(response.body.data.confidence > 0.5);
    assert.ok(response.body.data.confidence <= 0.95);
  } finally {
    FocusBlock.find = originalFind;
  }
});

test('insight is null when there is not enough focus history', async () => {
  const originalFind = FocusBlock.find;
  FocusBlock.find = async () => [
    { startTime: new Date('2026-11-20T09:00:00'), durationMinutes: 60 },
  ];

  try {
    const response = await request(buildApp()).get('/today/insights');
    assert.strictEqual(response.status, 200);
    assert.strictEqual(response.body.data, null);
    assert.match(response.body.message, /at least three/i);
  } finally {
    FocusBlock.find = originalFind;
  }
});
