const express = require('express');
const AuthController = require('../controllers/auth.controller');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

router.post('/register', AuthController.register);
router.post('/login', AuthController.login);
router.post('/logout', authenticateToken, AuthController.logout);
router.get('/me', authenticateToken, AuthController.getMe);

module.exports = router;
