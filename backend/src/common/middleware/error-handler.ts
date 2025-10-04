// Global error handler middleware

import { Request, Response, NextFunction } from 'express';
import { Prisma } from '@prisma/client';
import { ZodError } from 'zod';
import { logger } from '@/config/logger';
import { env } from '@/config/env';

export class AppError extends Error {
  constructor(
    public statusCode: number,
    public message: string,
    public isOperational = true
  ) {
    super(message);
    Object.setPrototypeOf(this, AppError.prototype);
    Error.captureStackTrace(this, this.constructor);
  }
}

export function errorHandler(
  error: Error,
  req: Request,
  res: Response,
  next: NextFunction
) {
  // Log error
  logger.error('Error occurred:', {
    message: error.message,
    stack: error.stack,
    path: req.path,
    method: req.method,
  });

  // Default error response
  let statusCode = 500;
  let message = 'Internal Server Error';
  let errors: any[] | undefined;

  // Handle specific error types

  // App Error
  if (error instanceof AppError) {
    statusCode = error.statusCode;
    message = error.message;
  }

  // Prisma errors
  else if (error instanceof Prisma.PrismaClientKnownRequestError) {
    statusCode = 400;

    switch (error.code) {
      case 'P2002':
        // Unique constraint violation
        const field = (error.meta?.target as string[])?.[0] || 'field';
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
  else if (error instanceof Prisma.PrismaClientValidationError) {
    statusCode = 400;
    message = 'Invalid data provided';
  }

  // Zod validation errors
  else if (error instanceof ZodError) {
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
    ...(env.NODE_ENV === 'development' && {
      stack: error.stack,
      details: error.message,
    }),
  });
}

// Async handler wrapper
export function asyncHandler(fn: Function) {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}
