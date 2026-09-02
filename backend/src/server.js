const app = require('./app');
const config = require('./config/env');
const logger = require('./utils/logger');
const { testConnection } = require('./config/db');

// Render provides PORT through environment variables.
// Locally, it will use 5000.
const PORT = process.env.PORT || config.port || 5000;

const startServer = async () => {
  try {
    // Check database connection
    logger.info('Verifying database connectivity...');

    const dbStatus = await testConnection();

    if (dbStatus.connected) {
      logger.info(
        `Database connected successfully: ${dbStatus.database} on ${dbStatus.host}`
      );

      if (dbStatus.pgvectorInstalled) {
        logger.info('pgvector extension is ACTIVE and ready.');
      } else {
        logger.warn(
          'pgvector extension is NOT installed yet in database. Run database/schema.sql to enable.'
        );
      }
    } else {
      logger.warn(
        `Database connection pending or unreachable (${dbStatus.error}). API running in standalone mode.`
      );
    }

    // Start HTTP server
    // 0.0.0.0 is required for Render/container deployment.
    const server = app.listen(PORT, '0.0.0.0', () => {
      logger.info('================================================');
      logger.info(`🚀 AI Teacher Server is running on port ${PORT}`);
      logger.info(`🌍 Environment: ${config.env}`);
      logger.info(
        `🩺 Health Check: http://localhost:${PORT}/api/health`
      );
      logger.info('================================================');
    });

    // Graceful shutdown handling
    const shutdown = (signal) => {
      logger.info(
        `Received ${signal}. Shutting down gracefully...`
      );

      server.close(() => {
        logger.info('HTTP server closed.');
        process.exit(0);
      });

      // Force exit after 10 seconds if connections are still open
      setTimeout(() => {
        logger.error(
          'Could not close connections in time, forcefully shutting down'
        );
        process.exit(1);
      }, 10000);
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));

  } catch (error) {
    logger.error('Fatal error starting server:', error);
    process.exit(1);
  }
};

startServer();