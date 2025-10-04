// Server entry point

import { app } from './app';
import { env } from './config/env';
import { connectDatabase, disconnectDatabase } from './config/database';
import { disconnectRedis } from './config/redis';
import { logger } from './config/logger';

const PORT = env.PORT || 3000;

// Start server
async function startServer() {
  try {
    // Connect to database (optional in development)
    try {
      await connectDatabase();
    } catch (dbError) {
      logger.warn('⚠️  Database connection failed. Starting server anyway...');
      logger.warn('Run migration.sql in Supabase SQL Editor to create tables');
    }

    // Start Express server
    const server = app.listen(PORT, () => {
      logger.info(`🚀 Server running on port ${PORT}`);
      logger.info(`📦 Environment: ${env.NODE_ENV}`);
      logger.info(`🌐 API URL: ${env.APP_URL}/api/${env.API_VERSION}`);
    });

    // Graceful shutdown
    const gracefulShutdown = async (signal: string) => {
      logger.info(`\n${signal} received. Starting graceful shutdown...`);

      // Close server
      server.close(async () => {
        logger.info('✅ HTTP server closed');

        // Disconnect database
        await disconnectDatabase();

        // Disconnect Redis
        await disconnectRedis();

        logger.info('👋 Graceful shutdown completed');
        process.exit(0);
      });

      // Force shutdown after 10 seconds
      setTimeout(() => {
        logger.error('⚠️  Forced shutdown after timeout');
        process.exit(1);
      }, 10000);
    };

    // Listen for termination signals
    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));

    // Handle uncaught errors
    process.on('uncaughtException', (error) => {
      logger.error('Uncaught Exception:', error);
      process.exit(1);
    });

    process.on('unhandledRejection', (reason, promise) => {
      logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
      process.exit(1);
    });

  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Start the server
startServer();
