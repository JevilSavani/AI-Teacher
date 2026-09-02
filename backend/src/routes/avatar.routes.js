const express = require('express');
const { authenticateToken } = require('../middleware/auth');
const AvatarController = require('../controllers/avatar.controller');

const router = express.Router();

// All avatar routes are protected by JWT authentication
router.use(authenticateToken);

router.get('/session/:lessonId', AvatarController.getTeachingSession);
router.post('/evaluate/:lessonId', AvatarController.evaluateVideoQuestion);

module.exports = router;
