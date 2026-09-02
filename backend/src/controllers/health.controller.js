const ApiResponse = require('../utils/apiResponse');
const { testConnection } = require('../config/db');

/**
 * Health check controller
 * Provides system status, uptime, database connectivity, and readiness checks.
 */
class HealthController {
  static async check(req, res) {
    const memoryUsage = process.memoryUsage();
    let dbStatus = { connected: false };
    try {
      dbStatus = await testConnection();
    } catch (e) {
      dbStatus = { connected: false, error: e.message };
    }

    const healthData = {
      status: dbStatus.connected ? 'UP' : 'DEGRADED',
      service: 'ai-teacher-backend',
      environment: process.env.NODE_ENV || 'development',
      uptime: `${Math.floor(process.uptime())} seconds`,
      timestamp: new Date().toISOString(),
      memory: {
        rssMb: Math.round(memoryUsage.rss / 1024 / 1024),
        heapUsedMb: Math.round(memoryUsage.heapUsed / 1024 / 1024),
        heapTotalMb: Math.round(memoryUsage.heapTotal / 1024 / 1024)
      },
      database: {
        connected: dbStatus.connected,
        host: dbStatus.host || null,
        databaseName: dbStatus.database || null,
        pgvectorAvailable: dbStatus.pgvectorInstalled || false,
        ...(dbStatus.error && { error: dbStatus.error })
      },
      readyModules: [
        'health',
        'auth',
        'student_profile',
        'document_processing',
        'rag',
        'lesson_planning',
        'ai_teaching_engine',
        'question_generation',
        'answer_evaluation',
        'adaptive_teaching',
        'assessment',
        'learning_progress',
        'learning_path',
        'multilingual_teaching',
        'text_to_speech',
        'ai_avatar_video'
      ]
    };

    return ApiResponse.success(
      res,
      healthData,
      'AI Teacher API is healthy',
      200
    );
  }

  static async checkDatabase(req, res) {
    const dbStatus = await testConnection();

    if (!dbStatus.connected) {
      return ApiResponse.error(
        res,
        'Database connection unavailable',
        503,
        {
          database: dbStatus.database,
          host: dbStatus.host,
          error: dbStatus.error,
          hint: 'Ensure PostgreSQL is running and DB credentials in .env are configured correctly.'
        }
      );
    }

    return ApiResponse.success(
      res,
      {
        database: 'PostgreSQL',
        connected: true,
        version: dbStatus.version,
        pgvectorAvailable: dbStatus.pgvectorInstalled,
        databaseName: dbStatus.database,
        host: dbStatus.host
      },
      'Database connection verified successfully'
    );
  }
}

module.exports = HealthController;
