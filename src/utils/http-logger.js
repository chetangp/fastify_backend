
const { Pool } = require('pg');
require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });

const pool = new Pool({
  host: process.env.POSTGRES_HOST,
  port: process.env.POSTGRES_PORT,
  database: process.env.POSTGRES_DB,
  user: process.env.POSTGRES_USER,
  password: process.env.POSTGRES_PASSWORD,
});

async function createSchemaAndTable() {
  const client = await pool.connect();
  try {
    await client.query('CREATE SCHEMA IF NOT EXISTS fastify_log;');
    await client.query(`
      CREATE TABLE IF NOT EXISTS fastify_log.http_logs (
        id SERIAL PRIMARY KEY,
        datetime TIMESTAMPTZ,
        method VARCHAR(10),
        url VARCHAR(2048),
        request_body JSONB,
        response_body JSONB,
        time_taken_ms REAL
      );
    `);
  } finally {
    client.release();
  }
}

async function logHttp(logData) {
    const client = await pool.connect();
    try {
        const {
            datetime,
            method,
            url,
            request_body,
            response_body,
            time_taken_ms
        } = logData;
        const query = `
            INSERT INTO fastify_log.http_logs (datetime, method, url, request_body, response_body, time_taken_ms)
            VALUES ($1, $2, $3, $4, $5, $6)
        `;
        const values = [datetime, method, url, request_body, response_body, parseFloat(time_taken_ms)];
        await client.query(query, values);
    } catch (err) {
        console.error('Error inserting http log:', err);
    } finally {
        client.release();
    }
}

createSchemaAndTable();

module.exports = { logHttp };
