'use strict';

const pino = require('pino');
const fs = require('fs');
const path = require('path');
const { logToDb, logRequestToDb } = require('./db-logger');

// Ensure log directory exists
const logDir = path.dirname(process.env.LOG_FILE || 'src/logs/app.log');
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

const logFile = process.env.LOG_FILE || 'src/logs/app.log';

// Create logger instance to log to a file
const dest = pino.destination(logFile);
const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
}, dest);


// --- New code for request logger ---

const requestLogFile = 'src/logs/requests.csv';

// Ensure log directory exists
const requestLogDir = path.dirname(requestLogFile);
if (!fs.existsSync(requestLogDir)) {
  fs.mkdirSync(requestLogDir, { recursive: true });
}

// Write header if file is new
if (!fs.existsSync(requestLogFile)) {
    fs.writeFileSync(requestLogFile, 'datetime,method,url,input,output,timeTaken_ms\n');
}

function escapeCsvField(field) {
    if (field === null || field === undefined) {
        return '""';
    }
    const stringField = typeof field === 'string' ? field : JSON.stringify(field);
    // Escape double quotes by doubling them and wrap in double quotes
    const escaped = stringField.replace(/"/g, '""');
    return `"${escaped}"`;
}

const requestLogger = {
    log: (logData) => {
        const csvLine = [
            logData.datetime,
            logData.method,
            logData.url,
            escapeCsvField(logData.input),
            escapeCsvField(logData.output),
            logData.timeTaken
        ].join(',') + '\n';
        
        // Use async append to not block event loop
        fs.appendFile(requestLogFile, csvLine, (err) => {
            if (err) {
                console.error('Failed to write to request log file', err);
            }
        });
        logRequestToDb(logData);
    }
};

// Custom logging function to log to both console and file
function logEvent(level, message, data = {}) {
  if (typeof message === 'object') {
    logger[level](message);
    logToDb(message);
  } else {
    logger[level]({ msg: message, ...data });
    logToDb({ level: logger.levels.values[level], time: Date.now(), msg: message, ...data });
  }
}

// Export logger and helper functions
module.exports = {
  logger,
  info: (message, data) => logEvent('info', message, data),
  error: (message, data) => logEvent('error', message, data),
  warn: (message, data) => logEvent('warn', message, data),
  debug: (message, data) => logEvent('debug', message, data),
  trace: (message, data) => logEvent('trace', message, data),
  fatal: (message, data) => logEvent('fatal', message, data),
  requestLogger,
  final: pino.final,
  dest
};
