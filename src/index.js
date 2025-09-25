'use strict';

require('dotenv').config();
const path = require('path');
const fastify = require('fastify');
const { logger, dest } = require('./utils/logger');
const { logHttp } = require('./utils/http-logger');

// Create Fastify instance
const server = fastify({
  logger: logger,
  trustProxy: true
});

// Add hooks for logging
server.addHook('onSend', (request, reply, payload, done) => {
  request.payload = payload;
  done();
});

server.addHook('onResponse', (request, reply, done) => {
  const responseTime = reply.getResponseTime();
  
  const logData = {
    datetime: new Date().toISOString(),
    method: request.method,
    url: request.raw.url,
    request_body: request.body,
    response_body: request.payload,
    time_taken_ms: responseTime.toFixed(3),
  };
  
  // Log to general log file
  request.log.info({ requestLog: logData }, 'Request processed');

  // Log to http_logs table in PostgreSQL
  logHttp(logData);

  done();
});

// Register plugins
async function registerPlugins() {
  // CORS
  await server.register(require('@fastify/cors'), {
    origin: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
  });

  // Swagger documentation
  await server.register(require('@fastify/swagger'), {
    routePrefix: '/documentation',
    swagger: {
      info: {
        title: 'ProyoGeek API',
        description: 'API documentation for ProyoGeek backend',
        version: '1.0.0'
      },
      host: `${process.env.HOST}:${process.env.PORT}`,
      schemes: ['http', 'https'],
      consumes: ['application/json'],
      produces: ['application/json']
    },
    exposeRoute: true
  });

  // Register database connection
  await server.register(require('./config/database'));

  // Register routes
  await server.register(require('./routes'));
}

// Graceful shutdown function
async function gracefulShutdown(signal, err) {
  console.log(`Received ${signal}. Shutting down gracefully...`);
  if (err) {
    logger.error(err);
  }
  server.close(() => {
    dest.flushSync();
    process.exit(err ? 1 : 0);
  });
}

// Start server
async function start() {
  try {
    await registerPlugins();

    // Add default route
    server.get('/', async (request, reply) => {
      return { status: 'ok', message: 'ProyoGeek API is running' };
    });

    // Start listening
    await server.listen({ 
      port: process.env.PORT || 3927, 
      host: process.env.HOST || '0.0.0.0' 
    });
    
    server.log.info(`Server listening on ${server.server.address().port}`);
  } catch (err) {
    gracefulShutdown('startup error', err);
  }
}

// Handle unhandled rejections
process.on('unhandledRejection', (err) => {
  console.error('Unhandled rejection:', err);
  gracefulShutdown('unhandledRejection', err);
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error('Uncaught exception:', err);
  gracefulShutdown('uncaughtException', err);
});

// Handle termination signals
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));

// Start the server
start();
