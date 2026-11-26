const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const express = require('express');
const request = require('supertest');

const { setupTestDb } = require('./helpers/testDb');
const { db, cleanup } = setupTestDb('calendar');

const todayRoutes = require('../src/routes/todayRoutes');

function buildApp() {
  const app = express();
  app.use('/today', todayRoutes);
  return app;
}

const feedPath = '/tmp/opencode/jotai-test-calendar.ics';
const feed = [
  'BEGIN:VCALENDAR',
  'BEGIN:VEVENT',
  'SUMMARY:Team sync',
  'DTSTART:20261125T100000Z',
  'DTEND:20261125T110000Z',
  'END:VEVENT',
  'BEGIN:VEVENT',
  'SUMMARY:Next week',
  'DTSTART:20261201T100000Z',
  'DTEND:20261201T110000Z',
  'END:VEVENT',
  'END:VCALENDAR',
].join('\r\n');

test.before(() => {
  fs.writeFileSync(feedPath, feed, 'utf8');
  db.run(
    `INSERT INTO preferences (user_id, calendar_source, calendar_ics_path, updated_at)
     VALUES (?, 'ics_file', ?, ?)`,
    ['local_user', feedPath, new Date().toISOString()]
  );
});

test('calendar endpoint filters local ICS events by date range', async () => {
  const response = await request(buildApp()).get(
    '/today/calendar?startDate=2026-11-25T00:00:00Z&endDate=2026-11-26T00:00:00Z',
  );
  assert.strictEqual(response.status, 200);
  assert.strictEqual(response.body.configured, true);
  assert.strictEqual(response.body.data.length, 1);
  assert.strictEqual(response.body.data[0].title, 'Team sync');
});

test('calendar endpoint reports an empty feed when none is configured', async () => {
  db.run(`UPDATE preferences SET calendar_source = 'none' WHERE user_id = ?`, ['local_user']);
  const response = await request(buildApp()).get('/today/calendar');
  assert.strictEqual(response.status, 200);
  assert.strictEqual(response.body.configured, false);
  assert.deepStrictEqual(response.body.data, []);
});

test.after(() => {
  cleanup();
  try { fs.unlinkSync(feedPath); } catch { /* already gone */ }
});
