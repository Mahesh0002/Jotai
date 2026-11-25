const stockService = require('../services/stockService');
const ApiError = require('../utils/ApiError');

const asNumber = (value) => {
  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
};

const getStock = async (req, res, next) => {
  try {
    const payload = await stockService.getStock(req.query.symbol);
    if (payload && (payload.status === 'error' || payload.code)) {
      return next(new ApiError(400, payload.message || payload.code));
    }

    const values = payload && Array.isArray(payload.values) ? payload.values : [];
    const latest = values[0];
    const previous = values[1];
    if (!latest) return next(new ApiError(400, 'Stock provider returned no values'));

    const price = asNumber(latest.close);
    const previousPrice = asNumber(previous && previous.close);
    const change = previous ? price - previousPrice : 0;

    res.json({
      success: true,
      data: {
        symbol: (payload.meta && payload.meta.symbol) || req.query.symbol,
        price,
        change,
        percent_change: previousPrice ? (change / previousPrice) * 100 : 0,
        asOf: latest.datetime,
      },
    });
  } catch (err) {
    next(new ApiError(400, err.message));
  }
};

module.exports = { getStock };
