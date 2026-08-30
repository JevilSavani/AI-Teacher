const logger = require('../utils/logger');
const ApiResponse = require('../utils/apiResponse');

// eslint-disable-next-line no-unused-vars
const errorHandler = (err, req, res, _next) => {
  logger.error(`Error occurred on ${req.method} ${req.originalUrl}:`, err.stack || err.message);

  const statusCode = err.statusCode || (res.statusCode !== 200 ? res.statusCode : 500);
  const message = err.message || 'An unexpected internal server error occurred';
  const details = process.env.NODE_ENV === 'development' ? err.stack : undefined;

  return ApiResponse.error(res, message, statusCode, details);
};

module.exports = errorHandler;
