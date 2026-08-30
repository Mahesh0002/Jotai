const express = require('express');
const router = express.Router();
const axios = require('axios');

router.get('/', async (req, res) => {
  try {
    const apiKey = process.env.NEWS_API_KEY;

    if (!apiKey) {
      return res.status(500).json({ message: 'News API key not configured' });
    }

    // Default params similar to frontend
    const response = await axios.get(
      `https://newsapi.org/v2/everything?q=technology&domains=cnn.com,bbc.com,techcrunch.com&sortBy=publishedAt&pageSize=5&apiKey=${apiKey}`
    );

    res.json(response.data);
  } catch (error) {
    console.error('News API Error:', error.response?.data || error.message);
    res.status(error.response?.status || 500).json(error.response?.data || { message: 'Error fetching news' });
  }
});

module.exports = router;
