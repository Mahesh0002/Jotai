const test = require('node:test');
const assert = require('node:assert');
const express = require('express');
const request = require('supertest');

const Preference = require('../src/models/Preference');
const preferenceRoutes = require('../src/routes/preferenceRoutes');

function buildApp() {
  const app = express();
  app.use(express.json());
  app.use('/preferences', preferenceRoutes);
  return app;
}

function fakePreference() {
  return {
    integrations: { spotify: false },
    theme: 'dark',
    settings: {},
    save: async function save() { return this; },
  };
}

test('preferences PUT persists the settings object', async () => {
  const originalFindOne = Preference.findOne;
  const preference = fakePreference();
  Preference.findOne = async () => preference;

  try {
    const response = await request(buildApp())
      .put('/preferences')
      .send({ theme: 'dark', settings: { theme: 'Dark', taskDue: false } });

    assert.strictEqual(response.status, 200);
    assert.strictEqual(response.body.settings.theme, 'Dark');
    assert.strictEqual(response.body.settings.taskDue, false);
    assert.strictEqual(preference.settings.taskDue, false);
  } finally {
    Preference.findOne = originalFindOne;
  }
});

test('preferences GET returns saved settings', async () => {
  const originalFindOne = Preference.findOne;
  Preference.findOne = async () => ({
    ...fakePreference(),
    settings: { displayName: 'Jōtai Runner' },
  });

  try {
    const response = await request(buildApp()).get('/preferences');
    assert.strictEqual(response.status, 200);
    assert.strictEqual(response.body.settings.displayName, 'Jōtai Runner');
  } finally {
    Preference.findOne = originalFindOne;
  }
});
