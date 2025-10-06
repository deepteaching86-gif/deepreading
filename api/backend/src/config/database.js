"use strict";
// Database configuration using Prisma
Object.defineProperty(exports, "__esModule", { value: true });
exports.prisma = void 0;
exports.connectDatabase = connectDatabase;
exports.disconnectDatabase = disconnectDatabase;
const client_1 = require("@prisma/client");
const env_1 = require("./env");
const prisma = new client_1.PrismaClient({
    log: env_1.env.NODE_ENV === 'development'
        ? ['query', 'error', 'warn']
        : ['error'],
    errorFormat: 'pretty',
});
exports.prisma = prisma;
// Connection test
async function connectDatabase() {
    try {
        await prisma.$connect();
        console.log('✅ Database connected successfully');
    }
    catch (error) {
        console.error('❌ Database connection failed:', error);
        process.exit(1);
    }
}
// Graceful shutdown
async function disconnectDatabase() {
    await prisma.$disconnect();
    console.log('📦 Database disconnected');
}
