// Express application setup

import express, { Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import path from 'path';
import { env } from './config/env';
import { errorHandler } from './common/middleware/error-handler';
import { httpLogStream } from './config/logger';

// Create Express app
const app: Application = express();

// Trust Render/Netlify proxy
app.set('trust proxy', 1);

// ===== Middleware =====

// CORS MUST come before other middleware
// Allow Netlify frontend and local development
const allowedOrigins = [
  'https://playful-cocada-a89755.netlify.app',
  'http://localhost:5173',
  'http://localhost:5174',
  'http://localhost:5175',
  'http://localhost:5176',
  'http://localhost:3000',
];

console.log('🌐 CORS allowed origins:', allowedOrigins);

// Configure CORS options
const corsOptions = {
  origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
    console.log('🔍 CORS request from origin:', origin);

    // Allow requests with no origin (like mobile apps or curl)
    if (!origin) {
      console.log('✅ CORS: Allowing request with no origin');
      return callback(null, true);
    }

    // Check if origin is in allowed list or matches CORS_ORIGIN env var
    if (allowedOrigins.includes(origin) || origin === env.CORS_ORIGIN) {
      console.log('✅ CORS: Allowing origin:', origin);
      return callback(null, true);
    }

    // Allow all Netlify subdomains
    if (origin.includes('.netlify.app')) {
      console.log('✅ CORS: Allowing Netlify subdomain:', origin);
      return callback(null, true);
    }

    // Log rejected origins for debugging
    console.log('❌ CORS: Blocked origin:', origin);
    callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'X-Requested-With',
    'Accept',
    'Origin',
    'Access-Control-Request-Method',
    'Access-Control-Request-Headers',
  ],
  exposedHeaders: ['Content-Range', 'X-Content-Range'],
  maxAge: 86400, // 24 hours
  preflightContinue: false,
  optionsSuccessStatus: 204,
};

// Apply CORS middleware FIRST
app.use(cors(corsOptions));

// Handle OPTIONS preflight requests explicitly for all routes
app.options('*', cors(corsOptions));

// Static files - uploads folder
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Security - Configure helmet to work with CORS
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  crossOriginOpenerPolicy: { policy: 'same-origin-allow-popups' },
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
import adminQuestionAnalyticsRoutes from './routes/admin/question-analytics.routes';
import adminSeedRoutes from './routes/admin/seed.routes';
import adminRoutes from './routes/admin/admin.routes';
import adminGradingRoutes from './routes/admin/grading.routes';
import adminBulkUploadRoutes from './routes/admin/bulk-upload.routes';
import adminReportsRoutes from './routes/admin/reports.routes';
import authRoutes from './routes/auth/auth.routes';
import templatesRoutes from './routes/templates/templates.routes';
import sessionsRoutes from './routes/sessions/sessions.routes';
import studentsRoutes from './routes/students/students.routes';
import parentsRoutes from './routes/parents/parents.routes';
import teachersRoutes from './routes/teachers/teachers.routes';
import reportRoutes from './routes/report.routes';
import migrationRoutes from './routes/migration.routes';
import englishTestProxyRoutes from './routes/english-test-proxy.routes';

// For Render backend: full paths including /api prefix
app.use(`/api/${env.API_VERSION}/auth`, authRoutes);
app.use(`/api/${env.API_VERSION}/admin/questions`, adminQuestionsRoutes);
app.use(`/api/${env.API_VERSION}/admin/question-analytics`, adminQuestionAnalyticsRoutes);
app.use(`/api/${env.API_VERSION}/admin/seed`, adminSeedRoutes);
app.use(`/api/${env.API_VERSION}/admin/grading`, adminGradingRoutes);
app.use(`/api/${env.API_VERSION}/admin/bulk-upload`, adminBulkUploadRoutes);
app.use(`/api/${env.API_VERSION}/admin/reports`, adminReportsRoutes);
app.use(`/api/${env.API_VERSION}/admin/migrate`, migrationRoutes);
app.use(`/api/${env.API_VERSION}/reports`, reportRoutes);
app.use(`/api/${env.API_VERSION}/admin`, adminRoutes);
app.use(`/api/${env.API_VERSION}/templates`, templatesRoutes);
app.use(`/api/${env.API_VERSION}/sessions`, sessionsRoutes);
app.use(`/api/${env.API_VERSION}/students`, studentsRoutes);
app.use(`/api/${env.API_VERSION}/parents`, parentsRoutes);
app.use(`/api/${env.API_VERSION}/teachers`, teachersRoutes);

// English Test Proxy - Forward to Python backend (no version prefix)
app.use('/api/english-test', englishTestProxyRoutes);

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
