const userService = require('../services/userService');
const ApiResponse = require('../utils/ApiResponse');
const ApiError = require('../utils/ApiError');

const createUser = async (req, res, next) => {
  try {
    const { username, email } = req.body;
    if (!username || !email) {
      throw new ApiError(400, 'Username and email are required');
    }
    const user = await userService.createUser({ username, email });
    res.status(201).json(new ApiResponse(201, user, 'User created successfully'));
  } catch (err) {
    next(new ApiError(err.statusCode || 500, err.message));
  }
};

const getUsers = async (req, res, next) => {
  try {
    const users = await userService.getUsers();
    res.status(200).json(new ApiResponse(200, users, 'Users retrieved successfully'));
  } catch (err) {
    next(new ApiError(500, err.message));
  }
};

module.exports = {
  createUser,
  getUsers,
};
