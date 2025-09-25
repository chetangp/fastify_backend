/**
 * Test Workflow Implementation
 * This file demonstrates how to use the workflow implementation
 */

const axios = require('axios');
const logger = require('../utils/logger');

/**
 * Test the workflow implementation with sample requests
 */
async function testWorkflow() {
  const baseUrl = 'http://localhost:3000';
  
  try {
    logger.info('Starting workflow tests');
    
    // Test case 1: Command 1 - Get activities and progress
    const cmd1Request = {
      body: {
        cmd: '1',
        user: 'auden_cbse',
        class: '8',
        section: 'A'
      }
    };
    
    logger.info('Testing Command 1', cmd1Request.body);
    const cmd1Response = await axios.post(
      `${baseUrl}/webhook/5d4dbdb7-c22c-43bd-bda4-5017b5e95264`,
      cmd1Request.body
    );
    
    logger.info('Command 1 Response', { 
      status: cmd1Response.status,
      data: cmd1Response.data
    });
    
    // Test case 2: Command 3 - Get asset table reference
    const cmd3Request = {
      body: {
        cmd: '3',
        user: 'auden_cbse',
        class: '8',
        section: 'A',
        id: 'activity123'
      }
    };
    
    logger.info('Testing Command 3', cmd3Request.body);
    const cmd3Response = await axios.post(
      `${baseUrl}/webhook/5d4dbdb7-c22c-43bd-bda4-5017b5e95264`,
      cmd3Request.body
    );
    
    logger.info('Command 3 Response', { 
      status: cmd3Response.status,
      data: cmd3Response.data
    });
    
    // Test case 3: Command 5 - Track slides
    const cmd5Request = {
      body: {
        cmd: '5',
        user: 'auden_cbse',
        class: '8',
        section: 'A',
        activity_id: 'activity123',
        is_resume: false,
        Activity_completed: false
      }
    };
    
    logger.info('Testing Command 5', cmd5Request.body);
    const cmd5Response = await axios.post(
      `${baseUrl}/webhook/5d4dbdb7-c22c-43bd-bda4-5017b5e95264`,
      cmd5Request.body
    );
    
    logger.info('Command 5 Response', { 
      status: cmd5Response.status,
      data: cmd5Response.data
    });
    
    // Test case 4: Register a new webhook
    const registerWebhookRequest = {
      path: 'custom-webhook',
      method: 'POST',
      name: 'Custom Webhook'
    };
    
    logger.info('Testing Register Webhook', registerWebhookRequest);
    const registerWebhookResponse = await axios.post(
      `${baseUrl}/api/webhooks`,
      registerWebhookRequest
    );
    
    logger.info('Register Webhook Response', { 
      status: registerWebhookResponse.status,
      data: registerWebhookResponse.data
    });
    
    // Test case 5: List all webhooks
    logger.info('Testing List Webhooks');
    const listWebhooksResponse = await axios.get(`${baseUrl}/api/webhooks`);
    
    logger.info('List Webhooks Response', { 
      status: listWebhooksResponse.status,
      data: listWebhooksResponse.data
    });
    
    // Test case 6: Delete a webhook
    if (registerWebhookResponse.data && registerWebhookResponse.data.webhook) {
      const webhookId = registerWebhookResponse.data.webhook.id;
      
      logger.info('Testing Delete Webhook', { webhookId });
      const deleteWebhookResponse = await axios.delete(
        `${baseUrl}/api/webhooks/${webhookId}`
      );
      
      logger.info('Delete Webhook Response', { 
        status: deleteWebhookResponse.status,
        data: deleteWebhookResponse.data
      });
    }
    
    logger.info('All tests completed successfully');
  } catch (error) {
    logger.error('Error during workflow tests', { 
      error: error.message,
      stack: error.stack
    });
    
    if (error.response) {
      logger.error('Error response', { 
        status: error.response.status,
        data: error.response.data
      });
    }
  }
}

// Run the tests if this file is executed directly
if (require.main === module) {
  testWorkflow().catch(error => {
    console.error('Test failed:', error);
    process.exit(1);
  });
}

module.exports = {
  testWorkflow
};