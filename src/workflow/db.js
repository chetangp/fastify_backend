'use strict';

const PostgresNode = require('../platform/postgres');
const { logger } = require('./logger');

const postgresNode = new PostgresNode({
  connectionType: process.env.DB_CONNECTION_TYPE || 'postgres',
});

/**
 * Executes a raw SQL query.
 * @param {string} sql - The SQL query string.
 * @param {Array} [values=[]] - The values for parameterized query.
 * @returns {Promise<Object>} The result of the query.
 */
async function executeQuery(sql, values = []) {
  logger.debug('Executing query', { sql, values });
  // The current implementation of postgres.js seems to expect a 'query' property for raw sql.
  // Let's adapt to what frontend_dashboard_interface.js was using.
  // If your PostgresNode `executeQuery` expects { sql, values }, you can change this.
  return postgresNode.executeQuery({ query: sql, values });
}

module.exports = {
  executeQuery,
};