// src/server.js
const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const cors = require('cors');

// Load environment variables from .env file
dotenv.config();

// Create an instance of Express
const app = express();

// Middleware
app.use(express.json());
app.use(cors());

// MongoDB connection URI from .env file
const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/your-database-name';

// Connect to MongoDB
mongoose.connect(mongoURI)
  .then(() => console.log('Connected to MongoDB'))
  .catch((err) => console.error('Error connecting to MongoDB:', err));

// Routes
const newsRoutes = require('./routes/newsRoutes');
const testRoutes = require('./routes/testRoutes');
const userRoutes = require('./routes/userRoutes');  // Ensure this is correct path

// Use the user routes
app.use('/api/users', userRoutes);

app.use('/api/news', newsRoutes);
app.use('/api/test', testRoutes);

// Example route to test the server
app.get('/', (req, res) => {
  res.send('Hello from the backend!');
});

// Global error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Something went wrong!', error: err.message });
});

// Start server
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
