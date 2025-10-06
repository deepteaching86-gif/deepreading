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
    // Vercel provides the original path in x-vercel-forwarded-for header or via query
    // But the simplest approach is to use the URL as-is since we're rewriting everything to /api
    const originalPath = req.headers['x-now-route-matches'] as string || req.url || '/';

    console.log('Handler called');
    console.log('Method:', req.method);
    console.log('URL:', req.url);
    console.log('Original Path:', originalPath);
    console.log('All Headers:', JSON.stringify(req.headers, null, 2));

    const expressApp = await getApp();

    // The URL should already be correct from Vercel
    console.log('Forwarding to Express with URL:', req.url);
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
