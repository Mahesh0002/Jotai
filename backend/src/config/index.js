require('dotenv').config();

module.exports = {
  port: process.env.PORT || 3001,
  mongoUri: process.env.MONGODB_URI || 'mongodb://localhost:27017/jotai-db',
  jwtSecret: process.env.JWT_SECRET || 'fallback-secret-for-development-only',
  env: process.env.NODE_ENV || 'development',
  geminiApiKey: process.env.GEMINI_API_KEY || '',
  weatherApiKey: process.env.WEATHER_API_KEY || '',
  newsApiKey: process.env.NEWS_API_KEY || '',
  twelveDataApiKey: process.env.TWELVE_DATA_API_KEY || ''
};
