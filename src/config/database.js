'use strict';

const fp = require('fastify-plugin');
const { createClient } = require('@supabase/supabase-js');
const { Pool } = require('pg');
const { logger } = require('../utils/logger');

async function databaseConnector(fastify, options) {
  try {
    const connectionType = process.env.DB_CONNECTION_TYPE || 'supabase';
    
    if (connectionType === 'supabase') {
      // Create Supabase client
      const supabase = createClient(
        process.env.SUPABASE_URL,
        process.env.SUPABASE_KEY,
        {
          auth: {
            persistSession: false
          }
        }
      );

      // Test the connection
      const { data, error } = await supabase.from('pg_stat_statements').select('*').limit(1);
      
      if (error) {
        logger.error('Failed to connect to Supabase:', error);
        throw new Error('Supabase connection failed');
      }

      logger.info('Connected to Supabase PostgreSQL database');

      // Decorate fastify instance with supabase client
      fastify.decorate('supabase', supabase);
    } else if (connectionType === 'postgres') {
      // Create PostgreSQL pool
      const pgConfig = process.env.POSTGRES_CONNECTION_STRING ? 
        { connectionString: process.env.POSTGRES_CONNECTION_STRING } : 
        {
          host: process.env.POSTGRES_HOST,
          port: process.env.POSTGRES_PORT,
          database: process.env.POSTGRES_DB,
          user: process.env.POSTGRES_USER,
          password: process.env.POSTGRES_PASSWORD
        };
      
      const pgPool = new Pool(pgConfig);
      
      // Test the connection
      try {
        const client = await pgPool.connect();
        await client.query('SELECT 1');
        client.release();
        logger.info('Connected to PostgreSQL database');
      } catch (pgError) {
        logger.error('Failed to connect to PostgreSQL:', pgError);
        throw new Error('PostgreSQL connection failed');
      }
      
      // Decorate fastify instance with pg pool
      fastify.decorate('pg', pgPool);
    } else {
      throw new Error(`Unsupported database connection type: ${connectionType}`);
    }

    // Close connection when server is shutting down
    fastify.addHook('onClose', async (instance) => {
      logger.info('Closing database connection');
      if (connectionType === 'postgres' && instance.pg) {
        await instance.pg.end();
      }
    });
  } catch (err) {
    logger.error('Database connection error:', err);
    throw err;
  }
}

module.exports = fp(databaseConnector, {
  name: 'database-connector',
  dependencies: []
});