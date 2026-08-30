import api from './api';

export const lessonService = {
  /**
   * Create a new topic-based lesson
   */
  createTopicLesson: async (topic, level, language) => {
    const response = await api.post('/lessons/topic', { topic, level, language });
    return response.data.data;
  },

  /**
   * Ask a question / get an explanation for a specific section
   */
  askTopicLesson: async (id, sectionTitle, level, language) => {
    const response = await api.post(`/lessons/${id}/ask`, { sectionTitle, level, language });
    return response.data.data;
  },

  /**
   * Get all lessons
   */
  getLessons: async () => {
    const response = await api.get('/lessons');
    return response.data.data;
  },

  /**
   * Get a specific lesson
   */
  getLessonById: async (id) => {
    const response = await api.get(`/lessons/${id}`);
    return response.data.data;
  }
};
