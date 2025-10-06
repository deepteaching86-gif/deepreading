import { VercelRequest, VercelResponse } from '@vercel/node';

// Vercel serverless function handler for Express app
let app: any;

async function getApp() {
  if (!app) {
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
    console.log('Catch-all handler called');
    console.log('Method:', req.method);
    console.log('URL:', req.url);
    console.log('Query:', req.query);

    const expressApp = await getApp();

    // Reconstruct the full path from query.path array
    const pathSegments = req.query.path as string[];
    const fullPath = pathSegments ? `/${pathSegments.join('/')}` : '/';

    console.log('Reconstructed path:', fullPath);

    // Override req.url with the reconstructed path
    req.url = fullPath;

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
