// Vercel serverless function entry point
import { VercelRequest, VercelResponse } from '@vercel/node';
import { app } from '../src/app';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Handle the request with Express app
  return new Promise((resolve, reject) => {
    app(req as any, res as any);
    res.on('finish', resolve);
    res.on('error', reject);
  });
}
