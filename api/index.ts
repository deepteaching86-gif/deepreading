import { VercelRequest, VercelResponse } from '@vercel/node';

// This handler must be at /api/index.ts and will handle all /api/* routes
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
    console.log('API handler called');
    console.log('Method:', req.method);
    console.log('URL:', req.url);
    console.log('Original URL:', req.headers['x-vercel-proxied-for'] || req.url);

    const expressApp = await getApp();
    
    console.log('Forwarding to Express');
    expressApp(req, res);
  } catch (error) {
    console.error('Error in handler:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}
