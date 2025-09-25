'use strict';

const frontendService = require('../services/frontendService');
const { logger } = require('../utils/logger');

async function frontendRoutes(fastify, options) {
  fastify.post('/frontend_database_interface', async (request, reply) => {
    try {
      const { body } = request;
      logger.info('Received request for /frontend_database_interface', { cmd: body.cmd });

      let result;
      switch (body.cmd) {
        case '1':
          result = await frontendService.handleCmd1(body);
          break;
        case '2':
        case '4':
          result = await frontendService.handleStandardCommand(body);
          break;
        case '3':
          result = await frontendService.handleCmd3(body);
          break;
        default:
          return reply.status(400).send({ error: 'Invalid command' });
      }

      return reply.send(result);
    } catch (error) {
      logger.error('Error in /frontend_database_interface', { error: error.message, stack: error.stack });
      // Customize error response based on error type if needed
      if (error.message === 'Asset table reference not found') {
        return reply.status(404).send({ error: error.message });
      }
      return reply.status(500).send({ error: 'Internal server error' });
    }
  });
}

module.exports = frontendRoutes;