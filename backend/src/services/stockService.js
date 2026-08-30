const axios = require('axios');
const config = require('../config');

const getStock = async (symbol) => {
  if (!config.twelveDataApiKey) {
    throw new Error('Twelve Data API key not configured');
  }
  if (!symbol) {
    throw new Error('Symbol parameter is required');
  }

  const response = await axios.get(
    `https://api.twelvedata.com/time_series?symbol=${symbol}&interval=1min&apikey=${config.twelveDataApiKey}`
  );
  return response.data;
};

module.exports = { getStock };
