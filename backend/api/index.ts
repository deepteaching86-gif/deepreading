// Vercel serverless function entry point
import { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    // Dynamic import to avoid initialization issues
    const { app } = await import('../src/app');

    // Handle the request with Express app
    return new Promise((resolve, reject) => {
      app(req as any, res as any);
      res.on('finish', resolve);
      res.on('error', reject);
    });
  } catch (error) {
    console.error('Handler error:', error);
    return res.status(500).json({
      error: 'Internal Server Error',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}
