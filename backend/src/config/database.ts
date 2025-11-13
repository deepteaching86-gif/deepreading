// Database configuration using Prisma

import { PrismaClient } from '@prisma/client';
import { env } from './env';

const prisma = new PrismaClient({
  log: env.NODE_ENV === 'development'
    ? ['query', 'error', 'warn']
    : ['error'],
  errorFormat: 'pretty',
});

// Connection test
export async function connectDatabase(): Promise<void> {
  try {
    await prisma.$connect();
    console.log('✅ Database connected successfully');
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    throw error;  // Throw error instead of exiting to allow graceful handling
  }
}

// Graceful shutdown
export async function disconnectDatabase(): Promise<void> {
  await prisma.$disconnect();
  console.log('📦 Database disconnected');
}

export { prisma };
