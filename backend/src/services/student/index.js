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
    
    const res = await query('SELECT * FROM student_profiles WHERE user_id = $1', [userId]);
    return res.rows[0] || null;
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
