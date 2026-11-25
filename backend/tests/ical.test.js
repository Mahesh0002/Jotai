const test = require('node:test');
const assert = require('node:assert');
const { parseIcs } = require('../src/utils/ical');

const feed = [
  'BEGIN:VCALENDAR',
  'VERSION:2.0',
  'BEGIN:VEVENT',
  'SUMMARY:Team sync',
  'LOCATION:Online',
  'DTSTART:20261125T100000Z',
  'DTEND:20261125T110000Z',
  'END:VEVENT',
  'BEGIN:VEVENT',
  'SUMMARY:All day\\, relaxed',
  'DTSTART;VALUE=DATE:20261126',
  'DTEND;VALUE=DATE:20261127',
  'END:VEVENT',
  'BEGIN:VEVENT',
  'SUMMARY:Long',
  'DESCRIPTION:a folded\\n',
  ' description',
  'DTSTART:20261127T120000Z',
  'END:VEVENT',
  'END:VCALENDAR',
].join('\r\n');

test('parseIcs reads timed and all-day events', () => {
  const events = parseIcs(feed);
  assert.strictEqual(events.length, 3);
  assert.strictEqual(events[0].title, 'Team sync');
  assert.strictEqual(events[0].detail, 'Online');
  assert.strictEqual(events[0].end - events[0].start, 60 * 60 * 1000);
  assert.strictEqual(events[1].title, 'All day, relaxed');
  assert.strictEqual(events[1].end - events[1].start, 24 * 60 * 60 * 1000);
  assert.ok(events[2].detail.includes('a folded'));
  assert.strictEqual(events[2].end - events[2].start, 60 * 60 * 1000);
});

test('parseIcs tolerates empty input', () => {
  assert.deepStrictEqual(parseIcs(''), []);
});
