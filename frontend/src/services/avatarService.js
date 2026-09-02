import api from './api';

export const avatarService = {
  /**
   * Fetch interactive teaching session payload for a lesson concept
   */
  async getTeachingSession(lessonId, conceptIndex = 0) {
    const response = await api.get(`/avatar/session/${lessonId}?conceptIndex=${conceptIndex}`);
    return response.data?.data || response.data;
  },

  /**
   * Submit student answer during interactive video checkpoint
   */
  async evaluateVideoQuestion(lessonId, questionData) {
    const response = await api.post(`/avatar/evaluate/${lessonId}`, questionData);
    return response.data?.data || response.data;
  }
};

export default avatarService;
