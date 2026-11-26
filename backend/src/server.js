const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const config = require('./config');
const { migrate } = require('./db/migrate');
const { assertPrivacyConfig } = require('./middlewares/egressGuard');
const errorHandler = require('./middlewares/errorHandler');
const { eventBus } = require('./services/eventBus');
const { close } = require('./db');

// Create an instance of Express
const app = express();

// Middleware
app.use(helmet());
app.use(morgan('dev'));
app.use(express.json());
app.use(cors({ origin: true, credentials: true }));

// Privacy mode assertion (must be before routes)
assertPrivacyConfig();

// Egress guard middleware (blocks external routes in strict mode)
const { egressGuard } = require('./middlewares/egressGuard');
app.use(egressGuard);

// Route Imports
const authRoutes = require('./routes/authRoutes');
const { contextMiddleware } = require('./middlewares/requestContext');
const requireUser = require('./middlewares/requireUser');
const goalRoutes = require('./routes/goalRoutes');
const habitRoutes = require('./routes/habitRoutes');
const noteRoutes = require('./routes/noteRoutes');
const userRoutes = require('./routes/userRoutes');
const taskRoutes = require('./routes/taskRoutes');
const projectRoutes = require('./routes/projectRoutes');
const focusRoutes = require('./routes/focusRoutes');
const todayRoutes = require('./routes/todayRoutes');
const analyticsRoutes = require('./routes/analyticsRoutes');
const proposalRoutes = require('./routes/proposalRoutes');
const assistantRoutes = require('./routes/assistantRoutes');
const calendarRoutes = require('./routes/calendarRoutes');
const metricsRoutes = require('./routes/metricsRoutes');
const conversationRoutes = require('./routes/conversationRoutes');
const eventRoutes = require('./routes/eventRoutes');
const healthRoutes = require('./routes/healthRoutes');
const preferenceRoutes = require('./routes/preferenceRoutes');

// API Versioning - mount routes under /api/v1/
const API_PREFIX = '/api/v1';

// Auth is public; every other API route requires a user cookie or runner token.
app.use(`${API_PREFIX}/auth`, contextMiddleware, authRoutes);
app.use(API_PREFIX, contextMiddleware, requireUser);

app.use(`${API_PREFIX}/goals`, goalRoutes);
app.use(`${API_PREFIX}/habits`, habitRoutes);
app.use(`${API_PREFIX}/notes`, noteRoutes);
app.use(`${API_PREFIX}/preferences`, preferenceRoutes);
app.use(`${API_PREFIX}/users`, userRoutes);
app.use(`${API_PREFIX}/tasks`, taskRoutes);
app.use(`${API_PREFIX}/projects`, projectRoutes);
app.use(`${API_PREFIX}/focus`, focusRoutes);
app.use(`${API_PREFIX}/today`, todayRoutes);
app.use(`${API_PREFIX}/analytics`, analyticsRoutes);
app.use(`${API_PREFIX}/proposals`, proposalRoutes);
app.use(`${API_PREFIX}/assistant`, assistantRoutes);
app.use(`${API_PREFIX}/calendar`, calendarRoutes);
app.use(`${API_PREFIX}/metrics`, metricsRoutes);
app.use(`${API_PREFIX}/conversations`, conversationRoutes);
app.use(`${API_PREFIX}/events`, eventRoutes);
app.use(`${API_PREFIX}/health`, healthRoutes);

// Root health check (for load balancers)
app.get('/health', (req, res) => {
  res.json({ ok: true });
});

// Basic info route
app.get('/', (req, res) => {
  res.send('Jōtai Backend (v2) is running securely!');
});

// Global Error Handler must be the last middleware
app.use(errorHandler);

// Start server
async function start() {
  // Run migrations
  await migrate();

  const server = app.listen(config.port, () => {
    console.log(`Server running in ${config.env} mode on port ${config.port}`);
  });

  let shuttingDown = false;
  const gracefulShutdown = async (signal) => {
    if (shuttingDown) return;
    shuttingDown = true;
    console.log(`${signal} received. Closing connections...`);

    const forceExit = setTimeout(() => process.exit(1), 10000);
    if (typeof forceExit.unref === 'function') forceExit.unref();

    try {
      await new Promise((resolve) => server.close(resolve));
      close();
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
}

start().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});