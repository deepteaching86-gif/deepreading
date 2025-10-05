// Vercel serverless function entry point for literacy assessment backend
import { VercelRequest, VercelResponse } from '@vercel/node';
import { app } from '../src/app';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Use the Express app to handle all requests
  return app(req, res);
}
