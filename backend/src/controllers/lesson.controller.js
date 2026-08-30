const ApiResponse = require('../utils/apiResponse');
const db = require('../config/db');
const topicLearning = require('../services/ai/topicLearning');
const lessonPlanning = require('../services/ai/lessonPlanning');
const questionGenerator = require('../services/ai/questionGenerator');
const answerEvaluator = require('../services/ai/answerEvaluator');
const adaptiveTeaching = require('../services/ai/adaptiveTeaching');
const teachingEngine = require('../services/ai/teachingEngine');

/**
 * Lesson Controller
 */
class LessonController {
  static async getLessons(req, res, next) {
    try {
      const result = await db.query(
        `SELECT * FROM lessons WHERE user_id = $1 ORDER BY created_at DESC`,
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
        `SELECT * FROM lessons WHERE id = $1 AND user_id = $2`,
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
      const { topic, level, language, duration_minutes } = req.body;

      if (!topic) {
        return ApiResponse.error(res, 'Topic is required', 400);
      }

      // Generate the lesson plan
      const lessonPlan = await lessonPlanning.generateLessonPlan(
        topic,
        level || 'Intermediate',
        language || 'English',
        duration_minutes || 20
      );

      // Create a new lesson entry in the lessons table
      const insertResult = await db.query(
        `INSERT INTO lessons (user_id, topic, level, language, duration_minutes, lesson_plan, status, teaching_state)
         VALUES ($1, $2, $3, $4, $5, $6, 'created', $7)
         RETURNING *`,
        [
          req.user.userId,
          topic,
          level || 'Intermediate',
          language || 'English',
          duration_minutes || 20,
          JSON.stringify(lessonPlan),
          JSON.stringify({
            currentConceptIndex: 0,
            completedConcepts: [],
            understandingScore: 0,
            questionsAsked: [],
            responses: [],
            language: language || 'English'
          })
        ]
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
        `SELECT * FROM lessons WHERE id = $1 AND user_id = $2`,
        [id, req.user.userId]
      );

      if (checkResult.rows.length === 0) {
        return ApiResponse.error(res, 'Lesson not found', 404);
      }

      const lesson = checkResult.rows[0];

      // Explain section
      const explanation = await topicLearning.explainTopicSection(
        lesson.topic,
        sectionTitle,
        level || lesson.level || 'Intermediate',
        language || lesson.language || 'English'
      );

      return ApiResponse.success(res, { explanation }, 'Explanation generated successfully', 200);
    } catch (error) {
      next(error);
    }
  }

  static async startLesson(req, res, next) {
    try {
      const { id } = req.params;

      const result = await db.query(
        `SELECT * FROM lessons WHERE id = $1 AND user_id = $2`,
        [id, req.user.userId]
      );

      if (result.rows.length === 0) {
        return ApiResponse.error(res, 'Lesson not found', 404);
      }

      const lesson = result.rows[0];

      // Update status to 'in_progress'
      await db.query(`UPDATE lessons SET status = 'in_progress' WHERE id = $1`, [id]);

      return ApiResponse.success(res, { ...lesson, status: 'in_progress' }, 'Lesson started', 200);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get next teaching step (question, explanation, etc.)
   */
  static async getNextStep(req, res, next) {
    try {
      const { id } = req.params;

      // Get lesson
      const lessonResult = await db.query(
        `SELECT * FROM lessons WHERE id = $1 AND user_id = $2`,
        [id, req.user.userId]
      );

      if (lessonResult.rows.length === 0) {
        return ApiResponse.error(res, 'Lesson not found', 404);
      }

      const lesson = lessonResult.rows[0];
      const teachingState = JSON.parse(lesson.teaching_state || '{}');
      const lessonPlan = JSON.parse(lesson.lesson_plan || '{}');

      // Get current concept
      const currentConceptIndex = teachingState.currentConceptIndex || 0;
      const concepts = lessonPlan.concepts || [];

      if (currentConceptIndex >= concepts.length) {
        return ApiResponse.success(res,
          { action: 'lesson_complete', message: 'Congratulations! Lesson complete.' },
          'Lesson complete'
        );
      }

      const currentConcept = concepts[currentConceptIndex];

      // Determine next step based on student progress
      const recentAnswers = teachingState.recentAnswers || [];
      const nextStep = await adaptiveTeaching.determineNextPedagogicalStep(
        {
          difficulty: lesson.level || 'Intermediate',
          understandingScore: teachingState.understandingScore || 0
        },
        recentAnswers,
        currentConcept
      );

      // Generate appropriate response based on next step
      let response = {
        action: nextStep.action,
        strategy: nextStep.strategy,
        concept: currentConcept,
        reasoning: nextStep.reasoning
      };

      if (nextStep.action === 'move_to_next_concept') {
        response.guidance = 'Move to next concept - You understand this well!';
      } else if (nextStep.action.includes('explanation')) {
        response.guidance = 'Here\'s another explanation:';
        response.explanation = await topicLearning.explainTopicSection(
          lesson.topic,
          currentConcept.title,
          lesson.level || 'Intermediate',
          lesson.language || 'English'
        );
      }

      return ApiResponse.success(res, response, 'Next step determined', 200);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get next question for the student
   */
  static async getQuestion(req, res, next) {
    try {
      const { id } = req.params;

      // Get lesson
      const lessonResult = await db.query(
        `SELECT * FROM lessons WHERE id = $1 AND user_id = $2`,
        [id, req.user.userId]
      );

      if (lessonResult.rows.length === 0) {
        return ApiResponse.error(res, 'Lesson not found', 404);
      }

      const lesson = lessonResult.rows[0];
      const teachingState = JSON.parse(lesson.teaching_state || '{}');
      const lessonPlan = JSON.parse(lesson.lesson_plan || '{}');

      // Get current concept
      const currentConceptIndex = teachingState.currentConceptIndex || 0;
      const concepts = lessonPlan.concepts || [];

      if (currentConceptIndex >= concepts.length) {
        return ApiResponse.error(res, 'Lesson is complete', 400);
      }

      const currentConcept = concepts[currentConceptIndex];

      // Generate question
      const question = await questionGenerator.generateQuestion(
        currentConcept,
        lesson.level || 'Intermediate',
        'mcq'
      );

      // Store question in teaching state
      const questionId = Date.now().toString();
      teachingState.currentQuestionId = questionId;
      teachingState.currentQuestion = { ...question, id: questionId };
      teachingState.questionsAsked = (teachingState.questionsAsked || []).concat([questionId]);

      await db.query(
        `UPDATE lessons SET teaching_state = $1 WHERE id = $2`,
        [JSON.stringify(teachingState), id]
      );

      return ApiResponse.success(res, { question: { ...question, id: questionId } }, 'Question generated', 200);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Submit answer and get evaluation
   */
  static async submitAnswer(req, res, next) {
    try {
      const { id } = req.params;
      const { answer, questionId } = req.body;

      if (!answer || !questionId) {
        return ApiResponse.error(res, 'Answer and questionId are required', 400);
      }

      // Get lesson
      const lessonResult = await db.query(
        `SELECT * FROM lessons WHERE id = $1 AND user_id = $2`,
        [id, req.user.userId]
      );

      if (lessonResult.rows.length === 0) {
        return ApiResponse.error(res, 'Lesson not found', 404);
      }

      const lesson = lessonResult.rows[0];
      const teachingState = JSON.parse(lesson.teaching_state || '{}');
      const lessonPlan = JSON.parse(lesson.lesson_plan || '{}');

      // Get current concept
      const currentConceptIndex = teachingState.currentConceptIndex || 0;
      const concepts = lessonPlan.concepts || [];
      const currentConcept = concepts[currentConceptIndex];

      if (!teachingState.currentQuestion) {
        return ApiResponse.error(res, 'No active question', 400);
      }

      // Evaluate answer
      const evaluation = await answerEvaluator.evaluateAnswer(
        teachingState.currentQuestion,
        answer,
        lesson.level || 'Intermediate'
      );

      // Store response
      const response = {
        questionId,
        studentAnswer: answer,
        score: evaluation.score,
        isCorrect: evaluation.is_correct,
        feedback: evaluation.feedback,
        misconceptions: evaluation.misconceptions,
        timestamp: new Date().toISOString()
      };

      teachingState.responses = (teachingState.responses || []).concat([response]);
      teachingState.recentAnswers = (teachingState.recentAnswers || [])
        .slice(-4) // Keep last 5
        .concat([evaluation]);

      // Update understanding score
      const avgScore = teachingState.recentAnswers.reduce((sum, a) => sum + (a.score || 0), 0)
        / teachingState.recentAnswers.length;
      teachingState.understandingScore = avgScore;

      // If correct, prepare to move to next concept
      if (evaluation.is_correct && avgScore >= 75) {
        teachingState.completedConcepts = (teachingState.completedConcepts || [])
          .concat([currentConcept.title]);
        teachingState.currentConceptIndex = currentConceptIndex + 1;
      }

      await db.query(
        `UPDATE lessons SET teaching_state = $1 WHERE id = $2`,
        [JSON.stringify(teachingState), id]
      );

      // Generate feedback
      const feedback = await answerEvaluator.generateFeedback(
        evaluation,
        lesson.level || 'Intermediate',
        currentConcept
      );

      return ApiResponse.success(res, {
        evaluation,
        feedback,
        progress: {
          understandingScore: avgScore,
          completedConcepts: teachingState.completedConcepts,
          canMoveToNext: evaluation.is_correct && avgScore >= 75
        }
      }, 'Answer evaluated', 200);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get Socratic guidance on student's thinking
   */
  static async getSocraticGuidance(req, res, next) {
    try {
      const { id } = req.params;
      const { studentThought } = req.body;

      if (!studentThought) {
        return ApiResponse.error(res, 'studentThought is required', 400);
      }

      // Get lesson
      const lessonResult = await db.query(
        `SELECT * FROM lessons WHERE id = $1 AND user_id = $2`,
        [id, req.user.userId]
      );

      if (lessonResult.rows.length === 0) {
        return ApiResponse.error(res, 'Lesson not found', 404);
      }

      const lesson = lessonResult.rows[0];
      const teachingState = JSON.parse(lesson.teaching_state || '{}');

      // Get Socratic response
      const socraticResponse = await teachingEngine.respondToStudentQuery(
        studentThought,
        teachingState.responses || [],
        teachingState
      );

      return ApiResponse.success(res, { guidance: socraticResponse }, 'Guidance provided', 200);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Switch teaching language
   */
  static async switchLanguage(req, res, next) {
    try {
      const { id } = req.params;
      const { language } = req.body;

      if (!language) {
        return ApiResponse.error(res, 'Language is required', 400);
      }

      // Update lesson
      const result = await db.query(
        `UPDATE lessons SET language = $1 WHERE id = $2 AND user_id = $3 RETURNING *`,
        [language, id, req.user.userId]
      );

      if (result.rows.length === 0) {
        return ApiResponse.error(res, 'Lesson not found', 404);
      }

      // Update teaching state
      const lesson = result.rows[0];
      const teachingState = JSON.parse(lesson.teaching_state || '{}');
      teachingState.language = language;

      await db.query(
        `UPDATE lessons SET teaching_state = $1 WHERE id = $2`,
        [JSON.stringify(teachingState), id]
      );

      return ApiResponse.success(res, { language, message: 'Language switched' }, 'Language switched', 200);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get current lesson status
   */
  static async getLessonStatus(req, res, next) {
    try {
      const { id } = req.params;

      const result = await db.query(
        `SELECT * FROM lessons WHERE id = $1 AND user_id = $2`,
        [id, req.user.userId]
      );

      if (result.rows.length === 0) {
        return ApiResponse.error(res, 'Lesson not found', 404);
      }

      const lesson = result.rows[0];
      const teachingState = JSON.parse(lesson.teaching_state || '{}');
      const lessonPlan = JSON.parse(lesson.lesson_plan || '{}');

      const status = {
        lessonId: lesson.id,
        status: lesson.status,
        topic: lesson.topic,
        currentConceptIndex: teachingState.currentConceptIndex || 0,
        totalConcepts: (lessonPlan.concepts || []).length,
        understandingScore: teachingState.understandingScore || 0,
        completedConcepts: teachingState.completedConcepts || [],
        questionsAsked: (teachingState.questionsAsked || []).length,
        language: lesson.language || 'English'
      };

      return ApiResponse.success(res, status, 'Lesson status retrieved', 200);
    } catch (error) {
      next(error);
    }
  }
}

module.exports = LessonController;
