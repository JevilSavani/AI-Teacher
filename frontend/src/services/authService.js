import { apiRequest } from './api';

/**
 * Authentication Service
 * Wraps register, login, and getMe API calls.
 */

export const authService = {
  /**
   * Register a new user
   * @param {string} name
   * @param {string} email
   * @param {string} password
   */
  async register(name, email, password) {
    return apiRequest('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ name, email, password }),
    });
  },

  /**
   * Login existing user
   * @param {string} email
   * @param {string} password
   */
  async login(email, password) {
    return apiRequest('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  },

  /**
   * Fetch the currently authenticated user (+ their student profile)
   */
  async getMe() {
    return apiRequest('/auth/me');
  },

  /**
   * Logout — clears token server-side acknowledgment (token removed client-side)
   */
  async logout() {
    return apiRequest('/auth/logout', { method: 'POST' });
  },
};
