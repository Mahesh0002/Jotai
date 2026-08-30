const stockService = require('../services/stockService');
const ApiError = require('../utils/ApiError');

const getStock = async (req, res, next) => {
  try {
    const data = await stockService.getStock(req.query.symbol);
    res.json(data); // Raw data for frontend compatibility
  } catch (err) {
    next(new ApiError(400, err.message));
  }
};

module.exports = { getStock };
