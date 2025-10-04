// Vercel serverless function entry point for literacy assessment backend
import { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    // Import the compiled Express app from dist/src/app
    const { app } = require('../dist/src/app');

    // Handle the request with Express app
    return new Promise((resolve, reject) => {
      app(req as any, res as any);
      res.on('finish', resolve);
      res.on('error', reject);
    });
  } catch (error) {
    console.error('Error in serverless function:', error);
    return res.status(500).json({
      error: 'Internal Server Error',
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      cwd: process.cwd(),
    });
  }
}
