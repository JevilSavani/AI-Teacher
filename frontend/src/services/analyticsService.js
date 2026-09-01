import api from './api';

export const analyticsService = {
  /**
   * Fetch comprehensive student analytics and progress metrics
   */
  getAnalytics: async () => {
    const response = await api.get('/analytics');

    if (!response.ok) {
      throw new Error(response.message || 'Failed to fetch analytics');
    }

    return response.data;
  }
};
