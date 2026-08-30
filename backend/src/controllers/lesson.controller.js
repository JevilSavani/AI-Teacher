const ApiResponse = require('../utils/apiResponse');

/**
 * Lesson Controller Skeleton
 */
class LessonController {
  static async getLessons(req, res, next) {
    try {
      return ApiResponse.success(res, [], 'Lessons endpoint prepared', 200);
    } catch (error) {
      next(error);
    }
  }

  static async getLessonById(req, res, next) {
    try {
      return ApiResponse.success(res, null, 'Get lesson by ID endpoint prepared', 501);
    } catch (error) {
      next(error);
    }
  }

  static async createLesson(req, res, next) {
    try {
      return ApiResponse.success(res, null, 'Create lesson endpoint prepared', 501);
    } catch (error) {
      next(error);
    }
  }
}

module.exports = LessonController;
