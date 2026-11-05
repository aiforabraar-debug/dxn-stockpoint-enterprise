/**
 * Standardized API response helpers.
 * Every endpoint returns { success, data?, error?, meta? }
 */

import { Response } from 'express';

interface Meta {
  page?: number;
  limit?: number;
  total?: number;
  revision?: number;
  hasMore?: boolean;
}

export function success<T>(
  res: Response,
  data: T,
  options?: { statusCode?: number; message?: string; meta?: Meta }
): Response {
  return res.status(options?.statusCode ?? 200).json({
    success: true,
    ...(options?.message ? { message: options.message } : {}),
    data,
    ...(options?.meta ? { meta: options.meta } : {}),
  });
}

export function error(
  res: Response,
  message: string,
  options?: { statusCode?: number; code?: string; details?: any }
): Response {
  return res.status(options?.statusCode ?? 500).json({
    success: false,
    error: {
      message,
      ...(options?.code ? { code: options.code } : {}),
      ...(options?.details !== undefined ? { details: options.details } : {}),
    },
  });
}

export function paginated<T>(
  res: Response,
  data: T[],
  meta: { page: number; limit: number; total: number },
  options?: { statusCode?: number; message?: string }
): Response {
  return success(res, data, {
    statusCode: options?.statusCode,
    message: options?.message,
    meta: {
      page: meta.page,
      limit: meta.limit,
      total: meta.total,
      hasMore: meta.page * meta.limit < meta.total,
    },
  });
}
