const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const dotenv = require('dotenv');
const newsRoutes = require('./routes/newsRoutes'); // Import the news routes

dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(morgan('dev'));
app.use(express.json()); // For parsing application/json

// Use the news routes
app.use('/api/news', newsRoutes); // Prefix API routes with /api/news

module.exports = app;
