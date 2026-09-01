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

  // Get all lessons for the logged-in user
  static async getLessons(req, res, next) {
    try {
      const userId = req.user.id;

      const result = await db.query(
        `SELECT * FROM lessons
         WHERE user_id = $1
         ORDER BY created_at DESC`,
        [userId]
      );

      return ApiResponse.success(
        res,
        result.rows,
        'Lessons retrieved successfully',
        200
      );
    } catch (error) {
      next(error);
    }
  }

  // Get one lesson belonging to the logged-in user
  static async getLessonById(req, res, next) {
    try {
      const userId = req.user.id;

      const result = await db.query(
        `SELECT * FROM lessons
         WHERE id = $1 AND user_id = $2`,
        [req.params.id, userId]
      );

      if (result.rows.length === 0) {
        return ApiResponse.error(res, 'Lesson not found', 404);
      }

      return ApiResponse.success(
        res,
        result.rows[0],
        'Lesson retrieved successfully',
        200
      );
    } catch (error) {
      next(error);
    }
  }

  // Create lesson from topic
  static async createTopicLesson(req, res, next) {
    try {
      const userId = req.user.id;

      const {
        topic,
        level,
        language,
        duration_minutes
      } = req.body;

      if (!topic || !topic.trim()) {
        return ApiResponse.error(
          res,
          'Topic is required',
          400
        );
      }

      const selectedLevel = level || 'Intermediate';
      const selectedLanguage = language || 'English';
      const duration = Number(duration_minutes) || 20;

      // Generate lesson plan using OpenRouter/LLM
      const lessonPlan =
        await lessonPlanning.generateLessonPlan(
          topic.trim(),
          selectedLevel,
          selectedLanguage,
          duration
        );

      if (!lessonPlan) {
        return ApiResponse.error(
          res,
          'Failed to generate lesson plan',
          500
        );
      }

      // Initial teaching state
      const teachingState = {
        currentConceptIndex: 0,
        completedConcepts: [],
        understandingScore: 0,
        questionsAsked: [],
        responses: [],
        recentAnswers: [],
        currentQuestionId: null,
        currentQuestion: null,
        language: selectedLanguage
      };

      // Save lesson
      const insertResult = await db.query(
        `INSERT INTO lessons
        (
          user_id,
          topic,
          level,
          language,
          duration_minutes,
          lesson_plan,
          status,
          teaching_state
        )
        VALUES
        (
          $1,
          $2,
          $3,
          $4,
          $5,
          $6,
          'created',
          $7
        )
        RETURNING *`,
        [
          userId,
          topic.trim(),
          selectedLevel,
          selectedLanguage,
          duration,
          JSON.stringify(lessonPlan),
          JSON.stringify(teachingState)
        ]
      );

      return ApiResponse.success(
        res,
        insertResult.rows[0],
        'Topic lesson created successfully',
        201
      );

    } catch (error) {
      console.error(
        'Error creating topic lesson:',
        error
      );

      next(error);
    }
  }

  // Ask about a lesson section
  static async askTopicLesson(req, res, next) {
    try {
      const userId = req.user.id;
      const { sectionTitle, level, language } = req.body;
      const { id } = req.params;

      const checkResult = await db.query(
        `SELECT * FROM lessons
         WHERE id = $1 AND user_id = $2`,
        [id, userId]
      );

      if (checkResult.rows.length === 0) {
        return ApiResponse.error(
          res,
          'Lesson not found',
          404
        );
      }

      const lesson = checkResult.rows[0];

      const explanation =
        await topicLearning.explainTopicSection(
          lesson.topic,
          sectionTitle,
          level || lesson.level || 'Intermediate',
          language || lesson.language || 'English'
        );

      return ApiResponse.success(
        res,
        { explanation },
        'Explanation generated successfully',
        200
      );

    } catch (error) {
      next(error);
    }
  }

  // Start lesson
  static async startLesson(req, res, next) {
    try {
      const userId = req.user.id;
      const { id } = req.params;

      const result = await db.query(
        `SELECT * FROM lessons
         WHERE id = $1 AND user_id = $2`,
        [id, userId]
      );

      if (result.rows.length === 0) {
        return ApiResponse.error(
          res,
          'Lesson not found',
          404
        );
      }

      await db.query(
        `UPDATE lessons
         SET status = 'in_progress'
         WHERE id = $1 AND user_id = $2`,
        [id, userId]
      );

      const updatedLesson = {
        ...result.rows[0],
        status: 'in_progress'
      };

      return ApiResponse.success(
        res,
        updatedLesson,
        'Lesson started',
        200
      );

    } catch (error) {
      next(error);
    }
  }

  // Get next teaching step
  static async getNextStep(req, res, next) {
    try {
      const userId = req.user.id;
      const { id } = req.params;

      const lessonResult = await db.query(
        `SELECT * FROM lessons
         WHERE id = $1 AND user_id = $2`,
        [id, userId]
      );

      if (lessonResult.rows.length === 0) {
        return ApiResponse.error(
          res,
          'Lesson not found',
          404
        );
      }

      const lesson = lessonResult.rows[0];

      const teachingState =
        typeof lesson.teaching_state === 'string'
          ? JSON.parse(lesson.teaching_state || '{}')
          : lesson.teaching_state || {};

      const lessonPlan =
        typeof lesson.lesson_plan === 'string'
          ? JSON.parse(lesson.lesson_plan || '{}')
          : lesson.lesson_plan || {};

      const currentConceptIndex =
        teachingState.currentConceptIndex || 0;

      const concepts = lessonPlan.concepts || [];

      if (currentConceptIndex >= concepts.length) {
        return ApiResponse.success(
          res,
          {
            action: 'lesson_complete',
            message: 'Congratulations! Lesson complete.'
          },
          'Lesson complete',
          200
        );
      }

      const currentConcept =
        concepts[currentConceptIndex];

      const recentAnswers =
        teachingState.recentAnswers || [];

      const nextStep =
        await adaptiveTeaching.determineNextPedagogicalStep(
          {
            difficulty:
              lesson.level || 'Intermediate',

            understandingScore:
              teachingState.understandingScore || 0
          },
          recentAnswers,
          currentConcept
        );

      const response = {
        action: nextStep.action,
        strategy: nextStep.strategy,
        concept: currentConcept,
        reasoning: nextStep.reasoning
      };

      if (
        nextStep.action ===
        'move_to_next_concept'
      ) {
        response.guidance =
          'Move to next concept - You understand this well!';
      }

      if (
        nextStep.action &&
        nextStep.action.includes('explanation')
      ) {
        response.guidance =
          "Here's another explanation:";

        response.explanation =
          await topicLearning.explainTopicSection(
            lesson.topic,
            currentConcept.title,
            lesson.level || 'Intermediate',
            lesson.language || 'English'
          );
      }

      return ApiResponse.success(
        res,
        response,
        'Next step determined',
        200
      );

    } catch (error) {
      next(error);
    }
  }

  // Generate next question
  static async getQuestion(req, res, next) {
    try {
      const userId = req.user.id;
      const { id } = req.params;

      const lessonResult = await db.query(
        `SELECT * FROM lessons
         WHERE id = $1 AND user_id = $2`,
        [id, userId]
      );

      if (lessonResult.rows.length === 0) {
        return ApiResponse.error(
          res,
          'Lesson not found',
          404
        );
      }

      const lesson = lessonResult.rows[0];

      const teachingState =
        typeof lesson.teaching_state === 'string'
          ? JSON.parse(lesson.teaching_state || '{}')
          : lesson.teaching_state || {};

      const lessonPlan =
        typeof lesson.lesson_plan === 'string'
          ? JSON.parse(lesson.lesson_plan || '{}')
          : lesson.lesson_plan || {};

      const currentConceptIndex =
        teachingState.currentConceptIndex || 0;

      const concepts = lessonPlan.concepts || [];

      if (currentConceptIndex >= concepts.length) {
        return ApiResponse.error(
          res,
          'Lesson is complete',
          400
        );
      }

      const currentConcept = concepts[currentConceptIndex];

      let question;
      // Check if student requires a targeted remedial question due to a weak concept/misconception
      if (teachingState.remediationNeeded && teachingState.remedialMisconception) {
        const targetConcept = teachingState.weakConcept || currentConcept?.title || lesson.topic || 'Concept';
        question = await questionGenerator.generateRemediationQuestion(
          targetConcept,
          teachingState.remedialMisconception,
          'Beginner'
        );
      } else {
        question = await questionGenerator.generateQuestion(
          currentConcept,
          lesson.level || 'Intermediate',
          'mcq'
        );
      }

      const questionId = Date.now().toString();

      teachingState.currentQuestionId = questionId;
      teachingState.currentQuestion = {
        ...question,
        id: questionId
      };

      teachingState.questionsAsked =
        (teachingState.questionsAsked || [])
          .concat([questionId]);

      await db.query(
        `UPDATE lessons
         SET teaching_state = $1
         WHERE id = $2 AND user_id = $3`,
        [
          JSON.stringify(teachingState),
          id,
          userId
        ]
      );

      return ApiResponse.success(
        res,
        {
          question: {
            ...question,
            id: questionId
          }
        },
        'Question generated',
        200
      );

    } catch (error) {
      next(error);
    }
  }

  // Submit answer
  static async submitAnswer(req, res, next) {
    try {
      const userId = req.user.id;
      const { id } = req.params;
      const { answer, questionId } = req.body;

      if (!answer || !questionId) {
        return ApiResponse.error(
          res,
          'Answer and questionId are required',
          400
        );
      }

      const lessonResult = await db.query(
        `SELECT * FROM lessons
         WHERE id = $1 AND user_id = $2`,
        [id, userId]
      );

      if (lessonResult.rows.length === 0) {
        return ApiResponse.error(
          res,
          'Lesson not found',
          404
        );
      }

      const lesson = lessonResult.rows[0];

      const teachingState =
        typeof lesson.teaching_state === 'string'
          ? JSON.parse(lesson.teaching_state || '{}')
          : lesson.teaching_state || {};

      const lessonPlan =
        typeof lesson.lesson_plan === 'string'
          ? JSON.parse(lesson.lesson_plan || '{}')
          : lesson.lesson_plan || {};

      const currentConceptIndex =
        teachingState.currentConceptIndex || 0;

      const concepts = lessonPlan.concepts || [];
      const currentConcept = concepts[currentConceptIndex];

      if (!teachingState.currentQuestion) {
        return ApiResponse.error(
          res,
          'No active question',
          400
        );
      }

      const evaluation =
        await answerEvaluator.evaluateAnswer(
          teachingState.currentQuestion,
          answer,
          lesson.level || 'Intermediate'
        );

      const response = {
        questionId,
        studentAnswer: answer,
        score: evaluation.score,
        isCorrect: evaluation.is_correct,
        feedback: evaluation.feedback,
        misconceptions: evaluation.misconceptions,
        timestamp: new Date().toISOString()
      };

      teachingState.responses =
        (teachingState.responses || [])
          .concat([response]);

      teachingState.recentAnswers =
        (teachingState.recentAnswers || [])
          .slice(-4)
          .concat([evaluation]);

      const avgScore =
        teachingState.recentAnswers.reduce(
          (sum, item) => sum + (item.score || 0),
          0
        ) / teachingState.recentAnswers.length;

      teachingState.understandingScore = avgScore;

      const conceptTitle = currentConcept?.title || lesson.topic || 'Current Concept';
      let shouldMoveForward = false;

      // ADAPTIVE INTERVENTION & REMEDIATION LOGIC
      if (!evaluation.is_correct || (evaluation.score || 0) < 70) {
        // Answer is incorrect or concept is weak -> identify misconception & set remediation mode
        const misconception =
          (evaluation.misconceptions && evaluation.misconceptions.length > 0)
            ? evaluation.misconceptions[0]
            : (evaluation.feedback || 'Need to review this concept');

        teachingState.remediationNeeded = true;
        teachingState.remedialMisconception = misconception;
        teachingState.weakConcept = conceptTitle;
        teachingState.misconceptions = (teachingState.misconceptions || []).concat([misconception]);
        
        shouldMoveForward = false;
      } else {
        // Answer is correct!
        if (teachingState.remediationNeeded) {
          // Student answered the remedial question correctly!
          // Increase concept mastery
          teachingState.conceptMastery = teachingState.conceptMastery || {};
          teachingState.conceptMastery[conceptTitle] = Math.min(
            100,
            (teachingState.conceptMastery[conceptTitle] || 50) + 35
          );

          // Clear remediation flag
          teachingState.remediationNeeded = false;
          teachingState.remedialMisconception = null;
        }

        // Advance concept if requirements are met
        teachingState.completedConcepts = teachingState.completedConcepts || [];
        if (!teachingState.completedConcepts.includes(conceptTitle) && avgScore >= 70) {
          teachingState.completedConcepts.push(conceptTitle);
          teachingState.currentConceptIndex = currentConceptIndex + 1;
        }

        shouldMoveForward = true;
      }

      // Clear current question
      teachingState.currentQuestionId = null;
      teachingState.currentQuestion = null;

      await db.query(
        `UPDATE lessons
         SET teaching_state = $1
         WHERE id = $2 AND user_id = $3`,
        [
          JSON.stringify(teachingState),
          id,
          userId
        ]
      );

      const feedback =
        await answerEvaluator.generateFeedback(
          evaluation,
          lesson.level || 'Intermediate',
          currentConcept
        );

      const evaluationResult = {
        ...evaluation,
        should_move_forward: shouldMoveForward
      };

      return ApiResponse.success(
        res,
        {
          evaluation: evaluationResult,
          feedback,
          progress: {
            understandingScore: teachingState.understandingScore,
            completedConcepts: teachingState.completedConcepts || [],
            remediationActive: !!teachingState.remediationNeeded,
            canMoveToNext: shouldMoveForward
          }
        },
        'Answer evaluated',
        200
      );

    } catch (error) {
      next(error);
    }
  }

  // Socratic guidance
  static async getSocraticGuidance(req, res, next) {
    try {
      const userId = req.user.id;
      const { id } = req.params;
      const { studentThought, question, concept } = req.body;

      if (!studentThought) {
        return ApiResponse.error(
          res,
          'studentThought is required',
          400
        );
      }

      const lessonResult = await db.query(
        `SELECT * FROM lessons
         WHERE id = $1 AND user_id = $2`,
        [id, userId]
      );

      if (lessonResult.rows.length === 0) {
        return ApiResponse.error(
          res,
          'Lesson not found',
          404
        );
      }

      const lesson = lessonResult.rows[0];

      const teachingState =
        typeof lesson.teaching_state === 'string'
          ? JSON.parse(lesson.teaching_state || '{}')
          : lesson.teaching_state || {};

      const studentLevel = lesson.knowledge_level || teachingState.knowledge_level || 'Intermediate';
      const actualConcept = concept || teachingState.currentConcept || lesson.topic || 'General Topic';
      const actualQuestion = question || teachingState.currentQuestion?.question || teachingState.question || '';

      const socraticResponse =
        await teachingEngine.respondToStudentQuery(
          studentThought,
          teachingState.responses || [],
          {
            ...teachingState,
            knowledge_level: studentLevel,
            currentConcept: actualConcept,
            question: actualQuestion
          },
          {
            question: actualQuestion,
            concept: actualConcept,
            level: studentLevel
          }
        );

      return ApiResponse.success(
        res,
        { guidance: socraticResponse },
        'Guidance provided',
        200
      );

    } catch (error) {
      next(error);
    }
  }

  // Switch lesson language
  static async switchLanguage(req, res, next) {
    try {
      const userId = req.user.id;
      const { id } = req.params;
      const { language } = req.body;

      if (!language) {
        return ApiResponse.error(
          res,
          'Language is required',
          400
        );
      }

      const result = await db.query(
        `UPDATE lessons
         SET language = $1
         WHERE id = $2 AND user_id = $3
         RETURNING *`,
        [
          language,
          id,
          userId
        ]
      );

      if (result.rows.length === 0) {
        return ApiResponse.error(
          res,
          'Lesson not found',
          404
        );
      }

      const lesson = result.rows[0];

      const teachingState =
        typeof lesson.teaching_state === 'string'
          ? JSON.parse(lesson.teaching_state || '{}')
          : lesson.teaching_state || {};

      teachingState.language = language;

      await db.query(
        `UPDATE lessons
         SET teaching_state = $1
         WHERE id = $2 AND user_id = $3`,
        [
          JSON.stringify(teachingState),
          id,
          userId
        ]
      );

      return ApiResponse.success(
        res,
        {
          language,
          message: 'Language switched'
        },
        'Language switched',
        200
      );

    } catch (error) {
      next(error);
    }
  }

  // Get lesson status
  static async getLessonStatus(req, res, next) {
    try {
      const userId = req.user.id;
      const { id } = req.params;

      const result = await db.query(
        `SELECT * FROM lessons
         WHERE id = $1 AND user_id = $2`,
        [id, userId]
      );

      if (result.rows.length === 0) {
        return ApiResponse.error(
          res,
          'Lesson not found',
          404
        );
      }

      const lesson = result.rows[0];

      const teachingState =
        typeof lesson.teaching_state === 'string'
          ? JSON.parse(lesson.teaching_state || '{}')
          : lesson.teaching_state || {};

      const lessonPlan =
        typeof lesson.lesson_plan === 'string'
          ? JSON.parse(lesson.lesson_plan || '{}')
          : lesson.lesson_plan || {};

      const status = {
        lessonId: lesson.id,
        status: lesson.status,
        topic: lesson.topic,
        currentConceptIndex:
          teachingState.currentConceptIndex || 0,
        totalConcepts:
          (lessonPlan.concepts || []).length,
        understandingScore:
          teachingState.understandingScore || 0,
        completedConcepts:
          teachingState.completedConcepts || [],
        questionsAsked:
          (teachingState.questionsAsked || []).length,
        language:
          lesson.language || 'English'
      };

      return ApiResponse.success(
        res,
        status,
        'Lesson status retrieved',
        200
      );

    } catch (error) {
      next(error);
    }
  }
}

module.exports = LessonController;