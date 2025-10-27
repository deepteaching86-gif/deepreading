// English Test Proxy Route
// Forwards all /api/v1/english-test/* requests to Python FastAPI backend

import { Router, Request, Response } from 'express';
import axios, { AxiosError, AxiosResponse } from 'axios';
import { env } from '../config/env';

const router = Router();

// Python backend URL from environment variable
const PYTHON_BACKEND_URL = env.PYTHON_BACKEND_URL;

console.log('🐍 Python Backend URL:', PYTHON_BACKEND_URL);

/**
 * Proxy all requests to Python backend
 * Forwards headers, body, query params, and HTTP method
 */
router.all('/*', async (req: Request, res: Response) => {
  try {
    const targetPath = req.path; // e.g., "/start", "/submit", "/result"
    const targetUrl = `${PYTHON_BACKEND_URL}/api/english-test${targetPath}`;

    console.log(`🔄 Proxying ${req.method} ${req.originalUrl} → ${targetUrl}`);
    console.log('   Headers:', JSON.stringify(req.headers, null, 2));
    console.log('   Query:', req.query);
    console.log('   Body:', req.body);

    // Forward the request to Python backend
    const response: AxiosResponse = await axios({
      method: req.method,
      url: targetUrl,
      params: req.query,
      data: req.body,
      headers: {
        ...req.headers,
        host: undefined, // Remove host header to avoid conflicts
        'x-forwarded-for': req.ip,
        'x-original-url': req.originalUrl,
      },
      validateStatus: () => true, // Don't throw on any status code
      timeout: 30000, // 30 second timeout
    });

    console.log(`✅ Python backend response: ${response.status}`);
    console.log('   Response data:', JSON.stringify(response.data, null, 2));

    // Forward response headers
    Object.entries(response.headers).forEach(([key, value]) => {
      if (key.toLowerCase() !== 'transfer-encoding') {
        res.setHeader(key, value as string);
      }
    });

    // Send the response
    return res.status(response.status).json(response.data);
  } catch (error) {
    console.error('❌ Proxy error:', error);

    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError;

      if (axiosError.code === 'ECONNREFUSED') {
        return res.status(503).json({
          error: 'Service Unavailable',
          message: 'Python backend is not running',
          details: `Cannot connect to ${PYTHON_BACKEND_URL}`,
        });
      }

      if (axiosError.response) {
        return res.status(axiosError.response.status).json(axiosError.response.data);
      }
    }

    return res.status(500).json({
      error: 'Proxy Error',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

export default router;
