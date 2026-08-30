const express = require('express');
const DocumentController = require('../controllers/document.controller');
const { authenticateToken } = require('../middleware/auth');
const upload = require('../middleware/upload');

const router = express.Router();

router.use(authenticateToken); // Protect all document routes

router.get('/', DocumentController.getDocuments);
router.get('/:id', DocumentController.getDocumentById);
router.post('/upload', upload.single('file'), DocumentController.uploadDocument);
router.delete('/:id', DocumentController.deleteDocument);
router.post('/:id/ask', DocumentController.askDocument);

module.exports = router;
