import api from './api';

export const lessonService = {
  /**
   * Create a new topic-based lesson
   */
  createTopicLesson: async (topic, level, language, duration_minutes = 20, material_id = null, chapterTitle = null, sectionTitle = null) => {
    const response = await api.post('/lessons/topic', {
      topic,
      level,
      language,
      duration_minutes,
      material_id,
      chapterTitle,
      sectionTitle
    });

    if (!response.ok) {
      throw new Error(
        response.message || 'Failed to generate lesson'
      );
    }

    let lesson = response.data;
    if (lesson && lesson.data) {
      lesson = lesson.data;
    }

    // Safely parse lesson_plan if it's a string
    let lessonPlanObj = {};
    if (typeof lesson?.lesson_plan === 'string') {
      try {
        lessonPlanObj = JSON.parse(lesson.lesson_plan);
      } catch (e) {
        console.error('Error parsing lesson_plan JSON:', e);
      }
    } else if (typeof lesson?.lesson_plan === 'object' && lesson?.lesson_plan !== null) {
      lessonPlanObj = lesson.lesson_plan;
    }

    const conceptsList = lessonPlanObj.concepts || [];

    const modules = conceptsList.map((concept, index) => {
      const conceptTitle = typeof concept === 'object'
        ? (concept.title || concept.conceptTitle || `Concept ${index + 1}`)
        : String(concept);

      const conceptDesc = typeof concept === 'object' ? (concept.description || '') : '';

      return {
        title: conceptTitle,
        description: conceptDesc,
        topics: [conceptTitle],
        conceptObj: concept
      };
    });

    return {
      ...lesson,
      id: lesson?.id,
      language: lesson?.language || language || 'English',
      metadata: {
        title: lessonPlanObj.title || lesson?.topic || topic || 'Course Outline',
        modules: modules.length > 0 ? modules : [
          {
            title: topic || 'General Overview',
            topics: [topic || 'Introduction']
          }
        ],
        rawConcepts: conceptsList
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

    let lesson = response.data;
    if (lesson && lesson.data) {
      lesson = lesson.data;
    }

    if (typeof lesson?.lesson_plan === 'string') {
      try {
        lesson.lesson_plan = JSON.parse(lesson.lesson_plan);
      } catch (e) {
        console.error('Error parsing lesson_plan JSON in getLessonById:', e);
      }
    }

    return lesson;
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
  },

  /**
   * Get next lesson/concept progression for authenticated user
   */
  getNextProgression: async (id) => {
    const url = id ? `/lessons/${id}/progression/next` : '/lessons/progression/next';
    const response = await api.get(url);

    if (!response.ok) {
      throw new Error(response.message || 'Failed to get progression');
    }

    return response.data;
  },

  /**
   * Get personalized learning recommendations for the logged-in user
   */
  getRecommendations: async () => {
    const response = await api.get('/recommendations');

    if (!response.ok) {
      throw new Error(
        response.message || 'Failed to get recommendations'
      );
    }

    return Array.isArray(response.data) ? response.data : (response.data?.data || []);
  }
};

export default lessonService;