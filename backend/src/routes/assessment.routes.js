const express = require('express');
const AssessmentController = require('../controllers/assessment.controller');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

router.use(authenticateToken);

// Quiz generation, submission, and history endpoints
router.post('/lesson/:lessonId/generate', AssessmentController.generateQuiz);
router.post('/lesson/:lessonId/submit', AssessmentController.submitQuiz);
router.get('/history', AssessmentController.getQuizHistory);

module.exports = router;
