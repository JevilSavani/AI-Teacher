import api from './api';

export const lessonService = {
  /**
   * Create a new topic-based lesson
   */
  createTopicLesson: async (topic, level, language) => {
    const response = await api.post('/lessons/topic', {
      topic,
      level,
      language
    });

    if (!response.ok) {
      throw new Error(
        response.message || 'Failed to generate lesson'
      );
    }

    const lesson = response.data;

    // Normalize backend lesson structure for TopicLearningPage
    return {
      ...lesson,

      // Keep lesson_plan available
      metadata: lesson.lesson_plan || {
        title: lesson.topic || 'Course Outline',
        modules: (lesson.lesson_plan?.concepts || []).map(
          (concept) => ({
            title: concept.title,
            topics: [concept.title]
          })
        )
      }
    };
  },

  /**
   * Ask a question / get explanation
   */
  askTopicLesson: async (
    id,
    sectionTitle,
    level,
    language
  ) => {
    const response = await api.post(
      `/lessons/${id}/ask`,
      {
        sectionTitle,
        level,
        language
      }
    );

    if (!response.ok) {
      throw new Error(
        response.message || 'Failed to get explanation'
      );
    }

    return response.data;
  },

  /**
   * Get all lessons
   */
  getLessons: async () => {
    const response = await api.get('/lessons');

    if (!response.ok) {
      throw new Error(
        response.message || 'Failed to load lessons'
      );
    }

    return response.data;
  },

  /**
   * Get a specific lesson
   */
  getLessonById: async (id) => {
    const response = await api.get(`/lessons/${id}`);

    if (!response.ok) {
      throw new Error(
        response.message || 'Failed to load lesson'
      );
    }

    return response.data;
  },

  /**
   * Start a lesson
   */
  startLesson: async (id) => {
    const response = await api.post(
      `/lessons/${id}/start`
    );

    if (!response.ok) {
      throw new Error(
        response.message || 'Failed to start lesson'
      );
    }

    return response.data;
  },

  /**
   * Get current lesson status
   */
  getLessonStatus: async (id) => {
    const response = await api.get(
      `/lessons/${id}/status`
    );

    if (!response.ok) {
      throw new Error(
        response.message || 'Failed to get lesson status'
      );
    }

    return response.data;
  },

  /**
   * Get the next teaching step
   */
  getNextStep: async (id) => {
    const response = await api.get(
      `/lessons/${id}/next-step`
    );

    if (!response.ok) {
      throw new Error(
        response.message || 'Failed to get next step'
      );
    }

    return response.data;
  },

  /**
   * Get next question
   */
  getQuestion: async (id) => {
    const response = await api.get(
      `/lessons/${id}/question`
    );

    if (!response.ok) {
      throw new Error(
        response.message || 'Failed to generate question'
      );
    }

    return response.data;
  },

  /**
   * Submit an answer
   */
  submitAnswer: async (id, data) => {
    const response = await api.post(
      `/lessons/${id}/respond`,
      data
    );

    if (!response.ok) {
      throw new Error(
        response.message || 'Failed to submit answer'
      );
    }

    return response.data;
  },

  /**
   * Get Socratic guidance
   */
  getSocraticGuidance: async (id, data) => {
    const response = await api.post(
      `/lessons/${id}/guidance`,
      data
    );

    if (!response.ok) {
      throw new Error(
        response.message || 'Failed to get guidance'
      );
    }

    return response.data;
  },

  /**
   * Switch teaching language
   */
  switchLanguage: async (id, data) => {
    const response = await api.post(
      `/lessons/${id}/language`,
      data
    );

    if (!response.ok) {
      throw new Error(
        response.message || 'Failed to switch language'
      );
    }

    return response.data;
  }
};

export default lessonService;