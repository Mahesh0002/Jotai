const test = require('node:test');
const assert = require('node:assert');
const express = require('express');
const request = require('supertest');
const axios = require('axios');

const config = require('../src/config');
const Preference = require('../src/models/Preference');
const todayRoutes = require('../src/routes/todayRoutes');

function buildApp() {
  const app = express();
  app.use('/today', todayRoutes);
  return app;
}

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

test('calendar endpoint filters real ICS events by date range', async () => {
  const originalFind = Preference.findOne;
  const originalGet = axios.get;
  Preference.findOne = async () => ({ calendarIcsUrl: 'https://example.com/calendar.ics' });
  axios.get = async () => ({ data: feed });

  try {
    const response = await request(buildApp()).get(
      '/today/calendar?startDate=2026-11-25T00:00:00Z&endDate=2026-11-26T00:00:00Z',
    );
    assert.strictEqual(response.status, 200);
    assert.strictEqual(response.body.configured, true);
    assert.strictEqual(response.body.data.length, 1);
    assert.strictEqual(response.body.data[0].title, 'Team sync');
  } finally {
    Preference.findOne = originalFind;
    axios.get = originalGet;
  }
});

test('calendar endpoint reports an empty feed when none is configured', async () => {
  const originalFind = Preference.findOne;
  const originalUrl = config.calendarIcsUrl;
  Preference.findOne = async () => ({ calendarIcsUrl: '' });
  config.calendarIcsUrl = '';

  try {
    const response = await request(buildApp()).get('/today/calendar');
    assert.strictEqual(response.status, 200);
    assert.strictEqual(response.body.configured, false);
    assert.deepStrictEqual(response.body.data, []);
  } finally {
    Preference.findOne = originalFind;
    config.calendarIcsUrl = originalUrl;
  }
});
