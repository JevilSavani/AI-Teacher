const { query } = require('../../config/db');

/**
 * Student Profile Service Module
 * Handles student demographic info, learning preferences, target grade/level, and settings.
 */
class StudentProfileService {
  async getProfileByUserId(userId) {
    if (!userId) {
      const err = new Error('User ID is required');
      err.statusCode = 400;
      throw err;
    }
    
    return this.getFullLearningProfile(userId);
  }

  async getFullLearningProfile(userId) {
    if (!userId) {
      const err = new Error('User ID is required');
      err.statusCode = 400;
      throw err;
    }

    // 1. Fetch user preferences & profile
    const prefRes = await query('SELECT * FROM student_profiles WHERE user_id = $1', [userId]);
    const prefs = prefRes.rows[0] || {};

    // 2. Fetch user's lessons & topics studied
    const lessonsRes = await query(
      `SELECT id, topic, status, level, language, duration_minutes, teaching_state, created_at, updated_at
       FROM lessons
       WHERE user_id = $1
       ORDER BY updated_at DESC`,
      [userId]
    );
    const lessons = lessonsRes.rows || [];

    const topicsStudied = Array.from(new Set(lessons.map(l => l.topic).filter(Boolean)));
    const completedLessons = lessons.filter(l => l.status === 'completed');
    const coursesCompletedCount = completedLessons.length;
    const coursesCompletedTitles = completedLessons.map(l => l.topic);

    const inProgressLesson = lessons.find(l => l.status === 'in_progress') || lessons[0] || null;

    // 3. Fetch concept mastery & weak concepts from learning_progress & weak_concepts tables
    const progressRes = await query(
      `SELECT * FROM learning_progress WHERE user_id = $1`,
      [userId]
    ).catch(() => ({ rows: [] }));
    const progressRows = progressRes.rows || [];

    const weakRes = await query(
      `SELECT * FROM weak_concepts WHERE user_id = $1`,
      [userId]
    ).catch(() => ({ rows: [] }));
    const weakRows = weakRes.rows || [];

    const conceptMasteryMap = new Map();
    const weakConceptSet = new Set();
    const strongConceptSet = new Set();
    const masteredConceptSet = new Set();

    progressRows.forEach(r => {
      const title = r.concept_title || r.topic || r.concept || 'Concept';
      const score = Number(r.understanding_score || r.mastery_score || r.score) || 0;
      conceptMasteryMap.set(title, score);
      if (score >= 85) strongConceptSet.add(title);
      if (score >= 70) masteredConceptSet.add(title);
      if (score < 60) weakConceptSet.add(title);
    });

    weakRows.forEach(w => {
      const title = w.concept_title || w.topic || w.concept || 'Weak Concept';
      weakConceptSet.add(title);
    });

    let totalQuestionsAnswered = 0;
    let totalQuestionsCorrect = 0;

    lessons.forEach(l => {
      const state = typeof l.teaching_state === 'string' ? JSON.parse(l.teaching_state || '{}') : (l.teaching_state || {});
      
      if (state.conceptMastery) {
        Object.entries(state.conceptMastery).forEach(([cTitle, score]) => {
          conceptMasteryMap.set(cTitle, score);
          if (score >= 85) strongConceptSet.add(cTitle);
          if (score >= 70) masteredConceptSet.add(cTitle);
          if (score < 60) weakConceptSet.add(cTitle);
        });
      }

      if (state.remedialMisconception || state.weakConcept) {
        weakConceptSet.add(state.weakConcept || l.topic);
      }

      if (Array.isArray(state.responses)) {
        state.responses.forEach(r => {
          totalQuestionsAnswered++;
          if (r.isCorrect || r.score >= 70) totalQuestionsCorrect++;
        });
      }
    });

    // 4. Fetch quiz / assessment submissions from assessments table
    const quizRes = await query(
      `SELECT id, score, total_questions, correct_answers, created_at
       FROM assessments
       WHERE user_id = $1
       ORDER BY created_at DESC`,
      [userId]
    ).catch(() => ({ rows: [] }));
    const quizzes = quizRes.rows || [];

    quizzes.forEach(q => {
      totalQuestionsAnswered += (q.total_questions || 0);
      totalQuestionsCorrect += (q.correct_answers || 0);
    });

    const avgQuizScore = quizzes.length > 0
      ? Math.round(quizzes.reduce((sum, q) => sum + (q.score || 0), 0) / quizzes.length)
      : 0;

    const accuracyRate = totalQuestionsAnswered > 0
      ? Math.round((totalQuestionsCorrect / totalQuestionsAnswered) * 100)
      : 0;

    // 5. Construct Learning History Timeline
    const historyEvents = [];
    lessons.forEach(l => {
      historyEvents.push({
        type: 'lesson',
        title: `Studied "${l.topic}"`,
        status: l.status,
        timestamp: l.updated_at || l.created_at
      });
    });

    quizzes.forEach(q => {
      historyEvents.push({
        type: 'quiz',
        title: `Completed Quiz (Score: ${q.score}%)`,
        status: 'completed',
        timestamp: q.created_at
      });
    });

    historyEvents.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    return {
      user_id: userId,
      preferences: {
        preferred_language: prefs.preferred_language || 'English',
        knowledge_level: prefs.knowledge_level || 'Intermediate',
        education_level: prefs.education_level || 'undergraduate',
        learning_goal: prefs.learning_goal || 'General Mastery',
        teaching_style: prefs.teaching_style || 'visual',
        available_time_minutes: prefs.available_time_minutes || 20
      },
      summary: {
        topics_studied: topicsStudied,
        total_topics_count: topicsStudied.length,
        courses_completed_count: coursesCompletedCount,
        courses_completed: coursesCompletedTitles,
        current_learning_path: inProgressLesson ? {
          id: inProgressLesson.id,
          topic: inProgressLesson.topic,
          level: inProgressLesson.level,
          language: inProgressLesson.language,
          duration_minutes: inProgressLesson.duration_minutes,
          status: inProgressLesson.status
        } : null
      },
      mastery: {
        concepts_mastered: Array.from(masteredConceptSet),
        strong_concepts: Array.from(strongConceptSet),
        weak_concepts: Array.from(weakConceptSet),
        mastery_scores: Object.fromEntries(conceptMasteryMap)
      },
      performance: {
        total_quizzes_taken: quizzes.length,
        average_quiz_score: avgQuizScore,
        total_questions_answered: totalQuestionsAnswered,
        total_questions_correct: totalQuestionsCorrect,
        accuracy_rate: accuracyRate
      },
      learning_history: historyEvents.slice(0, 15)
    };
  }

  async updateProfile(userId, profileData) {
    if (!userId) {
      const err = new Error('User ID is required');
      err.statusCode = 400;
      throw err;
    }

    const {
      education_level,
      knowledge_level,
      preferred_language = 'English',
      learning_goal,
      teaching_style,
      available_time_minutes
    } = profileData;

    const parsedMinutes = available_time_minutes !== undefined && available_time_minutes !== '' 
      ? parseInt(available_time_minutes, 10) 
      : null;

    const res = await query(
      `INSERT INTO student_profiles (
        user_id, 
        education_level, 
        knowledge_level, 
        preferred_language, 
        learning_goal, 
        teaching_style, 
        available_time_minutes,
        updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
      ON CONFLICT (user_id) 
      DO UPDATE SET
        education_level = EXCLUDED.education_level,
        knowledge_level = EXCLUDED.knowledge_level,
        preferred_language = EXCLUDED.preferred_language,
        learning_goal = EXCLUDED.learning_goal,
        teaching_style = EXCLUDED.teaching_style,
        available_time_minutes = EXCLUDED.available_time_minutes,
        updated_at = NOW()
      RETURNING *`,
      [
        userId,
        education_level || null,
        knowledge_level || null,
        preferred_language,
        learning_goal || null,
        teaching_style || null,
        parsedMinutes
      ]
    );

    return res.rows[0];
  }

  async updateLearningPreferences(userId, preferences) {
    return this.updateProfile(userId, preferences);
  }
}

module.exports = new StudentProfileService();
