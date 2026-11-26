const fs = require('fs');
const path = require('path');
const { parseIcs } = require('../utils/ical');
const calendarRepository = require('../repositories/calendarRepository');
const focusRepository = require('../repositories/focusRepository');
const preferenceRepository = require('../repositories/preferenceRepository');
const eventBus = require('./eventBus').eventBus;

/**
 * Read and parse local ICS file
 */
async function readLocalIcs(icsPath) {
  try {
    const fullPath = path.resolve(icsPath);
    if (!fs.existsSync(fullPath)) {
      return { events: [], error: 'ICS file not found' };
    }
    const content = fs.readFileSync(fullPath, 'utf8');
    const events = parseIcs(content);
    return { events, error: null };
  } catch (err) {
    console.error('[calendarService] Error reading ICS:', err.message);
    return { events: [], error: err.message };
  }
}

/**
 * Sync calendar events from local ICS file to database
 */
async function syncCalendarFromIcs(userId, icsPath) {
  const { events, error } = await readLocalIcs(icsPath);
  if (error) {
    return { events: [], configured: false, source: 'ics_file', error };
  }

  // Transform events to match calendar_events schema
  const transformed = events.map(e => ({
    external_id: e.uid || `ics-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    title: e.title || 'Untitled Event',
    start_time: new Date(e.start).toISOString(),
    end_time: new Date(e.end).toISOString(),
    source: 'ics',
  }));

  const saved = calendarRepository.upsertEvents(userId, transformed);
  return { events: saved, configured: true, source: 'ics_file' };
}

/**
 * Sync calendar from CalDAV (loopback/LAN only)
 */
async function syncCalendarFromCalDav(userId, caldavUrl) {
  // For now, return not implemented - can be extended later
  // This would require a CalDAV client library
  return { events: [], configured: false, source: 'caldav', error: 'CalDAV not implemented yet' };
}

/**
 * Main calendar sync function
 */
async function syncCalendar(userId) {
  const prefs = preferenceRepository.get(userId);
  const source = prefs?.calendar_source || 'none';
  const icsPath = prefs?.calendar_ics_path;

  if (source === 'ics_file' && icsPath) {
    return syncCalendarFromIcs(userId, icsPath);
  } else if (source === 'caldav' && prefs?.calendar_caldav_url) {
    return syncCalendarFromCalDav(userId, prefs.calendar_caldav_url);
  }

  return { events: [], configured: false, source: 'none' };
}

/**
 * Write focus blocks to outbound ICS file for calendar subscription
 */
async function writeCalendarIcs(userId, outboundPath) {
  const blocks = focusRepository.findScheduled(userId);
  const now = new Date().toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';

  let icsContent = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Jotai//Local//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    `DTSTAMP:${now}`,
  ];

  for (const block of blocks) {
    if (block.status === 'cancelled') continue;

    const uid = block.external_event_id || block.id;
    const dtStart = new Date(block.start_time).toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    const dtEnd = new Date(block.end_time).toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    const created = new Date(block.created_at).toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';

    icsContent.push(
      'BEGIN:VEVENT',
      `UID:${uid}`,
      `DTSTAMP:${now}`,
      `DTSTART:${dtStart}`,
      `DTEND:${dtEnd}`,
      `SUMMARY:${block.title}`,
      `DESCRIPTION:Focus block created by Jōtai`,
      `CREATED:${created}`,
      'END:VEVENT'
    );
  }

  icsContent.push('END:VCALENDAR');

  const fullPath = path.resolve(outboundPath);
  const dir = path.dirname(fullPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  fs.writeFileSync(fullPath, icsContent.join('\r\n'), 'utf8');
  return fullPath;
}

/**
 * Check if a new focus block conflicts with existing calendar events or focus blocks
 */
async function checkScheduleConstraints(userId, newBlock, existingBlocks = null, calendarEvents = null) {
  const blocks = existingBlocks || focusRepository.findScheduled(userId);
  const events = calendarEvents || (await syncCalendar(userId)).events;

  const newStart = new Date(newBlock.start_time);
  const newEnd = new Date(newBlock.end_time);

  // Check focus blocks
  for (const block of blocks) {
    if (block.status === 'cancelled') continue;
    if (block.id === newBlock.id) continue; // Skip self when updating

    const blockStart = new Date(block.start_time);
    const blockEnd = new Date(block.end_time);

    if (newStart < blockEnd && newEnd > blockStart) {
      return { conflict: true, with: 'focus_block', event: block };
    }
  }

  // Check calendar events
  for (const event of events) {
    const eventStart = new Date(event.start_time);
    const eventEnd = new Date(event.end_time);

    if (newStart < eventEnd && newEnd > eventStart) {
      return { conflict: true, with: 'calendar_event', event };
    }
  }

  return { conflict: false };
}

module.exports = {
  syncCalendar,
  writeCalendarIcs,
  checkScheduleConstraints,
  readLocalIcs,
};