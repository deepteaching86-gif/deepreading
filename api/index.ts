import { VercelRequest, VercelResponse } from '@vercel/node';

// Vercel serverless function handler for Express app
let app: any;

async function getApp() {
  if (!app) {
    // Use require instead of dynamic import for better compatibility in Vercel
    app = require('../backend/dist/app').default || require('../backend/dist/app');
  }
  return app;
}

// Disable body parsing by Vercel - let Express handle it
export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    console.log('Handler called for:', req.method, req.url);
    const expressApp = await getApp();
    console.log('Express app loaded successfully, type:', typeof expressApp);
    expressApp(req, res);
  } catch (error) {
    console.error('Error in handler:', error);
    console.error('Stack trace:', error instanceof Error ? error.stack : 'No stack trace');
    res.status(500).json({
      error: 'Internal Server Error',
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
    });
  }
}
