import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import './StockUpdates.css';

const StockUpdates = () => {
  const stockSymbols = ['GOOGL', 'NVDA', 'TSLA', 'AAPL', 'MSFT', 'AMZN', 'META'];

  const [stockData, setStockData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [symbol, setSymbol] = useState(stockSymbols[0]);

  const fetchStockData = async () => {
    setLoading(true);
    const apiKey = process.env.REACT_APP_TWELVEDATA_API_KEY; // Replace with your Twelve Data API key

    try {
      const response = await fetch(
        `https://api.twelvedata.com/time_series?symbol=${symbol}&interval=1min&apikey=${apiKey}`
      );

      if (!response.ok) throw new Error(`HTTP ${response.status}`);

      const data = await response.json();
      if (data && data.values && Array.isArray(data.values)) {
        const latest = data.values[0];
        setStockData({
          symbol: data.meta.symbol,
          price: latest.close,
          change: (latest.close - latest.open).toFixed(2),
          percentChange: (((latest.close - latest.open) / latest.open) * 100).toFixed(2),
          open: latest.open,
          high: latest.high,
          low: latest.low,
          volume: latest.volume,
        });
        setError(null);
      } else if (data.message) {
        throw new Error(data.message);
      } else {
        throw new Error('Invalid data format');
      }
    } catch (err) {
      setError(`Error fetching stock data: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStockData();
    // eslint-disable-next-line
  }, [symbol]);

  return (
    <motion.div
      className="stock-updates-widget"
      initial={{ opacity: 0, y: 30, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
    >
      <h3>Market Watch</h3>

      <motion.select
        className="symbol-input"
        value={symbol}
        onChange={(e) => setSymbol(e.target.value)}
        whileFocus={{ scale: 1.05, boxShadow: "0 0 10px #8e44ad" }}
      >
        {stockSymbols.map((stock) => (
          <option key={stock} value={stock}>
            {stock}
          </option>
        ))}
      </motion.select>

      <div style={{ minHeight: 120 }}>
        <AnimatePresence mode="wait">
          {loading && (
            <motion.p
              key="loading"
              className="loading-message"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              Loading stock data...
            </motion.p>
          )}
          {error && !loading && (
            <motion.p
              key="error"
              className="error-message"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
            >
              {error}
            </motion.p>
          )}
          {stockData && !loading && !error && (
            <motion.div
              key={stockData.symbol + stockData.price}
              className="stock-info"
              initial={{ opacity: 0, scale: 0.96, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: -20 }}
              transition={{ duration: 0.4 }}
              layout
            >
              <h4>{stockData.symbol}</h4>
              <p>Price: ${stockData.price}</p>
              <p>
                Change:{" "}
                <span className={Number(stockData.change) > 0 ? "positive" : Number(stockData.change) < 0 ? "negative" : ""}>
                  ${stockData.change} ({stockData.percentChange}%)
                </span>
              </p>
              <p>Open: ${stockData.open}</p>
              <p>High: ${stockData.high}</p>
              <p>Low: ${stockData.low}</p>
              <p>Volume: {stockData.volume}</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <motion.button
        onClick={fetchStockData}
        className="randomize-btn"
        whileTap={{ scale: 0.96 }}
        whileHover={{ scale: 1.04 }}
      >
        Refresh Data
      </motion.button>
    </motion.div>
  );
};

export default StockUpdates;
