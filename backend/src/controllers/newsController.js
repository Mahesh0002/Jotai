const newsService = require('../services/newsService');
const ApiError = require('../utils/ApiError');

const getNews = async (req, res, next) => {
  try {
    const data = await newsService.getNews();
    res.json(data); // Sending raw data to not break frontend parsing
  } catch (err) {
    next(new ApiError(400, err.message));
  }
};

module.exports = { getNews };
