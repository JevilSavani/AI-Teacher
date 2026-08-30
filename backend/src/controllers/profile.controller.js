const ApiResponse = require('../utils/apiResponse');
const StudentProfileService = require('../services/student');

// Valid enum values matching the schema/frontend expectations
const VALID_EDUCATION_LEVELS = ['middle_school', 'high_school', 'undergraduate', 'graduate', 'professional', 'self_learner'];
const VALID_KNOWLEDGE_LEVELS = ['beginner', 'intermediate', 'advanced', 'expert'];
const VALID_TEACHING_STYLES = ['socratic', 'explanatory', 'visual', 'practical', 'mixed'];
const VALID_LANGUAGES = ['English', 'Hindi', 'Spanish', 'French', 'German', 'Chinese', 'Japanese', 'Arabic', 'Portuguese'];

/**
 * Student Profile Controller
 * Handles retrieval and updates of the student profile preferences.
 */
class ProfileController {
  static async getProfile(req, res, next) {
    try {
      const userId = req.user.id;
      const profile = await StudentProfileService.getProfileByUserId(userId);

      // Even if profile doesn't exist yet, return success with null,
      // letting the frontend know it needs setup.
      return ApiResponse.success(res, profile, 'Student profile retrieved successfully');
    } catch (error) {
      next(error);
    }
  }

  static async updateProfile(req, res, next) {
    try {
      const userId = req.user.id;
      const {
        education_level,
        knowledge_level,
        preferred_language,
        learning_goal,
        teaching_style,
        available_time_minutes
      } = req.body;

      // Validate enum fields if provided
      if (education_level && !VALID_EDUCATION_LEVELS.includes(education_level)) {
        return ApiResponse.error(
          res,
          `Invalid education_level. Must be one of: ${VALID_EDUCATION_LEVELS.join(', ')}`,
          400
        );
      }

      if (knowledge_level && !VALID_KNOWLEDGE_LEVELS.includes(knowledge_level)) {
        return ApiResponse.error(
          res,
          `Invalid knowledge_level. Must be one of: ${VALID_KNOWLEDGE_LEVELS.join(', ')}`,
          400
        );
      }

      if (teaching_style && !VALID_TEACHING_STYLES.includes(teaching_style)) {
        return ApiResponse.error(
          res,
          `Invalid teaching_style. Must be one of: ${VALID_TEACHING_STYLES.join(', ')}`,
          400
        );
      }

      if (preferred_language && !VALID_LANGUAGES.includes(preferred_language)) {
        return ApiResponse.error(
          res,
          `Invalid preferred_language. Must be one of: ${VALID_LANGUAGES.join(', ')}`,
          400
        );
      }

      // Validate available_time_minutes is a positive integer if provided
      if (available_time_minutes !== undefined && available_time_minutes !== '') {
        const mins = parseInt(available_time_minutes, 10);
        if (isNaN(mins) || mins < 1 || mins > 1440) {
          return ApiResponse.error(res, 'available_time_minutes must be between 1 and 1440.', 400);
        }
      }

      const profile = await StudentProfileService.updateProfile(userId, req.body);
      return ApiResponse.success(res, profile, 'Student profile updated successfully');
    } catch (error) {
      next(error);
    }
  }
}

module.exports = ProfileController;
