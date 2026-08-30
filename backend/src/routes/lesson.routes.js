const express = require('express');
const LessonController = require('../controllers/lesson.controller');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

router.use(authenticateToken); // Protect all lesson routes

// Lesson CRUD operations
router.get('/', LessonController.getLessons);
router.get('/:id', LessonController.getLessonById);
router.get('/:id/status', LessonController.getLessonStatus);
router.post('/topic', LessonController.createTopicLesson);
router.post('/:id/start', LessonController.startLesson);

// Teaching interactions
router.post('/:id/ask', LessonController.askTopicLesson);
router.get('/:id/next-step', LessonController.getNextStep);
router.get('/:id/question', LessonController.getQuestion);
router.post('/:id/respond', LessonController.submitAnswer);
router.post('/:id/guidance', LessonController.getSocraticGuidance);
router.post('/:id/language', LessonController.switchLanguage);

module.exports = router;
