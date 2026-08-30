const axios = require('axios');
const config = require('../config');

const getNews = async () => {
  if (!config.newsApiKey) {
    throw new Error('News API key not configured');
  }

  const response = await axios.get(
    `https://newsapi.org/v2/everything?q=technology&domains=cnn.com,bbc.com,techcrunch.com&sortBy=publishedAt&pageSize=5&apiKey=${config.newsApiKey}`
  );
  return response.data;
};

module.exports = { getNews };
