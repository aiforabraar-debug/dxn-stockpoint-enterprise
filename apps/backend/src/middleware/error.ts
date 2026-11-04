/**
 * Global error handling middleware.
 * Catches all unhandled errors and returns standardized JSON responses.
 */

import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { error } from '../utils/response';
import { logger } from '../utils/logger';

export class AppError extends Error {
  public statusCode: number;
  public code: string;
  public details?: any;

  constructor(message: string, statusCode: number = 500, code: string = 'internal_error', details?: any) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    Error.captureStackTrace(this, this.constructor);
  }
}

export function errorHandler(
  err: Error | AppError,
  req: Request,
  res: Response,
  next: NextFunction
): void {
  let statusCode = 500;
  let code = 'internal_error';
  let message = 'Internal server error';
  let details: any = undefined;

  if (err instanceof AppError) {
    statusCode = err.statusCode;
    code = err.code;
    message = err.message;
    details = err.details;
  } else if (err instanceof ZodError) {
    statusCode = 422;
    code = 'validation_error';
    message = 'Validation failed';
    details = err.errors.map((e) => ({
      field: e.path.join('.'),
      message: e.message,
    }));
  } else if (err.name === 'PrismaClientKnownRequestError') {
    // Prisma unique constraint violations
    if ((err as any).code === 'P2002') {
      statusCode = 409;
      code = 'duplicate_record';
      message = 'A record with this value already exists';
    } else if ((err as any).code === 'P2025') {
      statusCode = 404;
      code = 'record_not_found';
      message = 'Record not found';
    }
  } else if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    code = 'token_invalid';
    message = 'Invalid token';
  } else if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    code = 'token_expired';
    message = 'Token has expired';
  }

  // Log the error
  logger.error('Request error', {
    method: req.method,
    path: req.path,
    statusCode,
    code,
    message,
    stack: err.stack,
    ip: req.ip,
  });

  error(res, message, { statusCode, code, details });
}

export function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<void>
) {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}
