import { apiRequest } from './api';

/**
 * Authentication Service
 * Handles register, login, current user, and logout.
 *
 * JWT is stored in localStorage under the key "token".
 */

export const authService = {
  /**
   * Register a new user
   */
  async register(name, email, password) {
    return apiRequest('/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        name,
        email,
        password,
      }),
    });
  },

  /**
   * Login existing user.
   *
   * Saves the JWT returned by the backend to localStorage
   * so apiRequest() can automatically attach it to protected requests.
   */
  async login(email, password) {
    const response = await apiRequest('/auth/login', {
      method: 'POST',
      body: JSON.stringify({
        email,
        password,
      }),
    });

    if (response.ok) {
      const token =
        response.token ||
        response.accessToken ||
        response.data?.token ||
        response.data?.accessToken;

      if (token) {
        localStorage.setItem('token', token);
      }
    }

    return response;
  },

  /**
   * Fetch currently authenticated user.
   */
  async getMe() {
    return apiRequest('/auth/me');
  },

  /**
   * Logout.
   *
   * Always remove the local JWT, even if the server logout request fails.
   */
  async logout() {
    try {
      return await apiRequest('/auth/logout', {
        method: 'POST',
      });
    } finally {
      localStorage.removeItem('token');
    }
  },

  /**
   * Check whether a JWT exists locally.
   */
  isAuthenticated() {
    return !!localStorage.getItem('token');
  },

  /**
   * Get the stored JWT.
   */
  getToken() {
    return localStorage.getItem('token');
  },

  /**
   * Clear the stored JWT.
   */
  clearToken() {
    localStorage.removeItem('token');
  },
};

export default authService;