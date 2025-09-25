'use strict';

/**
 * Example usage of the platform modules
 * This file demonstrates how to use the PostgreSQL and Webhook functionality
 */

// Import required modules
const PostgresNode = require('../platform/postgres');
const WebhookNode = require('../platform/webhook');
const { logger } = require('../utils/logger');

// Example: Using the PostgreSQL module
async function postgresExample() {
  try {
    // Example with Supabase connection (default)
    const postgresSupabase = new PostgresNode({
      connectionType: 'supabase',
      // You can override default configuration here
      // supabaseUrl: 'your_supabase_url',
      // supabaseKey: 'your_supabase_key'
    });
    
    // Example with direct PostgreSQL connection
    const postgresDirectConn = new PostgresNode({
      connectionType: 'postgres',
      // You can use connection string
      // connectionString: 'postgresql://user:password@localhost:5432/dbname',
      // Or individual connection parameters
      // host: 'localhost',
      // port: 5432,
      // database: 'dbname',
      // user: 'user',
      // password: 'password'
    });
    
    // For this example, we'll use the Supabase connection
    const postgres = postgresSupabase;

    // Example 1: Execute a raw SQL query
    const queryResult = await postgres.executeQuery({
      sql: 'SELECT * FROM users WHERE role = $1 LIMIT $2',
      values: ['admin', 10]
    });
    logger.info('SQL query result:', queryResult);

    // Example 2: Insert data
    const insertResult = await postgres.insert({
      table: 'users',
      data: {
        name: 'John Doe',
        email: 'john@example.com',
        role: 'user'
      }
    });
    logger.info('Insert result:', insertResult);

    // Example 3: Update data
    const updateResult = await postgres.update({
      table: 'users',
      data: {
        role: 'admin'
      },
      match: {
        email: 'john@example.com'
      }
    });
    logger.info('Update result:', updateResult);

    // Example 4: Select data
    const selectResult = await postgres.select({
      table: 'users',
      columns: 'id, name, email, role',
      filter: {
        role: 'admin'
      },
      limit: 5
    });
    logger.info('Select result:', selectResult);

    // Example 5: Delete data
    const deleteResult = await postgres.delete({
      table: 'users',
      match: {
        email: 'john@example.com'
      }
    });
    logger.info('Delete result:', deleteResult);

    return 'PostgreSQL examples completed successfully';
  } catch (error) {
    logger.error('Error in PostgreSQL examples:', error);
    throw error;
  }
}

// Example: Using the Webhook module
async function webhookExample() {
  try {
    // Initialize Webhook node
    const webhook = new WebhookNode({
      // You can override default configuration here
      // baseUrl: 'http://localhost:3000'
    });

    // Example 1: Create a webhook
    const createResult = webhook.createWebhook({
      path: '/api/custom-webhook',
      method: 'POST',
      handler: async (data) => {
        logger.info('Webhook received:', data);
        return { processed: true, timestamp: new Date().toISOString() };
      }
    });
    logger.info('Create webhook result:', createResult);

    // Example 2: List all webhooks
    const listResult = webhook.listWebhooks();
    logger.info('List webhooks result:', listResult);

    // Example 3: Send a webhook to an external service
    const sendResult = await webhook.sendWebhook({
      url: 'https://webhook.site/your-test-id',
      method: 'POST',
      data: {
        event: 'test_event',
        payload: {
          message: 'This is a test webhook',
          timestamp: new Date().toISOString()
        }
      },
      headers: {
        'X-Custom-Header': 'Custom Value'
      }
    });
    logger.info('Send webhook result:', sendResult);

    // Example 4: Process an incoming webhook
    const processResult = await webhook.processWebhook({
      webhookId: createResult.webhook.id,
      body: {
        event: 'incoming_data',
        data: {
          message: 'Incoming webhook data',
          timestamp: new Date().toISOString()
        }
      }
    });
    logger.info('Process webhook result:', processResult);

    // Example 5: Delete a webhook
    const deleteResult = webhook.deleteWebhook(createResult.webhook.id);
    logger.info('Delete webhook result:', deleteResult);

    return 'Webhook examples completed successfully';
  } catch (error) {
    logger.error('Error in webhook examples:', error);
    throw error;
  }
}

// Run the examples
async function runExamples() {
  try {
    logger.info('Starting examples...');
    
    // Run PostgreSQL examples
    const postgresResult = await postgresExample();
    logger.info(postgresResult);
    
    // Run Webhook examples
    const webhookResult = await webhookExample();
    logger.info(webhookResult);
    
    logger.info('All examples completed successfully');
  } catch (error) {
    logger.error('Error running examples:', error);
  }
}

// Uncomment to run the examples
// runExamples();

module.exports = {
  postgresExample,
  webhookExample,
  runExamples
};