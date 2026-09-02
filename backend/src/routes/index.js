const express = require('express');
const healthRoutes = require('./health.routes');
const authRoutes = require('./auth.routes');
const profileRoutes = require('./profile.routes');
const lessonRoutes = require('./lesson.routes');
const documentRoutes = require('./document.routes');
const recommendationRoutes = require('./recommendation.routes');
const assessmentRoutes = require('./assessment.routes');
const analyticsRoutes = require('./analytics.routes');
const avatarRoutes = require('./avatar.routes');

const router = express.Router();

// Mount individual route modules
router.use('/health', healthRoutes);
router.use('/auth', authRoutes);
router.use('/profile', profileRoutes);
router.use('/lessons', lessonRoutes);
router.use('/documents', documentRoutes);
router.use('/recommendations', recommendationRoutes);
router.use('/assessments', assessmentRoutes);
router.use('/analytics', analyticsRoutes);
router.use('/avatar', avatarRoutes);

module.exports = router;
