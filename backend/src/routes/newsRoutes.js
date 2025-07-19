// src/routes/newsRoutes.js
const express = require('express');
const router = express.Router();

// Import the News model
const News = require('../models/News');

// Route to get all news
router.get('/', async (req, res) => {
  try {
    const news = await News.find();
    res.json(news);
  } catch (error) {
    res.status(500).json({ message: 'Failed to get news', error: error.message });
  }
});

// Route to insert a sample news item (for testing purposes)
router.post('/insert', async (req, res) => {
  try {
    const newNews = new News({
      title: "Sample News Title",
      content: "This is the content for the sample news article."
    });
    await newNews.save();
    res.json({ message: 'News item inserted' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to insert news', error: error.message });
  }
});

module.exports = router;
