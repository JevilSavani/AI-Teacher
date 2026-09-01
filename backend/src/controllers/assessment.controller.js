const ApiResponse = require('../utils/apiResponse');
const db = require('../config/db');
const llmProvider = require('../services/ai/llmProvider');
const answerEvaluator = require('../services/ai/answerEvaluator');
const ProgressService = require('../services/progress');

/**
 * Assessment Controller
 * Manages quiz generation, submission, AI short-answer grading, mastery updates, and quiz history per user.
 */
class AssessmentController {
  static getUserId(req) {
    return req.user?.id || req.user?.userid;
  }

  /**
   * Generate a quiz from a lesson's concepts
   */
  static async generateQuiz(req, res, next) {
    try {
      const userId = AssessmentController.getUserId(req);
      if (!userId) {
        return ApiResponse.error(res, 'Unauthorized', 401);
      }

      const { lessonId } = req.params;

      // Verify lesson belongs to the authenticated user
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
      const topic = lesson.topic || 'Lesson Quiz';
      const language = lesson.language || 'English';
      const level = lesson.level || 'Intermediate';

      const prompt = `Create a 4-question quiz based on these learning concepts:
Topic: ${topic}
Target Level: ${level}
Language: ${language}
Concepts: ${JSON.stringify(concepts.map(c => typeof c === 'object' ? c.title : c))}

CRITICAL REQUIREMENTS:
- Generate 2 Multiple Choice Questions (MCQ) and 2 Short Answer Questions.
- Strictly use "${language}" for questions, options, and explanations.
- Return ONLY valid JSON matching this exact structure:

{
  "title": "${topic} Quiz",
  "questions": [
    {
      "id": "q1",
      "type": "mcq",
      "concept": "Concept Name",
      "question": "MCQ Question Text",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correctAnswer": "Option A",
      "explanation": "Why Option A is correct"
    },
    {
      "id": "q2",
      "type": "mcq",
      "concept": "Concept Name 2",
      "question": "MCQ Question 2 Text",
      "options": ["Choice 1", "Choice 2", "Choice 3", "Choice 4"],
      "correctAnswer": "Choice 1",
      "explanation": "Explanation for Choice 1"
    },
    {
      "id": "q3",
      "type": "short_answer",
      "concept": "Concept Name 3",
      "question": "Explain how...",
      "sampleAnswer": "Expected short answer explanation",
      "explanation": "Key points required"
    },
    {
      "id": "q4",
      "type": "short_answer",
      "concept": "Concept Name 4",
      "question": "Describe why...",
      "sampleAnswer": "Expected answer text",
      "explanation": "Key reasoning required"
    }
  ]
}`;

      let quizData = null;
      try {
        const rawResponse = await llmProvider.generateCompletion(prompt, 'You are an expert AI Examiner.');
        const jsonStr = rawResponse.replace(/```json\n?|\n?```/g, '').trim();
        quizData = JSON.parse(jsonStr);
      } catch (err) {
        console.error('AI quiz generation parse error, using structured fallback:', err);
        // Fallback quiz generator
        quizData = {
          title: `${topic} Quiz`,
          questions: concepts.slice(0, 4).map((c, i) => {
            const title = typeof c === 'object' ? (c.title || `Concept ${i + 1}`) : String(c);
            if (i % 2 === 0) {
              return {
                id: `q${i + 1}`,
                type: 'mcq',
                concept: title,
                question: `Which statement best describes ${title}?`,
                options: [
                  `Standard implementation of ${title}`,
                  `Incorrect approach to ${title}`,
                  `Unrelated concept`,
                  `Deprecated usage`
                ],
                correctAnswer: `Standard implementation of ${title}`,
                explanation: `${title} refers to standard core principles in ${topic}.`
              };
            } else {
              return {
                id: `q${i + 1}`,
                type: 'short_answer',
                concept: title,
                question: `Briefly explain the main purpose of ${title} in your own words.`,
                sampleAnswer: `${title} is used to solve key problems in ${topic}.`,
                explanation: `Answers should mention the key utility and purpose of ${title}.`
              };
            }
          })
        };
      }

      return ApiResponse.success(res, { lessonId: lesson.id, topic, quiz: quizData }, 'Quiz generated successfully', 200);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Submit quiz answers, evaluate, update concept mastery, and store history
   */
  static async submitQuiz(req, res, next) {
    try {
      const userId = AssessmentController.getUserId(req);
      if (!userId) {
        return ApiResponse.error(res, 'Unauthorized', 401);
      }

      const { lessonId } = req.params;
      const { answers, quiz } = req.body;

      if (!answers || !Array.isArray(answers)) {
        return ApiResponse.error(res, 'Answers array is required', 400);
      }

      // Verify lesson belongs to user
      const lessonResult = await db.query(
        `SELECT * FROM lessons WHERE id = $1 AND user_id = $2`,
        [lessonId, userId]
      );

      if (lessonResult.rows.length === 0) {
        return ApiResponse.error(res, 'Lesson not found or access denied', 404);
      }

      const lesson = lessonResult.rows[0];
      const questions = quiz?.questions || [];
      const evaluatedQuestions = [];
      const weakConceptsSet = new Set();

      let correctCount = 0;
      let totalScoreSum = 0;

      for (const q of questions) {
        const userSub = answers.find(a => String(a.questionId) === String(q.id)) || {};
        const userAnswer = userSub.answer || '';
        const concept = q.concept || lesson.topic;

        if (q.type === 'mcq') {
          const isCorrect = String(userAnswer).trim().toLowerCase() === String(q.correctAnswer).trim().toLowerCase();
          const score = isCorrect ? 100 : 0;
          if (isCorrect) correctCount++;
          else weakConceptsSet.add(concept);

          totalScoreSum += score;

          evaluatedQuestions.push({
            id: q.id,
            type: 'mcq',
            concept,
            question: q.question,
            userAnswer,
            correctAnswer: q.correctAnswer,
            isCorrect,
            score,
            explanation: q.explanation || (isCorrect ? 'Correct choice!' : `The correct answer is: ${q.correctAnswer}`)
          });

          // Update mastery in persistent storage
          await ProgressService.updateConceptMastery(userId, lesson.id, concept, isCorrect, score);
        } else {
          // Short answer evaluation
          let evalResult = null;
          try {
            evalResult = await answerEvaluator.evaluateAnswer(
              q.question,
              concept,
              userAnswer,
              q.sampleAnswer || q.explanation,
              lesson.level || 'Intermediate',
              lesson.language || 'English'
            );
          } catch (err) {
            console.error('Error evaluating short answer:', err);
            evalResult = {
              score: userAnswer.length > 5 ? 75 : 30,
              isCorrect: userAnswer.length > 5,
              feedback: 'Answer evaluated.',
              misconceptions: []
            };
          }

          const score = Number(evalResult.score) || (evalResult.isCorrect ? 100 : 0);
          const isCorrect = evalResult.isCorrect || score >= 70;
          if (isCorrect) correctCount++;
          else weakConceptsSet.add(concept);

          totalScoreSum += score;

          evaluatedQuestions.push({
            id: q.id,
            type: 'short_answer',
            concept,
            question: q.question,
            userAnswer,
            sampleAnswer: q.sampleAnswer,
            isCorrect,
            score,
            feedback: evalResult.feedback || 'AI Feedback evaluated.',
            explanation: q.explanation || evalResult.feedback || 'Review fundamental principles.'
          });

          await ProgressService.updateConceptMastery(userId, lesson.id, concept, isCorrect, score);
        }
      }

      const totalQuestions = questions.length || 1;
      const overallScore = Math.round(totalScoreSum / totalQuestions);
      const weakConcepts = Array.from(weakConceptsSet);
      const feedbackText = overallScore >= 80
        ? `Excellent job! You scored ${overallScore}%. Great mastery of ${lesson.topic}.`
        : `Score: ${overallScore}%. Review identified weak concepts: ${weakConcepts.join(', ') || 'revisit lesson'}.`;

      // Save assessment attempt persistently under req.user.id
      const insertResult = await db.query(
        `INSERT INTO assessments (lesson_id, user_id, topic, score, total_questions, correct_answers, quiz_data, weak_concepts, feedback)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
         RETURNING *`,
        [
          lesson.id,
          userId,
          lesson.topic,
          overallScore,
          totalQuestions,
          correctCount,
          JSON.stringify({ questions: evaluatedQuestions }),
          JSON.stringify(weakConcepts),
          feedbackText
        ]
      );

      return ApiResponse.success(
        res,
        {
          attemptId: insertResult.rows[0].id,
          score: overallScore,
          totalQuestions,
          correctAnswers: correctCount,
          weakConcepts,
          feedback: feedbackText,
          evaluatedQuestions
        },
        'Quiz submitted and evaluated successfully',
        200
      );
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get quiz attempts history for the logged-in user
   */
  static async getQuizHistory(req, res, next) {
    try {
      const userId = AssessmentController.getUserId(req);
      if (!userId) {
        return ApiResponse.error(res, 'Unauthorized', 401);
      }

      const result = await db.query(
        `SELECT a.*, l.topic AS lesson_topic 
         FROM assessments a
         LEFT JOIN lessons l ON a.lesson_id = l.id
         WHERE a.user_id = $1
         ORDER BY a.created_at DESC`,
        [userId]
      );

      const history = result.rows.map(row => ({
        id: row.id,
        lessonId: row.lesson_id,
        topic: row.topic || row.lesson_topic || 'Quiz Assessment',
        score: Number(row.score) || 0,
        totalQuestions: row.total_questions,
        correctAnswers: row.correct_answers,
        weakConcepts: typeof row.weak_concepts === 'string' ? JSON.parse(row.weak_concepts || '[]') : row.weak_concepts || [],
        feedback: row.feedback,
        createdAt: row.created_at
      }));

      return ApiResponse.success(res, history, 'Quiz history retrieved successfully', 200);
    } catch (error) {
      next(error);
    }
  }
}

module.exports = AssessmentController;
