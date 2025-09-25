const { Pool } = require('pg');
require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });

const pool = new Pool({
  host: process.env.POSTGRES_HOST,
  port: process.env.POSTGRES_PORT,
  database: process.env.POSTGRES_DB,
  user: process.env.POSTGRES_USER,
  password: process.env.POSTGRES_PASSWORD,
  connectionTimeoutMillis: 5000, // 5 second timeout
});

async function createSchemaAndTables() {
  try {
    const client = await pool.connect();
    try {
      await client.query('CREATE SCHEMA IF NOT EXISTS fastify_log;');
      await client.query(`
        CREATE TABLE IF NOT EXISTS fastify_log.app_logs (
          id SERIAL PRIMARY KEY,
          level INT,
          time BIGINT,
          pid INT,
          hostname VARCHAR(255),
          msg TEXT,
          reqId VARCHAR(255),
          req JSONB,
          res JSONB,
          responseTime REAL,
          requestLog JSONB,
          data JSONB,
          error TEXT,
          query1_rowCount INT,
          query2_rowCount INT,
          query3_rowCount INT,
          query1 TEXT,
          query2 TEXT,
          query3 TEXT,
          supabase BOOLEAN,
          cmd VARCHAR(255)
        );
      `);
    } finally {
      client.release();
    }
  } catch (err) {
    console.error('Error connecting to database for schema creation:', err);
  }
}

async function logToDb(log) {
  try {
    const client = await pool.connect();
    try {
        const {
            level,
            time,
            pid,
            hostname,
            msg,
            reqId,
            req,
            res,
            responseTime,
            requestLog,
            data,
            error,
            query1_rowCount,
            query2_rowCount,
            query3_rowCount,
            query1,
            query2,
            query3,
            supabase,
            cmd
        } = log;
        const query = `
            INSERT INTO fastify_log.app_logs (
                level, time, pid, hostname, msg, reqId, req, res, responseTime, requestLog, data, error,
                query1_rowCount, query2_rowCount, query3_rowCount, query1, query2, query3, supabase, cmd
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20)
        `;
        const values = [
            level,
            time,
            pid,
            hostname,
            msg,
            reqId,
            req,
            res,
            responseTime,
            requestLog,
            data,
            error,
            query1_rowCount,
            query2_rowCount,
            query3_rowCount,
            query1,
            query2,
            query3,
            supabase,
            cmd
        ];
        await client.query(query, values);
    } finally {
        client.release();
    }
  } catch (err) {
    console.error('Error connecting to database for app log insertion:', err);
  }
}

createSchemaAndTables();

module.exports = { logToDb };