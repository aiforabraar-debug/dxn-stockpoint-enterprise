/**
 * Request validation middleware using Zod schemas.
 * Validates body, query, and params.
 */

import { Request, Response, NextFunction } from 'express';
import { ZodSchema } from 'zod';
import { error } from '../utils/response';

export function validate(schema: any) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (schema && typeof schema.safeParse === 'function') {
      const result = schema.safeParse({
        body: req.body,
        query: req.query,
        params: req.params,
      });

      if (!result.success) {
        const errors = result.error.errors.map((issue: any) => ({
          field: issue.path.join('.'),
          message: issue.message,
        }));

        error(res, 'Validation failed', {
          statusCode: 422,
          code: 'validation_error',
          details: errors,
        });
        return;
      }

      if (result.data.body) req.body = result.data.body;
      if (result.data.query) req.query = result.data.query as any;
      if (result.data.params) req.params = result.data.params as any;
      return next();
    }

    const results: Record<string, any> = {};
    const errors: Array<{ field: string; message: string }> = [];

    for (const [target, zodSchema] of Object.entries(schema || {})) {
      const source = req[target as keyof Request] as Record<string, unknown>;
      const result = (zodSchema as ZodSchema).safeParse(source);

      if (!result.success) {
        for (const issue of result.error.errors) {
          errors.push({
            field: issue.path.join('.'),
            message: issue.message,
          });
        }
      } else {
        results[target] = result.data;
      }
    }

    if (errors.length > 0) {
      error(res, 'Validation failed', {
        statusCode: 422,
        code: 'validation_error',
        details: errors,
      });
      return;
    }

    if (results.body) req.body = results.body;
    if (results.query) req.query = results.query as any;
    if (results.params) req.params = results.params as any;

    next();
  };
}
