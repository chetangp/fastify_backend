'use strict';

const { logger } = require('../utils/logger');

async function apiRoutes(fastify, options) {
  // Health check endpoint
  fastify.get('/health', {
    schema: {
      response: {
        200: {
          type: 'object',
          properties: {
            status: { type: 'string' },
            timestamp: { type: 'string', format: 'date-time' }
          }
        }
      }
    },
    handler: async (request, reply) => {
      return { status: 'healthy', timestamp: new Date().toISOString() };
    }
  });

  // Example webhook endpoint
  fastify.post('/webhook', {
    schema: {
      body: {
        type: 'object',
        properties: {
          event: { type: 'string' },
          data: { type: 'object' }
        },
        required: ['event']
      },
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            message: { type: 'string' }
          }
        }
      }
    },
    handler: async (request, reply) => {
      try {
        const { event, data } = request.body;
        
        logger.info(`Webhook received: ${event}`, { data });
        
        // Process webhook data here
        // This is where you would use the platform/webhook.js functionality
        
        return { success: true, message: 'Webhook processed successfully' };
      } catch (error) {
        logger.error('Error processing webhook:', error);
        throw error;
      }
    }
  });

  // Example database query endpoint
  fastify.get('/data', {
    schema: {
      querystring: {
        table: { type: 'string' },
        limit: { type: 'integer', default: 10 }
      },
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: { type: 'array' }
          }
        }
      }
    },
    handler: async (request, reply) => {
      try {
        const { table, limit } = request.query;
        
        // This is where you would use the platform/postgres.js functionality
        const { data, error } = await fastify.supabase
          .from(table)
          .select('*')
          .limit(limit);
        
        if (error) throw error;
        
        return { success: true, data };
      } catch (error) {
        logger.error('Error fetching data:', error);
        throw error;
      }
    }
  });
}

module.exports = apiRoutes;