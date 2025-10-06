"use strict";
// Express application setup
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.app = void 0;
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const env_1 = require("./config/env");
const error_handler_1 = require("./common/middleware/error-handler");
const logger_1 = require("./config/logger");
// Create Express app
const app = (0, express_1.default)();
exports.app = app;
// Trust Vercel proxy
app.set('trust proxy', 1);
// ===== Middleware =====
// Security
app.use((0, helmet_1.default)());
// CORS
app.use((0, cors_1.default)({
    origin: env_1.env.CORS_ORIGIN,
    credentials: true,
}));
// Body parsing
app.use(express_1.default.json({ limit: '10mb' }));
app.use(express_1.default.urlencoded({ extended: true, limit: '10mb' }));
// Rate limiting
const limiter = (0, express_rate_limit_1.default)({
    windowMs: env_1.env.RATE_LIMIT_WINDOW_MS,
    max: env_1.env.RATE_LIMIT_MAX_REQUESTS,
    message: 'Too many requests from this IP, please try again later.',
    standardHeaders: true,
    legacyHeaders: false,
});
app.use(`/api/${env_1.env.API_VERSION}/`, limiter);
// HTTP request logging (using Morgan with Winston)
if (env_1.env.NODE_ENV !== 'test') {
    const morgan = require('morgan');
    app.use(morgan('combined', { stream: logger_1.httpLogStream }));
}
// ===== Routes =====
// Health check
app.get('/health', (_req, res) => {
    res.status(200).json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        environment: env_1.env.NODE_ENV,
        version: env_1.env.API_VERSION,
    });
});
// API routes
const questions_routes_1 = __importDefault(require("./routes/admin/questions.routes"));
const auth_routes_1 = __importDefault(require("./routes/auth/auth.routes"));
app.use(`/api/${env_1.env.API_VERSION}/auth`, auth_routes_1.default);
app.use(`/api/${env_1.env.API_VERSION}/admin/questions`, questions_routes_1.default);
// 404 handler
app.use((req, res) => {
    res.status(404).json({
        error: 'Not Found',
        message: `Cannot ${req.method} ${req.path}`,
        path: req.path,
    });
});
// Error handler (must be last)
app.use(error_handler_1.errorHandler);
