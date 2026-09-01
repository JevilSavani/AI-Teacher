const ApiResponse = require('../utils/apiResponse');
const db = require('../config/db');
const RecommendationController = require('./recommendation.controller');

/**
 * Analytics Controller
 * Calculates comprehensive progress reports and analytics scoped strictly to req.user.id
 */
class AnalyticsController {
  static getUserId(req) {
    return req.user?.id || req.user?.userid;
  }

  static async getAnalytics(req, res, next) {
    try {
      const userId = AnalyticsController.getUserId(req);
      if (!userId) {
        return ApiResponse.error(res, 'Unauthorized', 401);
      }

      // 1. Fetch user's lessons
      const lessonsRes = await db.query(
        `SELECT * FROM lessons WHERE user_id = $1 ORDER BY updated_at DESC`,
        [userId]
      );
      const lessons = lessonsRes.rows || [];

      // 2. Fetch user's quiz attempts from assessments table
      const quizRes = await db.query(
        `SELECT * FROM assessments WHERE user_id = $1 ORDER BY created_at ASC`,
        [userId]
      );
      const quizAttempts = quizRes.rows || [];

      // Aggregate Lesson metrics
      let totalConceptsCount = 0;
      const completedConceptsSet = new Set();
      const conceptMasteryMap = {};
      const conceptDetailsList = [];
      const weakConceptsMap = new Map();

      let classroomAttempts = 0;
      let classroomCorrect = 0;
      let completedLessonsCount = 0;

      for (const lesson of lessons) {
        const teachingState =
          typeof lesson.teaching_state === 'string'
            ? JSON.parse(lesson.teaching_state || '{}')
            : lesson.teaching_state || {};

        const lessonPlan =
          typeof lesson.lesson_plan === 'string'
            ? JSON.parse(lesson.lesson_plan || '{}')
            : lesson.lesson_plan || {};

        const concepts = lessonPlan.concepts || [];
        totalConceptsCount += concepts.length;

        // Completed concepts
        const completedList = teachingState.completedConcepts || [];
        completedList.forEach(c => completedConceptsSet.add(String(c)));

        if (completedList.length >= concepts.length && concepts.length > 0) {
          completedLessonsCount++;
        }

        // Classroom Q&A practice metrics
        const responses = teachingState.responses || [];
        classroomAttempts += responses.length;
        classroomCorrect += responses.filter(r => r.isCorrect).length;

        // Per-concept mastery map
        const mastery = teachingState.conceptMastery || {};
        concepts.forEach(cObj => {
          const cTitle = typeof cObj === 'object' ? (cObj.title || cObj.conceptTitle) : String(cObj);
          const score = mastery[cTitle] !== undefined ? mastery[cTitle] : (completedConceptsSet.has(cTitle) ? 100 : 0);
          conceptMasteryMap[cTitle] = score;

          conceptDetailsList.push({
            concept: cTitle,
            topic: lesson.topic,
            mastery: score,
            status: score >= 70 ? 'Mastered' : (score > 0 ? 'In Progress' : 'Not Started')
          });

          if (score < 70) {
            weakConceptsMap.set(cTitle, {
              concept: cTitle,
              topic: lesson.topic,
              mastery: score,
              reason: teachingState.remedialMisconception || `Current mastery is ${score}%. Practice recommended.`
            });
          }
        });
      }

      // Aggregate Quiz metrics
      let quizAttemptsCount = quizAttempts.length;
      let quizQuestionsAttempted = 0;
      let quizQuestionsCorrect = 0;

      const quizScoresOverTime = quizAttempts.map(q => {
        quizQuestionsAttempted += (q.total_questions || 0);
        quizQuestionsCorrect += (q.correct_answers || 0);

        const weakList = typeof q.weak_concepts === 'string' ? JSON.parse(q.weak_concepts || '[]') : q.weak_concepts || [];
        weakList.forEach(wc => {
          if (!weakConceptsMap.has(wc)) {
            weakConceptsMap.set(wc, {
              concept: wc,
              topic: q.topic || 'Assessment',
              mastery: 50,
              reason: 'Identified as weak during quiz evaluation.'
            });
          }
        });

        return {
          id: q.id,
          date: new Date(q.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          topic: q.topic || 'Quiz',
          score: Number(q.score) || 0,
          correctAnswers: q.correct_answers,
          totalQuestions: q.total_questions
        };
      });

      // Overall Progress Percentage
      const overallProgressPercentage = totalConceptsCount > 0
        ? Math.min(100, Math.round((completedConceptsSet.size / totalConceptsCount) * 100))
        : 0;

      // Questions statistics
      const totalQuestionsAttempted = classroomAttempts + quizQuestionsAttempted;
      const totalQuestionsCorrect = classroomCorrect + quizQuestionsCorrect;
      const totalQuestionsIncorrect = Math.max(0, totalQuestionsAttempted - totalQuestionsCorrect);

      // Learning streak calculation (distinct days of activity)
      const activityDates = new Set();
      lessons.forEach(l => activityDates.add(new Date(l.updated_at).toDateString()));
      quizAttempts.forEach(q => activityDates.add(new Date(q.created_at).toDateString()));
      const learningStreakDays = activityDates.size;

      // Fetch recommended next steps
      let recommendations = [];
      const mockReq = { user: { id: userId } };
      const mockRes = {
        success: (r, data) => { recommendations = data; }
      };
      await RecommendationController.getRecommendations(mockReq, mockRes, () => {});

      const analyticsReport = {
        overallProgressPercentage,
        completedConceptsCount: completedConceptsSet.size,
        totalConceptsCount,
        lessonsCompleted: completedLessonsCount,
        totalLessons: lessons.length,
        learningStreakDays,
        questionsAttempted: totalQuestionsAttempted,
        questionsCorrect: totalQuestionsCorrect,
        questionsIncorrect: totalQuestionsIncorrect,
        accuracyRate: totalQuestionsAttempted > 0 ? Math.round((totalQuestionsCorrect / totalQuestionsAttempted) * 100) : 0,
        quizScoresOverTime,
        conceptMastery: conceptDetailsList,
        weakConcepts: Array.from(weakConceptsMap.values()),
        recommendations
      };

      return ApiResponse.success(res, analyticsReport, 'Analytics report generated successfully', 200);
    } catch (error) {
      next(error);
    }
  }
}

module.exports = AnalyticsController;
