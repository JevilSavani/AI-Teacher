const express = require('express');
const ProfileController = require('../controllers/profile.controller');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// All profile routes require authentication
router.get('/', authenticateToken, ProfileController.getProfile);
router.put('/', authenticateToken, ProfileController.updateProfile);

module.exports = router;
