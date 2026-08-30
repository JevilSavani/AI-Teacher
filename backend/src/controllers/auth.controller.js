const ApiResponse = require('../utils/apiResponse');
const AuthService = require('../services/auth');
const StudentProfileService = require('../services/student');
const { query } = require('../config/db');
const { validateEmail, validatePassword, validateRequiredFields } = require('../validators');

/**
 * Authentication Controller
 * Routes will call these methods to register, login, and verify users.
 */
class AuthController {
  static async register(req, res, next) {
    try {
      const { name, email, password } = req.body;

      // Validate required fields
      const missing = validateRequiredFields(req.body, ['name', 'email', 'password']);
      if (missing.length > 0) {
        return ApiResponse.error(res, `Missing required fields: ${missing.join(', ')}`, 400);
      }

      // Validate email format
      if (!validateEmail(email)) {
        return ApiResponse.error(res, 'Please provide a valid email address.', 400);
      }

      // Validate password strength
      if (!validatePassword(password)) {
        return ApiResponse.error(res, 'Password must be at least 6 characters long.', 400);
      }

      // Validate name length
      if (name.trim().length < 2) {
        return ApiResponse.error(res, 'Name must be at least 2 characters long.', 400);
      }

      const data = await AuthService.registerUser({ name, email, password });
      return ApiResponse.success(res, data, 'User registered successfully', 201);
    } catch (error) {
      next(error);
    }
  }

  static async login(req, res, next) {
    try {
      const { email, password } = req.body;

      // Validate required fields
      const missing = validateRequiredFields(req.body, ['email', 'password']);
      if (missing.length > 0) {
        return ApiResponse.error(res, `Missing required fields: ${missing.join(', ')}`, 400);
      }

      // Validate email format
      if (!validateEmail(email)) {
        return ApiResponse.error(res, 'Please provide a valid email address.', 400);
      }

      const data = await AuthService.loginUser({ email, password });
      return ApiResponse.success(res, data, 'Login successful');
    } catch (error) {
      next(error);
    }
  }

  static async getMe(req, res, next) {
    try {
      // req.user is set by authenticateToken middleware
      const userId = req.user.id;

      const userResult = await query(
        'SELECT id, name, email, created_at FROM users WHERE id = $1',
        [userId]
      );

      if (userResult.rows.length === 0) {
        return ApiResponse.error(res, 'User not found', 404);
      }

      // Also fetch student profile
      const profile = await StudentProfileService.getProfileByUserId(userId);

      return ApiResponse.success(
        res,
        { user: userResult.rows[0], profile },
        'User retrieved successfully'
      );
    } catch (error) {
      next(error);
    }
  }

  static async logout(req, res, next) {
    try {
      // JWT is stateless — client removes token; we just acknowledge
      return ApiResponse.success(res, null, 'Logged out successfully');
    } catch (error) {
      next(error);
    }
  }
}

module.exports = AuthController;
