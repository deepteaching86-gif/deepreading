import { Handler } from '@netlify/functions';
import serverless from 'serverless-http';

// Import the Express app
const app = require('../../backend/dist/app').default || require('../../backend/dist/app');

// Wrap Express app with serverless-http
const handler: Handler = serverless(app);

export { handler };
