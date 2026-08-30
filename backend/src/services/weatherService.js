const axios = require('axios');
const config = require('../config');

const getWeather = async (city) => {
  if (!config.weatherApiKey) {
    throw new Error('Weather API key not configured');
  }
  if (!city) {
    throw new Error('City parameter is required');
  }

  const response = await axios.get(
    `https://api.weatherapi.com/v1/current.json?key=${config.weatherApiKey}&q=${city}`
  );
  return response.data;
};

module.exports = { getWeather };
