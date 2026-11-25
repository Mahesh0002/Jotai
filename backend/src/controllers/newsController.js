const newsService = require('../services/newsService');
const ApiError = require('../utils/ApiError');

const getNews = async (req, res, next) => {
  try {
    const payload = await newsService.getNews();
    if (!payload || !Array.isArray(payload.articles)) {
      return next(new ApiError(400, 'News provider returned no articles'));
    }
    const articles = payload.articles.map((article) => ({
      title: article.title,
      description: article.description,
      source: article.source && article.source.name,
      url: article.url,
      publishedAt: article.publishedAt,
    }));
    res.json({ success: true, data: articles });
  } catch (err) {
    next(new ApiError(400, err.message));
  }
};

module.exports = { getNews };
