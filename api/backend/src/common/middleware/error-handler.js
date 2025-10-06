"use strict";
// Global error handler middleware
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppError = void 0;
exports.errorHandler = errorHandler;
exports.asyncHandler = asyncHandler;
const client_1 = require("@prisma/client");
const zod_1 = require("zod");
const logger_1 = require("../../config/logger");
const env_1 = require("../../config/env");
class AppError extends Error {
    constructor(statusCode, message, isOperational = true) {
        super(message);
        this.statusCode = statusCode;
        this.message = message;
        this.isOperational = isOperational;
        Object.setPrototypeOf(this, AppError.prototype);
        Error.captureStackTrace(this, this.constructor);
    }
}
exports.AppError = AppError;
function errorHandler(error, req, res, _next) {
    // Log error
    logger_1.logger.error('Error occurred:', {
        message: error.message,
        stack: error.stack,
        path: req.path,
        method: req.method,
    });
    // Default error response
    let statusCode = 500;
    let message = 'Internal Server Error';
    let errors;
    // Handle specific error types
    // App Error
    if (error instanceof AppError) {
        statusCode = error.statusCode;
        message = error.message;
    }
    // Prisma errors
    else if (error instanceof client_1.Prisma.PrismaClientKnownRequestError) {
        statusCode = 400;
        switch (error.code) {
            case 'P2002':
                // Unique constraint violation
                const field = error.meta?.target?.[0] || 'field';
                message = `${field} already exists`;
                break;
            case 'P2025':
                // Record not found
                message = 'Record not found';
                statusCode = 404;
                break;
            case 'P2003':
                // Foreign key constraint failed
                message = 'Related record not found';
                statusCode = 404;
                break;
            default:
                message = 'Database error occurred';
        }
    }
    // Prisma validation error
    else if (error instanceof client_1.Prisma.PrismaClientValidationError) {
        statusCode = 400;
        message = 'Invalid data provided';
    }
    // Zod validation errors
    else if (error instanceof zod_1.ZodError) {
        statusCode = 400;
        message = 'Validation failed';
        errors = error.errors.map((err) => ({
            path: err.path.join('.'),
            message: err.message,
        }));
    }
    // JWT errors
    else if (error.name === 'JsonWebTokenError') {
        statusCode = 401;
        message = 'Invalid token';
    }
    else if (error.name === 'TokenExpiredError') {
        statusCode = 401;
        message = 'Token expired';
    }
    // Send error response
    res.status(statusCode).json({
        error: message,
        ...(errors && { errors }),
        ...(env_1.env.NODE_ENV === 'development' && {
            stack: error.stack,
            details: error.message,
        }),
    });
}
// Async handler wrapper
function asyncHandler(fn) {
    return (req, res, next) => {
        Promise.resolve(fn(req, res, next)).catch(next);
    };
}
