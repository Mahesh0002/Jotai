import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import './NewsFeed.css';

const NewsFeed = () => {
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isExpanded, setIsExpanded] = useState(false);

  const apiKey = process.env.REACT_APP_NEWS_API_KEY;

  const filterArticles = (articles, prevArticles) => {
    const filtered = articles.filter(
      (article) =>
        article.title &&
        article.description &&
        !article.title.toLowerCase().includes('removed') &&
        !article.description.toLowerCase().includes('removed')
    );

    return filtered.filter(
      (article) => !prevArticles.some((prev) => prev.title === article.title)
    );
  };

  const fetchNews = useCallback(async () => {
    if (!apiKey) {
      setError('API key is missing! Please check your environment variables.');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const response = await fetch(
        `https://newsapi.org/v2/everything?q=technology&domains=cnn.com,bbc.com,techcrunch.com&sortBy=publishedAt&pageSize=5&apiKey=${apiKey}`
      );

      if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);

      const data = await response.json();
      if (!data.articles || data.articles.length === 0) throw new Error('No articles found.');

      const newArticles = filterArticles(data.articles, articles);
      setArticles((prevArticles) => (newArticles.length > 0 ? [...prevArticles, ...newArticles] : prevArticles));
      setError(null);
    } catch (err) {
      console.error('Error fetching news:', err);
      setError(`Failed to fetch news. ${err.message}`);
    } finally {
      setLoading(false);
    }
  }, [apiKey, articles]);

  useEffect(() => {
    fetchNews();
    const interval = setInterval(fetchNews, 1800000); // Refresh every 30 min
    return () => clearInterval(interval);
  }, [fetchNews]);

  const handleRetry = () => {
    setLoading(true);
    setError(null);
    fetchNews();
  };

  const toggleExpand = () => setIsExpanded(!isExpanded);

  const displayedArticles = isExpanded ? articles : articles.slice(0, 1);

  return (
    <motion.div
      className="news-feed skill-mastery-animated"
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
    >
      <motion.h2 className="cyberpunk-flicker" layoutId="news-title">
        News Dispatch
      </motion.h2>
      <AnimatePresence mode="wait">
        {loading ? (
          <motion.div
            key="loading"
            className="loading-spinner"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.4 }}
          />
        ) : error ? (
          <motion.div
            key="error"
            className="error-container"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.4 }}
          >
            <p>{error}</p>
            <button onClick={handleRetry} className="retry-btn animated-btn neon-pulse">
              Retry
            </button>
          </motion.div>
        ) : (
          <motion.div
            key="articles"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.4 }}
          >
            <ul className="news-list">
              <AnimatePresence>
                {displayedArticles.length > 0 ? (
                  displayedArticles.map((article) => (
                    <motion.li
                      key={article.url}
                      className="news-item skill-mastery-list-animated neon-pulse"
                      initial={{ opacity: 0, x: 40 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -40 }}
                      transition={{ duration: 0.5 }}
                      layout
                    >
                      {article.urlToImage && (
                        <motion.img
                          src={article.urlToImage}
                          alt={article.title}
                          className="news-image"
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ duration: 0.5 }}
                        />
                      )}
                      <a
                        href={article.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="news-link"
                      >
                        {article.title}
                      </a>
                      <p className="news-description">{article.description}</p>
                    </motion.li>
                  ))
                ) : (
                  <motion.p
                    className="news-empty"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                  >
                    No articles found. Please try again later.
                  </motion.p>
                )}
              </AnimatePresence>
            </ul>
            {articles.length > 1 && (
              <motion.button
                onClick={toggleExpand}
                className="expand-btn animated-btn"
                whileTap={{ scale: 0.96 }}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
              >
                {isExpanded ? 'Show Less' : 'Show More'}
              </motion.button>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default NewsFeed;
