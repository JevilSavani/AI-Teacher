const express = require('express');
const DocumentController = require('../controllers/document.controller');

const router = express.Router();

router.get('/', DocumentController.getDocuments);
router.post('/upload', DocumentController.uploadDocument);

module.exports = router;
