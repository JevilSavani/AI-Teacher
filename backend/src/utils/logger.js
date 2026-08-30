/**
 * Centralized logging utility
 */
const logger = {
  info: (message, meta = '') => {
    console.log(`[INFO] ${new Date().toISOString()} - ${message}`, meta);
  },
  warn: (message, meta = '') => {
    console.warn(`[WARN] ${new Date().toISOString()} - ${message}`, meta);
  },
  error: (message, error = '') => {
    console.error(`[ERROR] ${new Date().toISOString()} - ${message}`, error);
  },
  debug: (message, meta = '') => {
    if (process.env.NODE_ENV === 'development') {
      console.debug(`[DEBUG] ${new Date().toISOString()} - ${message}`, meta);
    }
  }
};

module.exports = logger;
