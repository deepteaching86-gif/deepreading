// Vercel serverless function entry point
import { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Dynamic import to avoid initialization issues
  const { app } = await import('../src/app');

  // Handle the request with Express app
  app(req as any, res as any);
}
