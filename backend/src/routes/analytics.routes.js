const express = require('express');
const AnalyticsController = require('../controllers/analytics.controller');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

router.use(authenticateToken);

router.get('/', AnalyticsController.getAnalytics);

module.exports = router;
