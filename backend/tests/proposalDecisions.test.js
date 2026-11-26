const test = require('node:test');
const assert = require('node:assert');
const express = require('express');
const request = require('supertest');

const { setupTestDb } = require('./helpers/testDb');
const { db, cleanup } = setupTestDb('proposals');

const config = require('../src/config');
const calendarService = require('../src/services/calendarService');
const proposalRoutes = require('../src/routes/proposalRoutes');
const errorHandler = require('../src/middlewares/errorHandler');

config.runnerServiceToken = 'runner-test-token';
config.env = 'test';

function buildApp() {
  const app = express();
  app.use(express.json());
  app.use('/proposals', proposalRoutes);
  app.use(errorHandler);
  return app;
}

const PROPOSAL_ID = '64b000000000000000000001';

function insertProposal(status = 'pending') {
  db.run('DELETE FROM decision_logs');
  db.run(
    `INSERT OR REPLACE INTO proposals (id, user_id, type, data, status, flags, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [
      PROPOSAL_ID,
      'local_user',
      'schedule_proposal',
      JSON.stringify({
        blocks: [
          { startTime: '2026-11-14T10:00:00.000Z', endTime: '2026-11-14T11:00:00.000Z' },
        ],
      }),
      status,
      '[]',
      new Date().toISOString(),
    ]
  );
}

function decisions() {
  return db.all('SELECT * FROM decision_logs WHERE proposal_id = ?', [PROPOSAL_ID]);
}

// Avoid touching the real calendar file while accepting proposals.
const originalWriteIcs = calendarService.writeCalendarIcs;
calendarService.writeCalendarIcs = async () => '/tmp/opencode/test-calendar.ics';

test('accepting a proposal creates a decision log', async () => {
  insertProposal('pending');
  const response = await request(buildApp())
    .patch(`/proposals/${PROPOSAL_ID}/status`)
    .send({ status: 'accepted' });

  assert.strictEqual(response.status, 200);
  const logs = decisions();
  assert.strictEqual(logs.length, 1);
  assert.strictEqual(JSON.parse(logs[0].context).durationMinutes, 60);
  const proposal = db.get('SELECT status FROM proposals WHERE id = ?', [PROPOSAL_ID]);
  assert.strictEqual(proposal.status, 'accepted');
});

test('rejecting a proposal creates a decision log', async () => {
  insertProposal('pending');
  const response = await request(buildApp())
    .patch(`/proposals/${PROPOSAL_ID}/status`)
    .send({ status: 'rejected' });

  assert.strictEqual(response.status, 200);
  const logs = decisions();
  assert.strictEqual(logs.length, 1);
  assert.strictEqual(logs[0].accepted, 0);
});

test('a pending proposal does not create a decision log', async () => {
  insertProposal('pending');
  const response = await request(buildApp())
    .patch(`/proposals/${PROPOSAL_ID}/status`)
    .send({ status: 'pending' });

  assert.strictEqual(response.status, 200);
  assert.strictEqual(decisions().length, 0);
});

test('decision log endpoint requires the service token', async () => {
  const response = await request(buildApp()).get('/proposals/decisions');
  assert.strictEqual(response.status, 401);
});

test('decision log endpoint returns logs for the service token', async () => {
  insertProposal('accepted');
  db.run(
    `INSERT INTO decision_logs (id, user_id, proposal_id, action_type, accepted, context, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    ['log-1', 'local_user', PROPOSAL_ID, 'schedule_proposal', 1, '{}', new Date().toISOString()]
  );

  const response = await request(buildApp())
    .get('/proposals/decisions')
    .set('Authorization', 'Bearer runner-test-token');
  assert.strictEqual(response.status, 200);
  assert.strictEqual(response.body.count, 1);
  assert.strictEqual(response.body.data[0].action_type, 'schedule_proposal');
});

test.after(() => {
  calendarService.writeCalendarIcs = originalWriteIcs;
  cleanup();
});
