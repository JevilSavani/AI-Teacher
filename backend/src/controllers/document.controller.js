const ApiResponse = require('../utils/apiResponse');
const db = require('../config/db');
const documentService = require('../services/document');
const ragService = require('../services/rag');

/**
 * Document Controller
 */
class DocumentController {
  static async uploadDocument(req, res, next) {
    try {
      if (!req.file) {
        return ApiResponse.error(res, 'No file uploaded', 400);
      }

      const { title } = req.body;
      const file = req.file;

      // 1. Insert into learning_materials as 'processing'
      const insertResult = await db.query(
        `INSERT INTO learning_materials (user_id, title, file_name, file_type, file_url, processing_status)
         VALUES ($1, $2, $3, $4, $5, 'processing')
         RETURNING *`,
        [req.user.userId, title || file.originalname, file.originalname, file.mimetype, file.path]
      );

      const material = insertResult.rows[0];

      // 2. Start async processing (don't await so we can return immediately)
      documentService.processUploadedFile(material.id, file.path, file.mimetype)
        .then(async () => {
          await db.query(
            `UPDATE learning_materials SET processing_status = 'ready' WHERE id = $1`,
            [material.id]
          );
        })
        .catch(async (err) => {
          console.error('Document processing failed:', err);
          await db.query(
            `UPDATE learning_materials SET processing_status = 'failed' WHERE id = $1`,
            [material.id]
          );
        });

      return ApiResponse.success(res, material, 'Document uploaded successfully', 201);
    } catch (error) {
      next(error);
    }
  }

  static async getDocuments(req, res, next) {
    try {
      const result = await db.query(
        `SELECT * FROM learning_materials WHERE user_id = $1 ORDER BY created_at DESC`,
        [req.user.userId]
      );
      return ApiResponse.success(res, result.rows, 'Documents retrieved successfully', 200);
    } catch (error) {
      next(error);
    }
  }

  static async getDocumentById(req, res, next) {
    try {
      const result = await db.query(
        `SELECT * FROM learning_materials WHERE id = $1 AND user_id = $2`,
        [req.params.id, req.user.userId]
      );

      if (result.rows.length === 0) {
        return ApiResponse.error(res, 'Document not found', 404);
      }

      return ApiResponse.success(res, result.rows[0], 'Document retrieved successfully', 200);
    } catch (error) {
      next(error);
    }
  }

  static async deleteDocument(req, res, next) {
    try {
      const result = await db.query(
        `DELETE FROM learning_materials WHERE id = $1 AND user_id = $2 RETURNING id`,
        [req.params.id, req.user.userId]
      );

      if (result.rows.length === 0) {
        return ApiResponse.error(res, 'Document not found', 404);
      }

      // Note: CASCADE deletes from document_chunks (assuming foreign key constraint)
      // File should also be deleted from disk here ideally.

      return ApiResponse.success(res, null, 'Document deleted successfully', 200);
    } catch (error) {
      next(error);
    }
  }

  static async askDocument(req, res, next) {
    try {
      const { question } = req.body;
      const { id: materialId } = req.params;

      if (!question) {
        return ApiResponse.error(res, 'Question is required', 400);
      }

      // Verify ownership
      const checkResult = await db.query(
        `SELECT id FROM learning_materials WHERE id = $1 AND user_id = $2 AND processing_status = 'ready'`,
        [materialId, req.user.userId]
      );

      if (checkResult.rows.length === 0) {
        return ApiResponse.error(res, 'Document not found or not ready', 404);
      }

      // Answer with RAG
      const answer = await ragService.answerWithRAG(question, materialId);
      return ApiResponse.success(res, answer, 'Answer generated successfully', 200);
    } catch (error) {
      next(error);
    }
  }
}

module.exports = DocumentController;
