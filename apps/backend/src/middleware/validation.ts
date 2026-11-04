/**
 * Request validation middleware using Zod schemas.
 * Validates body, query, and params.
 */

import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodTypeAny } from 'zod';
import { error } from '../utils/response';

type ValidationTarget = 'body' | 'query' | 'params';

export function validate(schema: Record<ValidationTarget, ZodTypeAny>) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const results: Record<string, any> = {};
    const errors: Array<{ field: string; message: string }> = [];

    for (const [target, zodSchema] of Object.entries(schema)) {
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

    // Attach validated data to request
    if (results.body) req.body = results.body;
    if (results.query) req.query = results.query as any;
    if (results.params) req.params = results.params as any;

    next();
  };
}
