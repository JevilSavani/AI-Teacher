const ApiResponse = require('../utils/apiResponse');
const db = require('../config/db');
const topicLearning = require('../services/ai/topicLearning');

/**
 * Lesson Controller
 */
class LessonController {
  static async getLessons(req, res, next) {
    try {
      const result = await db.query(
        `SELECT * FROM lessons WHERE student_id = $1 ORDER BY created_at DESC`,
        [req.user.userId]
      );
      return ApiResponse.success(res, result.rows, 'Lessons retrieved successfully', 200);
    } catch (error) {
      next(error);
    }
  }

  static async getLessonById(req, res, next) {
    try {
      const result = await db.query(
        `SELECT * FROM lessons WHERE id = $1 AND student_id = $2`,
        [req.params.id, req.user.userId]
      );

      if (result.rows.length === 0) {
        return ApiResponse.error(res, 'Lesson not found', 404);
      }

      return ApiResponse.success(res, result.rows[0], 'Lesson retrieved successfully', 200);
    } catch (error) {
      next(error);
    }
  }

  static async createTopicLesson(req, res, next) {
    try {
      const { topic, level, language } = req.body;

      if (!topic) {
        return ApiResponse.error(res, 'Topic is required', 400);
      }

      // Generate the outline
      const outline = await topicLearning.generateTopicOutline(topic, level || 'Intermediate', language || 'English');

      // Create a new lesson entry (assuming 'lessons' table has a 'state' column for JSON)
      // Since schema doesn't exist, we will use a generic learning_materials entry or a generic lesson schema
      // I will insert it into learning_materials as a topic lesson since we don't know the full DB schema for lessons
      
      const insertResult = await db.query(
        `INSERT INTO learning_materials (student_id, title, material_type, processing_status, metadata)
         VALUES ($1, $2, 'topic', 'ready', $3)
         RETURNING *`,
        [req.user.userId, topic, outline]
      );

      return ApiResponse.success(res, insertResult.rows[0], 'Topic lesson created successfully', 201);
    } catch (error) {
      next(error);
    }
  }

  static async askTopicLesson(req, res, next) {
    try {
      const { sectionTitle, level, language } = req.body;
      const { id } = req.params;

      // Verify ownership
      const checkResult = await db.query(
        `SELECT * FROM learning_materials WHERE id = $1 AND student_id = $2`,
        [id, req.user.userId]
      );

      if (checkResult.rows.length === 0) {
        return ApiResponse.error(res, 'Topic lesson not found', 404);
      }

      const material = checkResult.rows[0];

      // Explain section
      const explanation = await topicLearning.explainTopicSection(material.title, sectionTitle, level || 'Intermediate', language || 'English');

      return ApiResponse.success(res, { explanation }, 'Explanation generated successfully', 200);
    } catch (error) {
      next(error);
    }
  }
}

module.exports = LessonController;
