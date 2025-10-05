// Vercel serverless function entry point for literacy assessment backend
import { VercelRequest, VercelResponse } from '@vercel/node';
import { app } from '../src/app';

export default function handler(req: VercelRequest, res: VercelResponse) {
  // Use the Express app to handle all requests
  // Express app is a request handler function
  app(req as any, res as any);
}
