const test = require('node:test');
const assert = require('node:assert');
const express = require('express');
const request = require('supertest');

const config = require('../src/config');
const Proposal = require('../src/models/Proposal');
const DecisionLog = require('../src/models/DecisionLog');
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

function mockProposal(status = 'pending') {
  return {
    _id: '64b000000000000000000001',
    type: 'schedule_proposal',
    data: {
      blocks: [
        { startTime: '2026-11-14T10:00:00.000Z', endTime: '2026-11-14T11:00:00.000Z' },
      ],
    },
    status,
    save: async function save() { this.saved = true; },
  };
}

test('accepting a proposal creates a decision log', async () => {
  const originalFindById = Proposal.findById;
  const originalCreate = DecisionLog.create;
  let logged = null;

  Proposal.findById = async () => mockProposal();
  DecisionLog.create = async (doc) => {
    logged = doc;
    return { _id: 'log-1', ...doc };
  };

  try {
    const response = await request(buildApp())
      .patch('/proposals/64b000000000000000000001/status')
      .send({ status: 'accepted' });

    assert.strictEqual(response.status, 200);
    assert.ok(logged, 'expected a decision log');
    assert.strictEqual(logged.decision, 'accepted');
    assert.strictEqual(logged.proposalType, 'schedule_proposal');
    assert.strictEqual(logged.attributes.durationMinutes, 60);
  } finally {
    Proposal.findById = originalFindById;
    DecisionLog.create = originalCreate;
  }
});

test('rejecting a proposal creates a decision log', async () => {
  const originalFindById = Proposal.findById;
  const originalCreate = DecisionLog.create;
  let logged = null;

  Proposal.findById = async () => mockProposal();
  DecisionLog.create = async (doc) => {
    logged = doc;
    return { _id: 'log-2', ...doc };
  };

  try {
    const response = await request(buildApp())
      .patch('/proposals/64b000000000000000000001/status')
      .send({ status: 'rejected' });

    assert.strictEqual(response.status, 200);
    assert.strictEqual(logged.decision, 'rejected');
  } finally {
    Proposal.findById = originalFindById;
    DecisionLog.create = originalCreate;
  }
});

test('a pending proposal does not create a decision log', async () => {
  const originalFindById = Proposal.findById;
  const originalCreate = DecisionLog.create;
  let called = false;

  Proposal.findById = async () => mockProposal();
  DecisionLog.create = async () => {
    called = true;
    return {};
  };

  try {
    const response = await request(buildApp())
      .patch('/proposals/64b000000000000000000001/status')
      .send({ status: 'pending' });
    assert.strictEqual(response.status, 200);
    assert.strictEqual(called, false);
  } finally {
    Proposal.findById = originalFindById;
    DecisionLog.create = originalCreate;
  }
});

test('decision log endpoint requires the service token', async () => {
  const response = await request(buildApp()).get('/proposals/decisions');
  assert.strictEqual(response.status, 401);
});

test('decision log endpoint returns logs for the service token', async () => {
  const originalFind = DecisionLog.find;
  DecisionLog.find = () => ({
    sort: () => ({ limit: async () => [{ decision: 'accepted' }] }),
  });

  try {
    const response = await request(buildApp())
      .get('/proposals/decisions')
      .set('Authorization', 'Bearer runner-test-token');
    assert.strictEqual(response.status, 200);
    assert.strictEqual(response.body.count, 1);
    assert.strictEqual(response.body.data[0].decision, 'accepted');
  } finally {
    DecisionLog.find = originalFind;
  }
});
