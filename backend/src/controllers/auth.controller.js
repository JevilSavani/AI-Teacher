const ApiResponse = require('../utils/apiResponse');

/**
 * Authentication Controller Skeleton
 * Routes will call these methods when Auth is implemented.
 */
class AuthController {
  static async register(req, res, next) {
    try {
      return ApiResponse.success(res, null, 'Register endpoint prepared', 501);
    } catch (error) {
      next(error);
    }
  }

  static async login(req, res, next) {
    try {
      return ApiResponse.success(res, null, 'Login endpoint prepared', 501);
    } catch (error) {
      next(error);
    }
  }

  static async getProfile(req, res, next) {
    try {
      return ApiResponse.success(res, null, 'Get profile endpoint prepared', 501);
    } catch (error) {
      next(error);
    }
  }
}

module.exports = AuthController;
