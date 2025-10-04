// Vercel serverless function entry point for literacy assessment backend
import { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Health check endpoint
  if (req.url === '/health' || req.url === '/') {
    return res.status(200).json({
      status: 'ok',
      message: 'Literacy Assessment Backend API',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'production',
      version: 'v1.0',
    });
  }

  // 404 for other routes
  return res.status(404).json({
    error: 'Not Found',
    message: `Route ${req.method} ${req.url} not found`,
    path: req.url,
  });
}
