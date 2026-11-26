require('dotenv').config();

module.exports = {
  port: process.env.PORT || 5000,
  env: process.env.NODE_ENV || 'development',
  jwtSecret: process.env.JWT_SECRET || 'fallback-secret-for-development-only',
  runnerServiceToken: process.env.RUNNER_SERVICE_TOKEN || '',
  dbPath: process.env.DB_PATH || './data/jotai.db',
  calendarIcsPath: process.env.CALENDAR_ICS_PATH || './data/incoming.ics',
  calendarCalDavUrl: process.env.CALENDAR_CALDAV_URL || '',
  calendarOutboundIcsPath: process.env.CALENDAR_OUTBOUND_ICS_PATH || './data/jotai-calendar.ics',
  privacyMode: process.env.PRIVACY_MODE || 'strict',
};