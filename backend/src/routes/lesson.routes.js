const express = require('express');
const LessonController = require('../controllers/lesson.controller');

const router = express.Router();

router.get('/', LessonController.getLessons);
router.get('/:id', LessonController.getLessonById);
router.post('/', LessonController.createLesson);

module.exports = router;
