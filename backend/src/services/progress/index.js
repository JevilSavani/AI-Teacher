const db = require('../../config/db');

/**
 * Learning Progress & Weak Concepts Service Module
 * Tracks student mastery levels, concept strengths, weaknesses, and historical performance metrics.
 */
class ProgressService {
  async getStudentProgress(studentId) {
    if (!studentId) {
      throw new Error('studentId is required');
    }

    const userIdInt = parseInt(studentId, 10);
    if (isNaN(userIdInt)) {
      return {
        studentId,
        totalLessons: 0,
        completedConcepts: [],
        completedConceptsCount: 0,
        conceptMastery: {},
        weakConcepts: [],
        overallUnderstandingScore: 0,
        totalAttempts: 0,
        correctAttempts: 0,
        accuracyRate: 0
      };
    }

    const result = await db.query(
      `SELECT * FROM lessons WHERE user_id = $1 ORDER BY updated_at DESC`,
      [userIdInt]
    );

    const lessons = result.rows || [];
    const completedConceptsSet = new Set();
    const conceptMasteryMap = {};
    const weakConceptsList = [];

    let totalScoreSum = 0;
    let totalLessonsWithScore = 0;
    let totalAttempts = 0;
    let correctAttempts = 0;

    for (const lesson of lessons) {
      const teachingState =
        typeof lesson.teaching_state === 'string'
          ? JSON.parse(lesson.teaching_state || '{}')
          : lesson.teaching_state || {};

      // Completed concepts
      (teachingState.completedConcepts || []).forEach((c) => completedConceptsSet.add(c));

      // Scores
      if (typeof teachingState.understandingScore === 'number' && teachingState.understandingScore > 0) {
        totalScoreSum += teachingState.understandingScore;
        totalLessonsWithScore++;
      }

      // Responses
      const responses = teachingState.responses || [];
      totalAttempts += responses.length;
      correctAttempts += responses.filter((r) => r.isCorrect).length;

      // Concept mastery
      const mastery = teachingState.conceptMastery || {};
      Object.keys(mastery).forEach((conceptTitle) => {
        conceptMasteryMap[conceptTitle] = mastery[conceptTitle];
        if (mastery[conceptTitle] < 70) {
          weakConceptsList.push({
            concept: conceptTitle,
            lessonTopic: lesson.topic,
            mastery: mastery[conceptTitle],
            misconceptions: teachingState.misconceptions || []
          });
        }
      });
    }

    const overallUnderstandingScore = totalLessonsWithScore > 0
      ? Math.round(totalScoreSum / totalLessonsWithScore)
      : (totalAttempts > 0 ? Math.round((correctAttempts / totalAttempts) * 100) : 0);

    return {
      studentId: userIdInt,
      totalLessons: lessons.length,
      completedConcepts: Array.from(completedConceptsSet),
      completedConceptsCount: completedConceptsSet.size,
      conceptMastery: conceptMasteryMap,
      weakConcepts: weakConceptsList,
      overallUnderstandingScore,
      totalAttempts,
      correctAttempts,
      accuracyRate: totalAttempts > 0 ? Math.round((correctAttempts / totalAttempts) * 100) : 0
    };
  }

  async recordConceptMastery(studentId, conceptId, score) {
    const progress = await this.getStudentProgress(studentId);
    return {
      success: true,
      studentId,
      conceptId,
      score,
      updatedMastery: progress.conceptMastery
    };
  }

  async updateConceptMastery(userId, lessonId, conceptTitle, isCorrect, score) {
    if (!userId || !lessonId || !conceptTitle) return null;

    const lessonResult = await db.query(
      `SELECT * FROM lessons WHERE id = $1 AND user_id = $2`,
      [lessonId, userId]
    );

    if (lessonResult.rows.length === 0) return null;

    const lesson = lessonResult.rows[0];
    const teachingState =
      typeof lesson.teaching_state === 'string'
        ? JSON.parse(lesson.teaching_state || '{}')
        : lesson.teaching_state || {};

    const conceptMastery = teachingState.conceptMastery || {};
    const completedConcepts = new Set(teachingState.completedConcepts || []);
    const currentMastery = conceptMastery[conceptTitle] || 0;

    let newMastery = isCorrect
      ? Math.min(100, Math.max(currentMastery + 20, score || 80))
      : Math.max(0, currentMastery - 15);

    conceptMastery[conceptTitle] = newMastery;

    if (newMastery >= 70) {
      completedConcepts.add(conceptTitle);
    }

    teachingState.conceptMastery = conceptMastery;
    teachingState.completedConcepts = Array.from(completedConcepts);
    teachingState.understandingScore = Math.round(
      Object.values(conceptMastery).reduce((a, b) => a + b, 0) / (Object.keys(conceptMastery).length || 1)
    );

    await db.query(
      `UPDATE lessons SET teaching_state = $1, updated_at = NOW() WHERE id = $2 AND user_id = $3`,
      [JSON.stringify(teachingState), lessonId, userId]
    );

    return teachingState;
  }

  async getWeakConcepts(studentId) {
    const progress = await this.getStudentProgress(studentId);
    return progress.weakConcepts;
  }
}

module.exports = new ProgressService();
