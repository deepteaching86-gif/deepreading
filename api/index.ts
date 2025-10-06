import { VercelRequest, VercelResponse } from '@vercel/node';

let app: any;

async function getApp() {
  if (!app) {
    const appModule = await import('../backend/src/app');
    app = appModule.app;
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
    const expressApp = await getApp();
    expressApp(req, res);
  } catch (error) {
    console.error('Error loading Express app:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}
