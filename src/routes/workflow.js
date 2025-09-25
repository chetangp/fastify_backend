/**
 * Workflow Routes
 * This file defines the routes for the workflow functionality
 */

const { FastifyPluginAsync } = require('fastify');
const { processWebhookRequest } = require('../workflow/frontend_dashboard_interface');
const WebhookNode = require('../platform/webhook');
const logger = require('../utils/logger');

/**
 * Workflow routes plugin
 * @type {FastifyPluginAsync}
 */
const workflowRoutes = async (fastify, opts) => {
  // Initialize the webhook node
  const webhookNode = new WebhookNode();
  // Register the webhook endpoint from n8n flow
  fastify.post('/webhook/:webhookId', async (request, reply) => {
    try {
      logger.info('Received webhook request', { webhookId: request.params.webhookId });
      
      // Process the webhook request using our implementation
      await processWebhookRequest(request, reply);
      
      // If processWebhookRequest doesn't send a response, we'll handle it here
      if (!reply.sent) {
        return { success: true };
      }
    } catch (error) {
      logger.error('Error processing webhook request', { error: error.message });
      return reply.status(500).send({ error: 'Internal server error' });
    }
  });

  // Register the specific webhook endpoint from n8n flow (5d4dbdb7-c22c-43bd-bda4-5017b5e95264)
  fastify.post('/webhook/5d4dbdb7-c22c-43bd-bda4-5017b5e95264', async (request, reply) => {
    try {
      logger.info('Received request to specific webhook endpoint');
      
      // Process the webhook request using our implementation
      await processWebhookRequest(request, reply);
      
      // If processWebhookRequest doesn't send a response, we'll handle it here
      if (!reply.sent) {
        return { success: true };
      }
    } catch (error) {
      logger.error('Error processing specific webhook request', { error: error.message });
      return reply.status(500).send({ error: 'Internal server error' });
    }
  });

  // API endpoint to register a new webhook
  fastify.post('/api/webhooks', async (request, reply) => {
    try {
      const { path, method, name } = request.body;
      
      if (!method) {
        return reply.status(400).send({ error: 'HTTP method is required' });
      }
      
      // Register the webhook
      const result = webhookNode.createWebhook({
        path,
        method,
        handler: async (webhookData, res) => {
          // Store the webhook data for later processing
          return await processWebhookRequest({ body: webhookData.body }, res);
        },
        options: { name }
      });
      
      if (!result.success) {
        return reply.status(500).send({ error: result.error });
      }
      
      return {
        success: true,
        webhook: {
          id: result.webhook.id,
          url: result.webhook.url,
          name: name || `Webhook ${result.webhook.id}`,
        },
      };
    } catch (error) {
      logger.error('Error registering webhook', { error: error.message });
      return reply.status(500).send({ error: 'Failed to register webhook' });
    }
  });

  // API endpoint to delete a webhook
  fastify.delete('/api/webhooks/:webhookId', async (request, reply) => {
    try {
      const { webhookId } = request.params;
      
      const result = webhookNode.deleteWebhook(webhookId);
      
      if (!result.success) {
        return reply.status(404).send({ error: 'Webhook not found' });
      }
      
      return { success: true };
    } catch (error) {
      logger.error('Error deleting webhook', { error: error.message });
      return reply.status(500).send({ error: 'Failed to delete webhook' });
    }
  });

  // API endpoint to list all webhooks
  fastify.get('/api/webhooks', async (request, reply) => {
    try {
      const webhooks = Array.from(webhookNode.webhooks.entries()).map(([id, webhook]) => ({
        id,
        url: webhook.url,
        method: webhook.method,
        name: webhook.options?.name || `Webhook ${id}`,
        createdAt: webhook.createdAt,
      }));
      
      return { success: true, webhooks };
    } catch (error) {
      logger.error('Error listing webhooks', { error: error.message });
      return reply.status(500).send({ error: 'Failed to list webhooks' });
    }
  });
};

module.exports = workflowRoutes;