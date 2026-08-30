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
  },

  /**
   * Start a lesson (transition to in_progress)
   */
  startLesson: async (id) => {
    const response = await api.post(`/lessons/${id}/start`);
    return response.data.data;
  },

  /**
   * Get current lesson status
   */
  getLessonStatus: async (id) => {
    const response = await api.get(`/lessons/${id}/status`);
    return response.data.data;
  },

  /**
   * Get the next teaching step
   */
  getNextStep: async (id) => {
    const response = await api.get(`/lessons/${id}/next-step`);
    return response.data.data;
  },

  /**
   * Get next question for the student
   */
  getQuestion: async (id) => {
    const response = await api.get(`/lessons/${id}/question`);
    return response.data.data;
  },

  /**
   * Submit an answer and get evaluation
   */
  submitAnswer: async (id, data) => {
    const response = await api.post(`/lessons/${id}/respond`, data);
    return response.data.data;
  },

  /**
   * Get Socratic guidance for student's thinking
   */
  getSocraticGuidance: async (id, data) => {
    const response = await api.post(`/lessons/${id}/guidance`, data);
    return response.data.data;
  },

  /**
   * Switch teaching language
   */
  switchLanguage: async (id, data) => {
    const response = await api.post(`/lessons/${id}/language`, data);
    return response.data.data;
  }
};

export default lessonService;
