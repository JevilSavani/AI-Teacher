const { Pool } = require('pg');
const config = require('./env');
const logger = require('../utils/logger');

let pool = null;

const getPool = () => {
  if (!pool) {
    const poolConfig = config.db.url
      ? {
          connectionString: config.db.url,
          ssl: config.db.ssl ? { rejectUnauthorized: false } : false,
          max: config.db.poolMax
        }
      : {
          host: config.db.host,
          port: config.db.port,
          user: config.db.user,
          password: config.db.password,
          database: config.db.database,
          ssl: config.db.ssl ? { rejectUnauthorized: false } : false,
          max: config.db.poolMax
        };

    pool = new Pool(poolConfig);

    pool.on('error', (err) => {
      logger.error('Unexpected error on idle PostgreSQL client pool', err);
    });
  }
  return pool;
};

/**
 * Execute a query against the PostgreSQL database
 */
const query = async (text, params) => {
  const start = Date.now();
  const dbPool = getPool();
  try {
    const res = await dbPool.query(text, params);
    const duration = Date.now() - start;
    logger.debug('Executed DB query', { text, duration, rows: res.rowCount });
    return res;
  } catch (error) {
    logger.error('Database query execution error', { text, error: error.message });
    throw error;
  }
};

/**
 * Test the database connection and verify pgvector extension availability
 */
const testConnection = async () => {
  let databaseName = config.db.database;
  let hostName = config.db.host;

  if (config.db.url) {
    try {
      const parsedUrl = new URL(config.db.url);
      hostName = parsedUrl.hostname;
      // Strip leading slash from path to get database name
      databaseName = parsedUrl.pathname.substring(1);
    } catch (err) {
      // Keep fallbacks on parsing error
    }
  }

  try {
    const dbPool = getPool();
    const client = await dbPool.connect();
    
    // Check PostgreSQL version
    const versionRes = await client.query('SELECT version()');
    
    // Check if pgvector extension is installed/available
    let vectorAvailable = false;
    try {
      const extRes = await client.query("SELECT extname, extversion FROM pg_extension WHERE extname = 'vector'");
      vectorAvailable = extRes.rows.length > 0;
    } catch {
      vectorAvailable = false;
    }

    client.release();

    return {
      connected: true,
      version: versionRes.rows[0].version,
      pgvectorInstalled: vectorAvailable,
      database: databaseName,
      host: hostName
    };
  } catch (error) {
    return {
      connected: false,
      error: error.message,
      database: databaseName,
      host: hostName
    };
  }
};

module.exports = {
  getPool,
  query,
  testConnection
};
