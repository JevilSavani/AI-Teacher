const ApiResponse = require('../utils/apiResponse');
const db = require('../config/db');
const llmProvider = require('../services/ai/llmProvider');

/**
 * Recommendation Controller
 * Generates personalized learning recommendations based strictly on req.user.id
 */
class RecommendationController {
  static async getRecommendations(req, res, next) {
    try {
      const userId = req.user.id || req.user.userid;
      if (!userId) {
        return ApiResponse.error(res, 'Unauthorized', 401);
      }

      // Query lessons belonging ONLY to the logged-in user
      const result = await db.query(
        `SELECT * FROM lessons WHERE user_id = $1 ORDER BY updated_at DESC`,
        [userId]
      );

      const lessons = result.rows || [];
      if (lessons.length === 0) {
        return ApiResponse.success(
          res,
          [
            {
              id: 'rec-default-1',
              type: 'new_lesson',
              topic: 'Start Learning',
              concept: 'Core Fundamentals',
              recommendation: 'Generate Your First Lesson',
              reason: 'You haven\'t created any lessons yet. Choose a topic to begin personalized learning!',
              actionLabel: 'Explore Topics',
              link: '/learning'
            }
          ],
          'Default recommendations retrieved',
          200
        );
      }

      const recommendations = [];

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
        const mastery = teachingState.conceptMastery || {};
        const completed = teachingState.completedConcepts || [];

        // 1. Weak concept / Remediation recommendation
        if (teachingState.remediationNeeded && teachingState.weakConcept) {
          const reasonMsg = teachingState.remedialMisconception
            ? `Your recent answers show difficulty: "${teachingState.remedialMisconception}".`
            : `Your concept mastery in ${teachingState.weakConcept} needs practice.`;

          recommendations.push({
            id: `rec-remedial-${lesson.id}`,
            lessonId: lesson.id,
            type: 'remediation',
            topic: lesson.topic,
            concept: teachingState.weakConcept,
            recommendation: `Practice ${teachingState.weakConcept}`,
            reason: reasonMsg,
            actionLabel: 'Review & Practice',
            link: `/classroom/${lesson.id}`
          });
        }

        // 2. Concepts with low mastery score (< 70)
        Object.keys(mastery).forEach((conceptTitle) => {
          if (
            mastery[conceptTitle] < 70 &&
            (!teachingState.remediationNeeded || teachingState.weakConcept !== conceptTitle)
          ) {
            recommendations.push({
              id: `rec-weak-${lesson.id}-${conceptTitle}`,
              lessonId: lesson.id,
              type: 'weak_concept',
              topic: lesson.topic,
              concept: conceptTitle,
              recommendation: `Practice ${conceptTitle}`,
              reason: `Your concept mastery is ${mastery[conceptTitle]}%. Revisit this concept to solidify your understanding.`,
              actionLabel: 'Practice Concept',
              link: `/classroom/${lesson.id}`
            });
          }
        });

        // 3. Mastered concept -> Recommend next logical concept
        const currentIndex = teachingState.currentConceptIndex || 0;
        if (currentIndex < concepts.length) {
          const currentConceptObj = concepts[currentIndex];
          const currentConceptTitle = typeof currentConceptObj === 'object'
            ? (currentConceptObj.title || currentConceptObj.conceptTitle)
            : String(currentConceptObj);

          const currentMastery = mastery[currentConceptTitle] || 0;
          if (currentMastery >= 70 || completed.includes(currentConceptTitle)) {
            const nextIndex = currentIndex + 1;
            if (nextIndex < concepts.length) {
              const nextConceptObj = concepts[nextIndex];
              const nextConceptTitle = typeof nextConceptObj === 'object'
                ? (nextConceptObj.title || nextConceptObj.conceptTitle)
                : String(nextConceptObj);

              recommendations.push({
                id: `rec-next-${lesson.id}-${nextConceptTitle}`,
                lessonId: lesson.id,
                type: 'next_concept',
                topic: lesson.topic,
                concept: nextConceptTitle,
                recommendation: `Advance to ${nextConceptTitle}`,
                reason: `Great progress! You have mastered ${currentConceptTitle}. Ready to learn ${nextConceptTitle}.`,
                actionLabel: 'Start Next Concept',
                link: `/classroom/${lesson.id}`
              });
            }
          }
        }
      }

      // Fallback if no specific weak/next concept recommendation matched
      if (recommendations.length === 0 && lessons.length > 0) {
        const latestLesson = lessons[0];
        recommendations.push({
          id: `rec-continue-${latestLesson.id}`,
          lessonId: latestLesson.id,
          type: 'continue_lesson',
          topic: latestLesson.topic,
          concept: latestLesson.topic,
          recommendation: `Continue ${latestLesson.topic} Practice`,
          reason: 'Keep up your daily streak and reinforce your learning with practice questions.',
          actionLabel: 'Resume Practice',
          link: `/classroom/${latestLesson.id}`
        });
      }

      return ApiResponse.success(
        res,
        recommendations.slice(0, 4),
        'Personalized recommendations generated successfully',
        200
      );
    } catch (error) {
      next(error);
    }
  }
}

module.exports = RecommendationController;
