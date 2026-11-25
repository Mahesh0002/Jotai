require('dotenv').config();

module.exports = {
  port: process.env.PORT || 5000,
  mongoUri: process.env.MONGODB_URI || 'mongodb://localhost:27017/jotai-db',
  jwtSecret: process.env.JWT_SECRET || 'fallback-secret-for-development-only',
  env: process.env.NODE_ENV || 'development',
  geminiApiKey: process.env.GEMINI_API_KEY || '',
  geminiModel: process.env.GEMINI_MODEL || 'gemini-3.6-flash',
  weatherApiKey: process.env.WEATHER_API_KEY || '',
  newsApiKey: process.env.NEWS_API_KEY || '',
  twelveDataApiKey: process.env.TWELVE_DATA_API_KEY || '',
  // Spotify (client_id only; no secret needed for PKCE flow)
  spotifyClientId: process.env.SPOTIFY_CLIENT_ID || '',
  // GitHub OAuth (only needed for OAuth flow; PAT flow needs no server config)
  githubClientId: process.env.GITHUB_CLIENT_ID || '',
  githubClientSecret: process.env.GITHUB_CLIENT_SECRET || '',
  runnerServiceToken: process.env.RUNNER_SERVICE_TOKEN || '',
};
