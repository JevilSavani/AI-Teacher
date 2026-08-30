/**
 * Standardized API Response Helper
 */
class ApiResponse {
  static success(res, data = null, message = 'Success', statusCode = 200, meta = {}) {
    return res.status(statusCode).json({
      success: true,
      message,
      data,
      meta: {
        timestamp: new Date().toISOString(),
        ...meta
      }
    });
  }

  static error(res, message = 'Internal Server Error', statusCode = 500, details = null) {
    return res.status(statusCode).json({
      success: false,
      message,
      error: {
        statusCode,
        ...(details && { details })
      },
      meta: {
        timestamp: new Date().toISOString()
      }
    });
  }
}

module.exports = ApiResponse;
