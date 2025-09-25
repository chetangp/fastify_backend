
const { Pool } = require('pg');
require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });

const pool = new Pool({
  host: process.env.POSTGRES_HOST,
  port: process.env.POSTGRES_PORT,
  database: process.env.POSTGRES_DB,
  user: process.env.POSTGRES_USER,
  password: process.env.POSTGRES_PASSWORD,
});

async function createSchemaAndTables() {
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
    await client.query(`
      CREATE TABLE IF NOT EXISTS fastify_log.request_logs (
        id SERIAL PRIMARY KEY,
        datetime TIMESTAMPTZ,
        method VARCHAR(10),
        url VARCHAR(2048),
        input JSONB,
        output JSONB,
        timeTaken_ms REAL
      );
    `);
  } finally {
    client.release();
  }
}

async function logToDb(log) {
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
    } catch (err) {
        console.error('Error inserting app log:', err);
    } finally {
        client.release();
    }
}

async function logRequestToDb(requestLog) {
    const client = await pool.connect();
    try {
        const { datetime, method, url, input, output, timeTaken_ms } = requestLog;
        const query = `
            INSERT INTO fastify_log.request_logs (datetime, method, url, input, output, timeTaken_ms)
            VALUES ($1, $2, $3, $4, $5, $6)
        `;
        const values = [datetime, method, url, input, output, parseFloat(timeTaken_ms)];
        await client.query(query, values);
    } catch (err) {
        console.error('Error inserting request log:', err);
    } finally {
        client.release();
    }
}

createSchemaAndTables();

module.exports = { logToDb, logRequestToDb };
