'use strict';

const frontendDashboardService = require('../services/frontendDashboardInterface');
const { logger } = require('../utils/logger');

async function frontendRoutes(fastify, options) {
  fastify.post('/frontend_database_interface', {
    schema: {
      body: {
        type: 'object',
        properties: {
          cmd: { type: 'string' },
        },
        required: ['cmd']
      },
      /* response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: { type: 'object' }
          }
        }
      } */
    },
    handler: async (request, reply) => {
      try {
        const { body } = request;
        logger.info('Received request for /frontend_database_interface', { cmd: body.cmd });
        const dbClient = request.server.pg;
        const result = await frontendDashboardService.processRequest(dbClient, body);

        if (result.success) {
          if (request.body.cmd === '1') {
            return reply.send(result.data.progressData);
          }
          return reply.send(result.data);
        } else {
          return reply.status(result.statusCode || 500).send(result);
        }
      } catch (error) {
        logger.error('Error processing request for /frontend_database_interface', { error: error.message, stack: error.stack });
        throw error;
      }
    }
  });
}

module.exports = frontendRoutes;