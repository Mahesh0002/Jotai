const weatherService = require('../services/weatherService');
const ApiError = require('../utils/ApiError');

const getWeather = async (req, res, next) => {
  try {
    const payload = await weatherService.getWeather(req.query.city);
    if (!payload || !payload.current || !payload.location) {
      return next(new ApiError(400, 'Weather provider returned no current conditions'));
    }

    res.json({
      success: true,
      data: {
        location: {
          name: payload.location.name,
          region: payload.location.region,
          country: payload.location.country,
        },
        current: {
          temp_c: payload.current.temp_c,
          feelslike_c: payload.current.feelslike_c,
          humidity: payload.current.humidity,
          wind_kph: payload.current.wind_kph,
          condition: payload.current.condition,
          last_updated: payload.current.last_updated,
        },
      },
    });
  } catch (err) {
    next(new ApiError(400, err.message));
  }
};

module.exports = { getWeather };
