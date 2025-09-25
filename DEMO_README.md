# Workflow Implementation Demo

This document explains how the workflow implementation works and how to run a demo to see it in action.

## How It Works

The workflow implementation replicates the functionality of an n8n flow defined in `frontend_dashboard_interface.json`. Here's how it works:

1. **Frontend Dashboard Interface**: The main implementation in `src/workflow/frontend_dashboard_interface.js` processes webhook requests based on command types (1-8) and generates appropriate SQL queries.

2. **Platform Modules**: The implementation uses two key platform modules:
   - `src/platform/webhook.js`: Handles webhook registration, processing, and deregistration
   - `src/platform/postgres.js`: Manages database operations using Supabase

3. **Route Handlers**: The `src/routes/workflow.js` file defines Fastify routes for webhook endpoints and API endpoints for webhook management.

4. **Command Processing**: When a webhook request is received, it's processed based on the `cmd` parameter:
   - `cmd=1`: Get activities and progress data
   - `cmd=2`: Get class information
   - `cmd=3`: Get asset table reference and then query it
   - `cmd=4`: Get student information
   - `cmd=5`: Track slides and activity progress
   - `cmd=6`: Get next activity
   - `cmd=7`: Reset activity progress
   - `cmd=8`: Get audio prompts

## Running the Demo

To run the demo and see the workflow in action:

1. **Install Dependencies**:
   ```
   npm install
   ```

2. **Set Up Environment Variables**:
   Make sure your `.env` file contains the necessary variables, especially:
   ```
   SUPABASE_URL=your_supabase_url
   SUPABASE_KEY=your_supabase_key
   PORT=3000
   HOST=localhost
   ```

3. **Run the Demo Script**:
   ```
   node demo.js
   ```

   This script will:
   - Start the backend server
   - Run the test workflow examples
   - Show the results of various API calls

4. **What to Expect**:
   The demo will make several API calls to test different aspects of the workflow:
   - Command 1: Get activities and progress
   - Command 3: Get asset table reference
   - Command 5: Track slides
   - Register a new webhook
   - List all webhooks
   - Delete a webhook

5. **Manual Testing**:
   You can also manually test the API endpoints using tools like Postman or curl:

   ```bash
   # Test the main webhook endpoint
   curl -X POST http://localhost:3000/webhook/5d4dbdb7-c22c-43bd-bda4-5017b5e95264 \
     -H "Content-Type: application/json" \
     -d '{"cmd":"1","user":"auden_cbse","class":"8","section":"A"}'

   # Register a new webhook
   curl -X POST http://localhost:3000/api/webhooks \
     -H "Content-Type: application/json" \
     -d '{"path":"custom-webhook","method":"POST","name":"Custom Webhook"}'

   # List all webhooks
   curl -X GET http://localhost:3000/api/webhooks

   # Delete a webhook (replace webhook_id with an actual ID)
   curl -X DELETE http://localhost:3000/api/webhooks/webhook_id
   ```

## Troubleshooting

If you encounter issues running the demo:

1. **Database Connection**: Make sure your Supabase credentials are correct and the database is accessible
2. **Port Conflicts**: Ensure port 3000 is not being used by another application
3. **Missing Dependencies**: Run `npm install` to ensure all dependencies are installed
4. **Logs**: Check the console output and `src/logs` directory for error messages