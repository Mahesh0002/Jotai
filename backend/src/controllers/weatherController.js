const weatherService = require('../services/weatherService');
const ApiResponse = require('../utils/ApiResponse');
const ApiError = require('../utils/ApiError');

const getWeather = async (req, res, next) => {
  try {
    const data = await weatherService.getWeather(req.query.city);
    // Note: returning data directly to match frontend expectations if necessary, 
    // but adopting standard response is better. Let's send raw to not break frontend.
    res.json(data);
  } catch (err) {
    next(new ApiError(400, err.message));
  }
};

module.exports = { getWeather };
