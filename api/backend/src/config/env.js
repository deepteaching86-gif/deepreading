"use strict";
// Environment variable configuration
Object.defineProperty(exports, "__esModule", { value: true });
exports.env = void 0;
const dotenv_1 = require("dotenv");
const zod_1 = require("zod");
(0, dotenv_1.config)();
const envSchema = zod_1.z.object({
    // Server
    NODE_ENV: zod_1.z.enum(['development', 'production', 'test']).default('development'),
    PORT: zod_1.z.string().transform(Number).default('3000'),
    API_VERSION: zod_1.z.string().default('v1'),
    // Database (Prisma uses Supabase PostgreSQL)
    DATABASE_URL: zod_1.z.string().url(),
    // Supabase
    SUPABASE_URL: zod_1.z.string().url(),
    SUPABASE_ANON_KEY: zod_1.z.string().min(1),
    SUPABASE_SERVICE_ROLE_KEY: zod_1.z.string().min(1).optional(),
    // Redis (Optional for caching)
    REDIS_HOST: zod_1.z.string().default('localhost'),
    REDIS_PORT: zod_1.z.string().transform(Number).default('6379'),
    REDIS_PASSWORD: zod_1.z.string().optional(),
    // JWT
    JWT_SECRET: zod_1.z.string().min(32),
    JWT_ACCESS_EXPIRY: zod_1.z.string().default('15m'),
    JWT_REFRESH_EXPIRY: zod_1.z.string().default('7d'),
    // Bcrypt
    BCRYPT_ROUNDS: zod_1.z.string().transform(Number).default('10'),
    // CORS
    CORS_ORIGIN: zod_1.z.string().default('http://localhost:3001'),
    // Rate Limiting
    RATE_LIMIT_WINDOW_MS: zod_1.z.string().transform(Number).default('900000'),
    RATE_LIMIT_MAX_REQUESTS: zod_1.z.string().transform(Number).default('100'),
    // File Upload
    MAX_FILE_SIZE: zod_1.z.string().transform(Number).default('10485760'),
    UPLOAD_PATH: zod_1.z.string().default('./uploads'),
    // AWS S3 (Optional)
    AWS_ACCESS_KEY_ID: zod_1.z.string().optional(),
    AWS_SECRET_ACCESS_KEY: zod_1.z.string().optional(),
    AWS_REGION: zod_1.z.string().default('ap-northeast-2'),
    AWS_S3_BUCKET: zod_1.z.string().optional(),
    // Email (Optional)
    SMTP_HOST: zod_1.z.string().optional(),
    SMTP_PORT: zod_1.z.string().transform(Number).optional(),
    SMTP_USER: zod_1.z.string().optional(),
    SMTP_PASSWORD: zod_1.z.string().optional(),
    EMAIL_FROM: zod_1.z.string().email().optional(),
    // Logging
    LOG_LEVEL: zod_1.z.enum(['error', 'warn', 'info', 'http', 'verbose', 'debug']).default('info'),
    LOG_FILE_PATH: zod_1.z.string().default('./logs'),
    // Application
    APP_NAME: zod_1.z.string().default('Literacy Assessment System'),
    APP_URL: zod_1.z.string().url().default('http://localhost:3000'),
    FRONTEND_URL: zod_1.z.string().url().default('http://localhost:3001'),
});
let env;
try {
    exports.env = env = envSchema.parse(process.env);
}
catch (error) {
    if (error instanceof zod_1.z.ZodError) {
        console.error('❌ Invalid environment variables:', error.flatten().fieldErrors);
        process.exit(1);
    }
    throw error;
}
