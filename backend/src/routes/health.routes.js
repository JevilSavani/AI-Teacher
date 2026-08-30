const express = require('express');
const HealthController = require('../controllers/health.controller');

const router = express.Router();

// GET /api/health - General API health check & readiness
router.get('/', HealthController.check);

// GET /api/health/db - Database connectivity and pgvector check
router.get('/db', HealthController.checkDatabase);

module.exports = router;
