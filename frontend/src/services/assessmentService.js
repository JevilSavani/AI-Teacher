import api from './api';

export const assessmentService = {
  /**
   * Generate a quiz for a lesson
   */
  generateQuiz: async (lessonId) => {
    const response = await api.post(`/assessments/lesson/${lessonId}/generate`);

    if (!response.ok) {
      throw new Error(response.message || 'Failed to generate quiz');
    }

    return response.data;
  },

  /**
   * Submit quiz answers for AI evaluation
   */
  submitQuiz: async (lessonId, answers, quiz) => {
    const response = await api.post(`/assessments/lesson/${lessonId}/submit`, {
      answers,
      quiz
    });

    if (!response.ok) {
      throw new Error(response.message || 'Failed to submit quiz');
    }

    return response.data;
  },

  /**
   * Fetch user's quiz attempt history
   */
  getQuizHistory: async () => {
    const response = await api.get('/assessments/history');

    if (!response.ok) {
      throw new Error(response.message || 'Failed to fetch quiz history');
    }

    return Array.isArray(response.data) ? response.data : (response.data?.data || []);
  }
};
