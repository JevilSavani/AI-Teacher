const express = require('express');
const healthRoutes = require('./health.routes');
const authRoutes = require('./auth.routes');
const profileRoutes = require('./profile.routes');
const lessonRoutes = require('./lesson.routes');
const documentRoutes = require('./document.routes');

const router = express.Router();

// Mount individual route modules
router.use('/health', healthRoutes);
router.use('/auth', authRoutes);
router.use('/profile', profileRoutes);
router.use('/lessons', lessonRoutes);
router.use('/documents', documentRoutes);

module.exports = router;
