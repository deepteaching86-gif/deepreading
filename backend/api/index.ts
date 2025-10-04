// Vercel serverless function entry point for literacy assessment backend
import { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Simple health check endpoint
  if (req.url === '/health') {
    return res.status(200).json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'production',
      version: 'v1',
    });
  }

  // Return 404 for other routes for now
  return res.status(404).json({
    error: 'Not Found',
    message: `Cannot ${req.method} ${req.url}`,
    path: req.url,
  });
}
