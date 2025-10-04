// Vercel serverless function entry point
import { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Dynamically import the compiled app
  const { app } = require('../dist/app');

  // Handle the request with Express app
  return new Promise((resolve, reject) => {
    app(req as any, res as any);
    res.on('finish', resolve);
    res.on('error', reject);
  });
}
