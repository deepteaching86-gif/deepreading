import { VercelRequest, VercelResponse } from '@vercel/node';

// Main serverless handler that forwards all requests to Express app
let app: any;

async function getApp() {
  if (!app) {
    app = require('../backend/dist/app').default || require('../backend/dist/app');
  }
  return app;
}

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const expressApp = await getApp();

    // Vercel strips /api prefix, so restore it for Express routes
    const originalUrl = req.url;
    if (!originalUrl?.startsWith('/api/')) {
      req.url = '/api' + (originalUrl || '');
    }

    console.log('API handler - Method:', req.method, 'URL:', req.url);

    expressApp(req, res);
  } catch (error) {
    console.error('Error in handler:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}
