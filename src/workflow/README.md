# Workflow Implementation

This folder contains the implementation of the workflow system that replicates the functionality of the n8n flow defined in `frontend_dashboard_interface.json`.

## Files

- `frontend_dashboard_interface.js`: Main implementation of the workflow logic from the n8n flow

## Related Platform Modules

This implementation uses the following platform modules:

- `platform/webhook.js`: Implementation of webhook functionality similar to n8n's webhook node
- `platform/postgres.js`: Implementation of postgres functionality similar to n8n's postgres node

## How It Works

### Webhook Handling

The workflow starts with a webhook endpoint that receives requests from the frontend. The webhook endpoint is registered at `/webhook/5d4dbdb7-c22c-43bd-bda4-5017b5e95264` to match the n8n flow.

When a request is received, it is processed based on the `cmd` parameter in the request body:

- `cmd=1`: Get activities and progress data
- `cmd=2`: Get class information
- `cmd=3`: Get asset table reference and then query it
- `cmd=4`: Get student information
- `cmd=5`: Track slides and activity progress
- `cmd=6`: Get next activity
- `cmd=7`: Reset activity progress
- `cmd=8`: Get audio prompts

### Database Operations

The workflow can use either Supabase or direct PostgreSQL connections to execute SQL queries against the PostgreSQL database. The `PostgresNode` class provides methods for executing queries, inserting, updating, deleting, and selecting data.

#### Connection Types

The `PostgresNode` class supports two connection types:

1. **Supabase Connection** (default)
   - Uses the Supabase client to connect to PostgreSQL
   - Requires `SUPABASE_URL` and `SUPABASE_KEY` environment variables

2. **Direct PostgreSQL Connection**
   - Uses the `pg` package to connect directly to PostgreSQL
   - Can be configured with either:
     - `POSTGRES_CONNECTION_STRING` environment variable
     - Individual connection parameters: `POSTGRES_HOST`, `POSTGRES_PORT`, `POSTGRES_DB`, `POSTGRES_USER`, `POSTGRES_PASSWORD`

### Data Transformation

For `cmd=1`, the workflow executes two queries and merges the results to provide a combined response with activity details and progress information.

## Usage

To use this workflow implementation:

1. Configure the database connection in the `.env` file:
   - For Supabase: Set `SUPABASE_URL` and `SUPABASE_KEY`
   - For direct PostgreSQL: Set either `POSTGRES_CONNECTION_STRING` or the individual connection parameters

2. When initializing the PostgresNode, specify the connection type:
   ```javascript
   // For Supabase connection (default)
   const postgresNode = new PostgresNode({ connectionType: 'supabase' });
   
   // For direct PostgreSQL connection
   const postgresNode = new PostgresNode({ connectionType: 'postgres' });
   ```

3. Ensure the server is running

4. Send POST requests to `/webhook/5d4dbdb7-c22c-43bd-bda4-5017b5e95264` with the appropriate command and parameters

5. The response will match the format expected by the frontend

See the `examples/test_workflow.js` file for sample requests and usage.

## API Endpoints

- `POST /webhook/5d4dbdb7-c22c-43bd-bda4-5017b5e95264`: Main webhook endpoint for the workflow
- `POST /api/webhooks`: Register a new webhook
- `GET /api/webhooks`: List all registered webhooks
- `DELETE /api/webhooks/:webhookId`: Delete a webhook

## Example Request

```javascript
// Example request for cmd=1
const response = await axios.post(
  'http://localhost:3000/webhook/5d4dbdb7-c22c-43bd-bda4-5017b5e95264',
  {
    cmd: '1',
    user: 'auden_cbse',
    class: '8',
    section: 'A'
  }
);
```