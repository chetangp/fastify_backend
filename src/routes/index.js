'use strict';

const { logger } = require('../utils/logger');

async function routes(fastify, options) {
  // Health check route
  fastify.get('/health', async (request, reply) => {
    return { status: 'ok', message: 'Server is up and running' };
  });

  // Register all route modules here
  fastify.register(require('./api'), { prefix: '/api' });
  
  // Register workflow routes
  fastify.register(require('./frontend'));

  // Add a 404 handler
  fastify.setNotFoundHandler((request, reply) => {
    logger.warn(`Route not found: ${request.method} ${request.url}`);
    reply.status(404).send({ 
      statusCode: 404, 
      error: 'Not Found', 
      message: 'Route not found' 
    });
  });

  // Add error handler
  fastify.setErrorHandler((error, request, reply) => {
    logger.error(`Error processing request: ${request.method} ${request.url}`, error);
    
    // Handle validation errors
    if (error.validation) {
      return reply.status(400).send({ 
        statusCode: 400, 
        error: 'Bad Request', 
        message: error.message 
      });
    }

    // Handle custom errors
    if (error.statusCode) {
      return reply.status(error.statusCode).send({ 
        statusCode: error.statusCode, 
        error: error.error || 'Error', 
        message: error.message 
      });
    }

    // Default error handling
    const isDevelopment = process.env.NODE_ENV !== 'production';
    reply.status(500).send({ 
      statusCode: 500, 
      error: 'Internal Server Error', 
      message: isDevelopment ? error.message : 'An internal server error occurred',
      stack: isDevelopment ? error.stack : undefined
    });
  });
}

module.exports = routes;