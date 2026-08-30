const ApiResponse = require('../utils/apiResponse');

const notFoundHandler = (req, res, _next) => {
  return ApiResponse.error(
    res,
    `Cannot ${req.method} ${req.originalUrl} - Route not found`,
    404
  );
};

module.exports = notFoundHandler;
