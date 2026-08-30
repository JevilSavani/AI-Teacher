const express = require('express');
const LessonController = require('../controllers/lesson.controller');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

router.use(authenticateToken); // Protect all lesson routes

router.get('/', LessonController.getLessons);
router.get('/:id', LessonController.getLessonById);
router.post('/topic', LessonController.createTopicLesson);
router.post('/:id/ask', LessonController.askTopicLesson);

module.exports = router;
