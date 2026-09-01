const express = require('express');
const RecommendationController = require('../controllers/recommendation.controller');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

router.use(authenticateToken); // Protect all recommendation routes

router.get('/', RecommendationController.getRecommendations);

module.exports = router;
