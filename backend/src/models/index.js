const db = require('../config/db');

/**
 * Base data access models layer
 * Ready for entity queries against PostgreSQL
 */
const Models = {
  db,
  // Helper for parameterized queries
  query: (text, params) => db.query(text, params)
};

module.exports = Models;
