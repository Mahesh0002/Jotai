const express = require('express');
const preferenceRepository = require('../repositories/preferenceRepository');

const router = express.Router();
const USER_ID = 'local_user';

function parseJson(value, fallback) {
  if (!value) return fallback;
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
}

function toClient(row) {
  return {
    id: USER_ID,
    calendarIcsUrl: row.calendar_ics_path || '',
    calendarSource: row.calendar_source,
    briefingTime: row.briefing_time,
    workoutTime: row.workout_time,
    focusMinutes: row.focus_minutes,
    breakMinutes: row.break_minutes,
    workoutDays: row.workout_days,
    chronotype: row.chronotype,
    theme: row.theme || 'dark',
    integrations: parseJson(row.integrations, {}),
    settings: parseJson(row.settings, {}),
    updatedAt: row.updated_at,
  };
}

// GET /api/v1/preferences
router.get('/', (req, res, next) => {
  try {
    const row = preferenceRepository.get(USER_ID);
    res.json(toClient(row || {}));
  } catch (err) {
    next(err);
  }
});

// PUT /api/v1/preferences
router.put('/', (req, res, next) => {
  try {
    const updates = {};
    if (typeof req.body.calendarIcsUrl === 'string') {
      updates.calendar_ics_path = req.body.calendarIcsUrl;
    }
    if (typeof req.body.theme === 'string') updates.theme = req.body.theme;
    if (req.body.integrations && typeof req.body.integrations === 'object') {
      updates.integrations = JSON.stringify(req.body.integrations);
    }
    if (req.body.settings && typeof req.body.settings === 'object') {
      updates.settings = JSON.stringify(req.body.settings);
    }

    preferenceRepository.update(USER_ID, updates);
    res.json(toClient(preferenceRepository.get(USER_ID)));
  } catch (err) {
    next(err);
  }
});

module.exports = router;
