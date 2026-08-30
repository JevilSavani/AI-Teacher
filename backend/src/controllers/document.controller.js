const ApiResponse = require('../utils/apiResponse');

/**
 * Document Controller Skeleton
 */
class DocumentController {
  static async uploadDocument(req, res, next) {
    try {
      return ApiResponse.success(res, null, 'Document upload endpoint prepared', 501);
    } catch (error) {
      next(error);
    }
  }

  static async getDocuments(req, res, next) {
    try {
      return ApiResponse.success(res, [], 'Get documents endpoint prepared', 200);
    } catch (error) {
      next(error);
    }
  }
}

module.exports = DocumentController;
