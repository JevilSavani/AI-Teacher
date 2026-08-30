const app = require('./app');
const config = require('./config/env');
const logger = require('./utils/logger');
const { testConnection } = require('./config/db');

const PORT = config.port || 5000;

const startServer = async () => {
  try {
    // Check database connection
    logger.info('Verifying database connectivity...');
    const dbStatus = await testConnection();
    
    if (dbStatus.connected) {
      logger.info(`Database connected successfully: ${dbStatus.database} on ${dbStatus.host}`);
      if (dbStatus.pgvectorInstalled) {
        logger.info('pgvector extension is ACTIVE and ready.');
      } else {
        logger.warn('pgvector extension is NOT installed yet in database. Run database/schema.sql to enable.');
      }
    } else {
      logger.warn(`Database connection pending or unreachable (${dbStatus.error}). API running in standalone mode.`);
    }

    // Start HTTP server
    const server = app.listen(PORT, () => {
      logger.info(`================================================`);
      logger.info(`🚀 AI Teacher Server is running on port ${PORT}`);
      logger.info(`🌍 Environment: ${config.env}`);
      logger.info(`🩺 Health Check: http://localhost:${PORT}/api/health`);
      logger.info(`================================================`);
    });

    // Graceful shutdown handling
    const shutdown = (signal) => {
      logger.info(`Received ${signal}. Shutting down gracefully...`);
      server.close(() => {
        logger.info('HTTP server closed.');
        process.exit(0);
      });

      // Force exit after 10s if hanging
      setTimeout(() => {
        logger.error('Could not close connections in time, forcefully shutting down');
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
