// Vercel serverless function entry point
import { VercelRequest, VercelResponse } from '@vercel/node';
import path from 'path';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    // Use absolute path for module resolution
    // In Vercel, files are in /var/task/backend/
    const appPath = path.join(process.cwd(), 'backend', 'dist', 'app');
    console.log('Attempting to load app from:', appPath);

    const { app } = await import(appPath);

    // Handle the request with Express app
    return new Promise((resolve, reject) => {
      app(req as any, res as any);
      res.on('finish', resolve);
      res.on('error', reject);
    });
  } catch (error) {
    console.error('Handler error:', error);
    console.error('CWD:', process.cwd());
    console.error('__dirname:', __dirname);

    return res.status(500).json({
      error: 'Internal Server Error',
      message: error instanceof Error ? error.message : 'Unknown error',
      cwd: process.cwd(),
      dirname: __dirname,
    });
  }
}
