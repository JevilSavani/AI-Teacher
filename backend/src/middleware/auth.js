const jwt = require('jsonwebtoken');
const config = require('../config/env');
const ApiResponse = require('../utils/apiResponse');

/**
 * JWT Authentication Middleware
 * Verifies bearer token and attaches user payload to req.user.
 */
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return ApiResponse.error(res, 'Access token required. Please log in.', 401);
  }

  jwt.verify(token, config.jwt.secret, (err, user) => {
    if (err) {
      return ApiResponse.error(res, 'Session expired or invalid token. Please log in again.', 403);
    }
    
    req.user = user;
    next();
  });
};

module.exports = {
  authenticateToken
};
