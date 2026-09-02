const ApiResponse = require('../utils/apiResponse');
const db = require('../config/db');
const StudentProfileService = require('../services/student');
const topicLearning = require('../services/ai/topicLearning');
const lessonPlanning = require('../services/ai/lessonPlanning');
const questionGenerator = require('../services/ai/questionGenerator');
const answerEvaluator = require('../services/ai/answerEvaluator');
const adaptiveTeaching = require('../services/ai/adaptiveTeaching');
const teachingEngine = require('../services/ai/teachingEngine');
const visualService = require('../services/ai/visualService');

/**
 * Lesson Controller
 */
class LessonController {

  static getUserId(req) {
    return req.user?.id || req.user?.userid;
  }

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
      const userId = LessonController.getUserId(req);
      if (!userId) {
        return ApiResponse.error(res, 'Unauthorized', 401);
      }

      const {
        topic,
        level,
        language,
        duration_minutes,
        material_id,
        chapterTitle,
        sectionTitle
      } = req.body;

      if (!topic || !topic.trim()) {
        return ApiResponse.error(
          res,
          'Topic is required',
          400
        );
      }

      // Query current user's profile and progress for personalization
      let userProfile = null;
      let studentProgress = null;
      try {
        userProfile = await StudentProfileService.getProfileByUserId(userId);
        studentProgress = await ProgressService.getStudentProgress(userId);
      } catch (e) {
        console.warn('[LessonController] Optional profile/progress fetch notice:', e.message);
      }

      const userDefaultLanguage = userProfile?.preferred_language || 'English';
      const selectedLevel = level || userProfile?.knowledge_level || 'Intermediate';
      const selectedLanguage = (language && String(language).trim()) ? String(language).trim() : userDefaultLanguage;
      
      const is7Days = duration_minutes === '7_days' || String(duration_minutes).trim() === '7_days';
      const durationVal = is7Days ? '7_days' : (parseInt(duration_minutes, 10) || 20);
      const durationDbMinutes = is7Days ? 10080 : (parseInt(durationVal, 10) || 20);

      // Material context fetching if lesson is created from uploaded textbook/material
      let materialContext = null;
      if (material_id) {
        try {
          const matRes = await db.query(
            `SELECT * FROM learning_materials WHERE id = $1 AND user_id = $2 AND processing_status = 'ready'`,
            [material_id, userId]
          );
          if (matRes.rows.length > 0) {
            const material = matRes.rows[0];
            const chunks = await ragService.retrieveRelevantContext(
              sectionTitle || chapterTitle || topic,
              material.id,
              6,
              { chapterTitle, sectionTitle }
            );
            const ragText = ragService.buildContext(chunks);
            materialContext = {
              materialId: material.id,
              documentTitle: material.title,
              chapterTitle,
              sectionTitle,
              ragText
            };
          }
        } catch (mErr) {
          console.warn('[LessonController] Error retrieving material RAG context:', mErr.message);
        }
      }

      // Generate lesson plan using OpenRouter/LLM
      const lessonPlan =
        await lessonPlanning.generateLessonPlan(
          topic.trim(),
          selectedLevel,
          selectedLanguage,
          durationVal,
          studentProgress,
          materialContext
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

      // Save lesson with material_id reference if provided
      const insertResult = await db.query(
        `INSERT INTO lessons
        (
          user_id,
          material_id,
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
          $7,
          'created',
          $8
        )
        RETURNING *`,
        [
          userId,
          material_id || null,
          topic.trim(),
          selectedLevel,
          selectedLanguage,
          durationDbMinutes,
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
      let responseData = null;

      if (lesson.material_id) {
        const lessonContext = {
          lesson_id: lesson.id,
          materialId: lesson.material_id,
          topic: lesson.topic,
          concept: sectionTitle || lesson.topic,
          level: level || lesson.level || 'Intermediate',
          language: language || lesson.language || 'English'
        };

        const ragRes = await ragService.answerWithRAG(
          sectionTitle || lesson.topic,
          lesson.material_id,
          {},
          lessonContext,
          req.body.history || []
        );

        responseData = {
          explanation: ragRes.answer,
          sources: ragRes.sources || []
        };
      } else {
        const explanationResult =
          await topicLearning.explainTopicSection(
            lesson.topic,
            sectionTitle,
            level || lesson.level || 'Intermediate',
            language || lesson.language || 'English'
          );

        responseData = typeof explanationResult === 'object' && explanationResult !== null
          ? explanationResult
          : { explanation: explanationResult };
      }

      return ApiResponse.success(
        res,
        responseData,
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
      const selectedLanguage = lesson.language || teachingState.language || 'English';

      let question;
      // Check if student requires a targeted remedial question due to a weak concept/misconception
      if (teachingState.remediationNeeded && teachingState.remedialMisconception) {
        const targetConcept = teachingState.weakConcept || currentConcept?.title || lesson.topic || 'Concept';
        question = await questionGenerator.generateRemediationQuestion(
          targetConcept,
          teachingState.remedialMisconception,
          'Beginner',
          selectedLanguage
        );
      } else {
        question = await questionGenerator.generateQuestion(
          currentConcept,
          lesson.level || 'Intermediate',
          'mcq',
          selectedLanguage
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

      const selectedLanguage = lesson.language || teachingState.language || 'English';

      // Retrieve RAG context if lesson originates from uploaded document
      let ragContext = null;
      if (lesson.material_id) {
        try {
          const chunks = await ragService.retrieveRelevantContext(
            currentConcept?.title || lesson.topic,
            lesson.material_id,
            3
          );
          ragContext = ragService.buildContext(chunks);
        } catch (rErr) {
          console.warn('[submitAnswer] RAG context fetch notice:', rErr.message);
        }
      }

      const evaluation =
        await answerEvaluator.evaluateAnswer(
          teachingState.currentQuestion,
          answer,
          teachingState.currentLevel || lesson.level || 'Intermediate',
          selectedLanguage,
          ragContext
        );

      const response = {
        questionId,
        studentAnswer: answer,
        score: evaluation.score,
        isCorrect: evaluation.is_correct,
        status: evaluation.answer_status,
        feedback: evaluation.feedback,
        diagnosis: evaluation.diagnosis,
        alternative_explanation: evaluation.alternative_explanation,
        new_example: evaluation.new_example,
        misconceptions: evaluation.misconceptions,
        timestamp: new Date().toISOString()
      };

      teachingState.responses = (teachingState.responses || []).concat([response]);
      teachingState.recentAnswers = (teachingState.recentAnswers || []).slice(-4).concat([evaluation]);

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
        teachingState.consecutiveFailures = (teachingState.consecutiveFailures || 0) + 1;
        
        const misconception =
          (evaluation.misconceptions && evaluation.misconceptions.length > 0)
            ? evaluation.misconceptions[0]
            : (evaluation.diagnosis || evaluation.feedback || 'Need to review this concept');

        teachingState.remediationNeeded = true;
        teachingState.remedialMisconception = misconception;
        teachingState.weakConcept = conceptTitle;
        teachingState.misconceptions = (teachingState.misconceptions || []).concat([misconception]);
        
        // Dynamically adjust difficulty down if student struggles repeatedly
        if (teachingState.consecutiveFailures >= 2) {
          teachingState.currentLevel = adaptiveTeaching._decreaseDifficulty(
            teachingState.currentLevel || lesson.level || 'Intermediate'
          );
        }

        shouldMoveForward = false;
      } else {
        // Answer is correct! Reset failures
        teachingState.consecutiveFailures = 0;

        if (teachingState.remediationNeeded) {
          // Student answered the remedial question correctly after re-teaching!
          teachingState.conceptMastery = teachingState.conceptMastery || {};
          teachingState.conceptMastery[conceptTitle] = Math.min(
            100,
            (teachingState.conceptMastery[conceptTitle] || 50) + 35
          );

          // Clear remediation mode
          teachingState.remediationNeeded = false;
          teachingState.remedialMisconception = null;

          // Restore difficulty level
          if (teachingState.currentLevel && teachingState.currentLevel !== (lesson.level || 'Intermediate')) {
            teachingState.currentLevel = lesson.level || 'Intermediate';
          }
        }

        // Advance concept if mastery/passing requirements are met
        teachingState.completedConcepts = teachingState.completedConcepts || [];
        if (!teachingState.completedConcepts.includes(conceptTitle)) {
          teachingState.completedConcepts.push(conceptTitle);
          teachingState.currentConceptIndex = currentConceptIndex + 1;
        }

        shouldMoveForward = true;
      }

      // Clear active question ID to prepare for next step
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
          teachingState.currentLevel || lesson.level || 'Intermediate',
          currentConcept,
          selectedLanguage
        );

      let visualRemediation = null;
      if (!evaluation.is_correct || (evaluation.score || 0) < 70) {
        visualRemediation = await visualService.generateRemedialVisual(
          conceptTitle,
          teachingState.remedialMisconception || evaluation.feedback || 'Concept review',
          selectedLanguage
        );
      }

      const evaluationResult = {
        ...evaluation,
        should_move_forward: shouldMoveForward,
        visualRemediation
      };

      return ApiResponse.success(
        res,
        {
          evaluation: evaluationResult,
          feedback,
          visualRemediation,
          progress: {
            understandingScore: teachingState.understandingScore,
            completedConcepts: teachingState.completedConcepts || [],
            remediationActive: !!teachingState.remediationNeeded,
            currentDifficulty: teachingState.currentLevel || lesson.level || 'Intermediate',
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

  /**
   * Determine the next incomplete concept/lesson for the authenticated user
   */
  static async getNextProgression(req, res, next) {
    try {
      const userId = LessonController.getUserId(req);
      if (!userId) {
        return ApiResponse.error(res, 'Unauthorized', 401);
      }

      const { id } = req.params;

      // 1. Check current lesson if ID provided
      if (id) {
        const currentRes = await db.query(
          `SELECT * FROM lessons WHERE id = $1 AND user_id = $2`,
          [id, userId]
        );

        if (currentRes.rows.length > 0) {
          const lesson = currentRes.rows[0];
          const teachingState = typeof lesson.teaching_state === 'string'
            ? JSON.parse(lesson.teaching_state || '{}')
            : lesson.teaching_state || {};
          const lessonPlan = typeof lesson.lesson_plan === 'string'
            ? JSON.parse(lesson.lesson_plan || '{}')
            : lesson.lesson_plan || {};

          const concepts = lessonPlan.concepts || [];
          const currentConceptIndex = teachingState.currentConceptIndex || 0;

          // If there are remaining concepts in this lesson
          if (currentConceptIndex < concepts.length) {
            return ApiResponse.success(res, {
              isCourseComplete: false,
              isSameLesson: true,
              lessonId: lesson.id,
              topic: lesson.topic,
              conceptIndex: currentConceptIndex,
              currentConcept: concepts[currentConceptIndex],
              totalConcepts: concepts.length,
              completedConcepts: teachingState.completedConcepts || []
            }, 'Next concept retrieved', 200);
          }

          // Mark current lesson as completed if all concepts are done
          await db.query(
            `UPDATE lessons SET status = 'completed' WHERE id = $1 AND user_id = $2`,
            [id, userId]
          );
        }
      }

      // 2. Find next incomplete lesson for req.user.id
      const nextLessonRes = await db.query(
        `SELECT * FROM lessons 
         WHERE user_id = $1 AND status != 'completed'
         ORDER BY created_at ASC LIMIT 1`,
        [userId]
      );

      if (nextLessonRes.rows.length > 0) {
        const nextLesson = nextLessonRes.rows[0];
        const nextState = typeof nextLesson.teaching_state === 'string'
          ? JSON.parse(nextLesson.teaching_state || '{}')
          : nextLesson.teaching_state || {};
        const nextPlan = typeof nextLesson.lesson_plan === 'string'
          ? JSON.parse(nextLesson.lesson_plan || '{}')
          : nextLesson.lesson_plan || {};

        const nextConcepts = nextPlan.concepts || [];
        const nextIndex = nextState.currentConceptIndex || 0;

        return ApiResponse.success(res, {
          isCourseComplete: false,
          isSameLesson: false,
          lessonId: nextLesson.id,
          topic: nextLesson.topic,
          conceptIndex: nextIndex,
          currentConcept: nextConcepts[nextIndex] || null,
          totalConcepts: nextConcepts.length,
          completedConcepts: nextState.completedConcepts || []
        }, 'Next lesson retrieved', 200);
      }

      // 3. All lessons/concepts for user are completed -> Course Complete!
      const allLessonsRes = await db.query(
        `SELECT * FROM lessons WHERE user_id = $1`,
        [userId]
      );
      const allLessons = allLessonsRes.rows || [];
      let totalConceptsCount = 0;
      let totalCompletedCount = 0;
      let totalScoreSum = 0;

      allLessons.forEach(l => {
        const state = typeof l.teaching_state === 'string' ? JSON.parse(l.teaching_state || '{}') : l.teaching_state || {};
        const plan = typeof l.lesson_plan === 'string' ? JSON.parse(l.lesson_plan || '{}') : l.lesson_plan || {};
        const cList = plan.concepts || [];
        totalConceptsCount += cList.length;
        totalCompletedCount += (state.completedConcepts || []).length;
        totalScoreSum += (state.understandingScore || 0);
      });

      const finalUnderstandingScore = allLessons.length > 0
        ? Math.round(totalScoreSum / allLessons.length)
        : 100;

      return ApiResponse.success(res, {
        isCourseComplete: true,
        message: 'Course Completed! You have mastered all concepts.',
        finalUnderstandingScore,
        totalLessons: allLessons.length,
        totalConcepts: totalConceptsCount,
        completedConcepts: totalCompletedCount
      }, 'Course completed', 200);

    } catch (error) {
      next(error);
    }
  }
}

module.exports = LessonController;