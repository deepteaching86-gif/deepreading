// Express application setup

import express, { Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { env } from './config/env';
import { errorHandler } from './common/middleware/error-handler';
import { httpLogStream } from './config/logger';

// Create Express app
const app: Application = express();

// Trust Vercel proxy
app.set('trust proxy', 1);

// ===== Middleware =====

// Security
app.use(helmet());

// CORS
app.use(cors({
  origin: env.CORS_ORIGIN,
  credentials: true,
}));

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Rate limiting
const limiter = rateLimit({
  windowMs: env.RATE_LIMIT_WINDOW_MS,
  max: env.RATE_LIMIT_MAX_REQUESTS,
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

app.use(`/api/${env.API_VERSION}/`, limiter);

// HTTP request logging (using Morgan with Winston)
if (env.NODE_ENV !== 'test') {
  const morgan = require('morgan');
  app.use(morgan('combined', { stream: httpLogStream }));
}

// ===== Routes =====

// Health check
app.get('/health', (_req, res) => {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    environment: env.NODE_ENV,
    version: env.API_VERSION,
  });
});

// API routes
import adminQuestionsRoutes from './routes/admin/questions.routes';
import authRoutes from './routes/auth/auth.routes';

// Note: Vercel strips /api prefix when routing to /api/index.ts
// So /api/v1/auth/login becomes /v1/auth/login
app.use(`/${env.API_VERSION}/auth`, authRoutes);
app.use(`/${env.API_VERSION}/admin/questions`, adminQuestionsRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: `Cannot ${req.method} ${req.path}`,
    path: req.path,
  });
});

// Error handler (must be last)
app.use(errorHandler);

export { app };
export default app;
