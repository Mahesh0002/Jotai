/**
 * Egress Guard Middleware
 * Blocks access to external API routes when PRIVACY_MODE=strict
 */

const PRIVACY_MODE = process.env.PRIVACY_MODE || 'strict';

// Routes that are external services and should be blocked in strict mode
const BLOCKED_ROUTES = [
  '/api/v1/weather',
  '/api/v1/stocks',
  '/api/v1/news',
  '/api/v1/ai',
  '/api/v1/integrations',
];

// Check if a path matches any blocked route prefix
function isBlockedRoute(path) {
  return BLOCKED_ROUTES.some(route => path.startsWith(route));
}

function egressGuard(req, res, next) {
  if (PRIVACY_MODE === 'strict' && isBlockedRoute(req.path)) {
    return res.status(404).json({
      success: false,
      message: 'Endpoint not available in privacy mode',
    });
  }
  next();
}

/**
 * Startup assertion - call this during server initialization
 * Exits process if privacy mode is strict but non-local endpoints are configured
 */
function assertPrivacyConfig() {
  if (PRIVACY_MODE !== 'strict') {
    console.log('PRIVACY MODE: permissive (external endpoints allowed)');
    return true;
  }

  const violations = [];

  // Check for external API keys that would enable external calls
  const externalKeys = [
    { key: 'GEMINI_API_KEY', name: 'Gemini API' },
    { key: 'WEATHER_API_KEY', name: 'Weather API' },
    { key: 'NEWS_API_KEY', name: 'News API' },
    { key: 'TWELVE_DATA_API_KEY', name: 'Twelve Data API' },
    { key: 'SPOTIFY_CLIENT_ID', name: 'Spotify' },
    { key: 'GITHUB_CLIENT_ID', name: 'GitHub' },
  ];

  for (const { key, name } of externalKeys) {
    if (process.env[key]) {
      violations.push(`${name} (${key}) is set but PRIVACY_MODE=strict`);
    }
  }

  // Check calendar URL - must be local file or loopback
  const calendarUrl = process.env.CALENDAR_ICS_URL || process.env.CALENDAR_CALDAV_URL;
  if (calendarUrl) {
    try {
      const url = new URL(calendarUrl);
      const hostname = url.hostname;
      const isLocal = hostname === 'localhost' ||
                      hostname === '127.0.0.1' ||
                      hostname === '::1' ||
                      hostname.startsWith('192.168.') ||
                      hostname.startsWith('10.') ||
                      hostname.startsWith('172.16.') ||
                      url.protocol === 'file:';
      if (!isLocal) {
        violations.push(`CALENDAR_ICS_URL points to non-local host: ${hostname}`);
      }
    } catch {
      // Not a valid URL, might be a file path - that's OK
    }
  }

  if (violations.length > 0) {
    console.error('PRIVACY VIOLATIONS:');
    for (const v of violations) {
      console.error(`  - ${v}`);
    }
    console.error('Set PRIVACY_MODE=permissive or remove external configurations.');
    process.exit(1);
  }

  console.log('PRIVACY OK: all endpoints local');
  return true;
}

module.exports = { egressGuard, assertPrivacyConfig, PRIVACY_MODE };