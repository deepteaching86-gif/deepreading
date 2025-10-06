import { Handler, HandlerEvent, HandlerContext } from '@netlify/functions';

// Import Express app
const app = require('../../backend/dist/app').app || require('../../backend/dist/app').default;

// Create handler
const handler: Handler = async (event: HandlerEvent, context: HandlerContext) => {
  // Log for debugging
  console.log('Function invoked:', event.path);
  
  // Import serverless-http
  const serverless = require('serverless-http');
  
  // Wrap Express app
  const handler = serverless(app);
  
  // Execute and return
  return await handler(event, context);
};

export { handler };
