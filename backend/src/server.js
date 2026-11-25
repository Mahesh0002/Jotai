const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const config = require('./config');
const errorHandler = require('./middlewares/errorHandler');
const { closeRedis } = require('./services/eventPublisher');
const { startConversationCleanup, stopConversationCleanup } = require('./jobs/cleanupConversations');

// Create an instance of Express
const app = express();

// Middleware
app.use(helmet());
app.use(express.json());
app.use(cors({ origin: true, credentials: true }));

// Connect to MongoDB
mongoose.connect(config.mongoUri)
  .then(() => {
    console.log('Connected to MongoDB');
    startConversationCleanup();
  })
  .catch((err) => console.error('Error connecting to MongoDB:', err));

// Route Imports
const authRoutes = require('./routes/authRoutes');
const { contextMiddleware } = require('./middlewares/requestContext');
const requireUser = require('./middlewares/requireUser');
const goalRoutes = require('./routes/goalRoutes');
const habitRoutes = require('./routes/habitRoutes');
const noteRoutes = require('./routes/noteRoutes');
const userRoutes = require('./routes/userRoutes');
const aiRoutes = require('./routes/aiRoutes');
const weatherRoutes = require('./routes/weatherRoutes');
const stockRoutes = require('./routes/stockRoutes');
const newsRoutes = require('./routes/newsRoutes');
const taskRoutes = require('./routes/taskRoutes');
const projectRoutes = require('./routes/projectRoutes');
const focusRoutes = require('./routes/focusRoutes');
const todayRoutes = require('./routes/todayRoutes');
const analyticsRoutes = require('./routes/analyticsRoutes');
const integrationRoutes = require('./routes/integrationRoutes');
const proposalRoutes = require('./routes/proposalRoutes');
const assistantRoutes = require('./routes/assistantRoutes');

// API Versioning - mount routes under /api/v1/
const API_PREFIX = '/api/v1';

// Auth is public; every other API route requires a user cookie or runner token.
app.use(`${API_PREFIX}/auth`, contextMiddleware, authRoutes);
app.use(API_PREFIX, contextMiddleware, requireUser);

app.use(`${API_PREFIX}/goals`, goalRoutes);
app.use(`${API_PREFIX}/habits`, habitRoutes);
app.use(`${API_PREFIX}/notes`, noteRoutes);
app.use(`${API_PREFIX}/users`, userRoutes);
app.use(`${API_PREFIX}/ai`, aiRoutes);
app.use(`${API_PREFIX}/weather`, weatherRoutes);
app.use(`${API_PREFIX}/stocks`, stockRoutes);
app.use(`${API_PREFIX}/news`, newsRoutes);
app.use(`${API_PREFIX}/tasks`, taskRoutes);
app.use(`${API_PREFIX}/projects`, projectRoutes);
app.use(`${API_PREFIX}/focus`, focusRoutes);
app.use(`${API_PREFIX}/today`, todayRoutes);
app.use(`${API_PREFIX}/analytics`, analyticsRoutes);
app.use(`${API_PREFIX}/integrations`, integrationRoutes);
app.use(`${API_PREFIX}/proposals`, proposalRoutes);
app.use(`${API_PREFIX}/assistant`, assistantRoutes);

// Basic health check route
app.get('/', (req, res) => {
  res.send('Jōtai Backend (v1) is running securely!');
});

// Global Error Handler must be the last middleware
app.use(errorHandler);

// Start server
const server = app.listen(config.port, () => {
  console.log(`Server running in ${config.env} mode on port ${config.port}`);
});

let shuttingDown = false;
const gracefulShutdown = async (signal) => {
  if (shuttingDown) return;
  shuttingDown = true;
  console.log(`${signal} received. Closing connections...`);
  stopConversationCleanup();

  const forceExit = setTimeout(() => process.exit(1), 10000);
  if (typeof forceExit.unref === 'function') forceExit.unref();

  try {
    await new Promise((resolve) => server.close(resolve));
    await mongoose.disconnect();
    await closeRedis();
    console.log('Shutdown complete');
  } catch (error) {
    console.error('Error during shutdown:', error);
    process.exitCode = 1;
  } finally {
    clearTimeout(forceExit);
    process.exit(process.exitCode || 0);
  }
};

process.on('SIGTERM', () => { void gracefulShutdown('SIGTERM'); });
process.on('SIGINT', () => { void gracefulShutdown('SIGINT'); });
