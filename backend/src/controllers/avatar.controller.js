const ApiResponse = require('../utils/apiResponse');
const db = require('../config/db');
const avatarService = require('../services/avatar');
const answerEvaluator = require('../services/ai/answerEvaluator');
const ProgressService = require('../services/progress');

/**
 * Avatar Controller
 * Manages AI Teaching Video sessions, concept scripts, avatar config, and interactive video Q&A.
 */
class AvatarController {
  static getUserId(req) {
    return req.user?.id || req.user?.userid;
  }

  /**
   * Get full teaching session payload for a lesson concept
   */
  static async getTeachingSession(req, res, next) {
    try {
      const userId = AvatarController.getUserId(req);
      if (!userId) {
        return ApiResponse.error(res, 'Unauthorized', 401);
      }

      const { lessonId } = req.params;
      const conceptIndex = parseInt(req.query.conceptIndex || '0', 10);

      // Verify ownership
      const lessonResult = await db.query(
        `SELECT * FROM lessons WHERE id = $1 AND user_id = $2`,
        [lessonId, userId]
      );

      if (lessonResult.rows.length === 0) {
        return ApiResponse.error(res, 'Lesson not found or access denied', 404);
      }

      const lesson = lessonResult.rows[0];
      const lessonPlan = typeof lesson.lesson_plan === 'string'
        ? JSON.parse(lesson.lesson_plan || '{}')
        : lesson.lesson_plan || {};

      const concepts = lessonPlan.concepts || [];
      const safeIndex = Math.max(0, Math.min(conceptIndex, Math.max(0, concepts.length - 1)));
      const activeConcept = concepts[safeIndex] || null;

      // Generate AI teacher script for concept
      const scriptData = await avatarService.generateTeachingScript(lesson, safeIndex, userId);
      const avatarConfig = avatarService.getAvatarConfig();

      // Extract visual explanation data
      const visualData = (activeConcept && activeConcept.visual) || {
        type: 'flowchart',
        title: scriptData.conceptTitle,
        diagram: `graph TD\n  A[Start ${scriptData.conceptTitle}] --> B[Understand Principle]\n  B --> C[Master ${lesson.topic}]`
      };

      const session = {
        lessonId: lesson.id,
        topic: lesson.topic,
        level: lesson.level || 'Intermediate',
        language: lesson.language || 'English',
        conceptIndex: safeIndex,
        totalConcepts: concepts.length || 1,
        activeConcept,
        avatarConfig,
        script: scriptData,
        visual: visualData
      };

      return ApiResponse.success(res, session, 'Teaching video session retrieved successfully', 200);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Evaluate interactive question during video teaching session
   */
  static async evaluateVideoQuestion(req, res, next) {
    try {
      const userId = AvatarController.getUserId(req);
      if (!userId) {
        return ApiResponse.error(res, 'Unauthorized', 401);
      }

      const { lessonId } = req.params;
      const { conceptTitle, userAnswer, correctAnswer, questionText } = req.body;

      // Verify lesson ownership
      const lessonResult = await db.query(
        `SELECT * FROM lessons WHERE id = $1 AND user_id = $2`,
        [lessonId, userId]
      );

      if (lessonResult.rows.length === 0) {
        return ApiResponse.error(res, 'Lesson not found or access denied', 404);
      }

      const lesson = lessonResult.rows[0];
      const isCorrect = String(userAnswer).trim().toLowerCase() === String(correctAnswer).trim().toLowerCase();
      const score = isCorrect ? 100 : 30;

      // Update concept mastery persistently
      await ProgressService.updateConceptMastery(userId, lesson.id, conceptTitle || lesson.topic, isCorrect, score);

      let reTeachingText = null;
      if (!isCorrect) {
        try {
          reTeachingText = await answerEvaluator.generateRemedialExplanation(
            questionText || conceptTitle,
            conceptTitle || lesson.topic,
            userAnswer,
            lesson.level || 'Intermediate',
            lesson.language || 'English'
          );
        } catch (e) {
          reTeachingText = `Let's review ${conceptTitle}: Remember that ${correctAnswer} is the correct approach because it follows foundational principles.`;
        }
      }

      return ApiResponse.success(
        res,
        {
          isCorrect,
          score,
          correctAnswer,
          reTeachingText: isCorrect ? null : reTeachingText,
          message: isCorrect ? 'Great job! You mastered this checkpoint.' : 'Not quite. Let us review this concept together.'
        },
        'Video question evaluated successfully',
        200
      );
    } catch (error) {
      next(error);
    }
  }
}

module.exports = AvatarController;
