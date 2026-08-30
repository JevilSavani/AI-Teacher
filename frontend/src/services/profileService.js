import { apiRequest } from './api';

/**
 * Student Profile Service
 * Wraps getProfile and updateProfile API calls.
 */

export const profileService = {
  /**
   * Fetch the current user's student profile
   */
  async getProfile() {
    return apiRequest('/profile');
  },

  /**
   * Create or update the current user's student profile
   * @param {Object} profileData
   * @param {string} [profileData.education_level]
   * @param {string} [profileData.knowledge_level]
   * @param {string} [profileData.preferred_language]
   * @param {string} [profileData.learning_goal]
   * @param {string} [profileData.teaching_style]
   * @param {number} [profileData.available_time_minutes]
   */
  async updateProfile(profileData) {
    return apiRequest('/profile', {
      method: 'PUT',
      body: JSON.stringify(profileData),
    });
  },
};
