/**
 * Authentication middleware.
 * Supports Bearer JWT tokens and X-Api-Key for machine-to-machine access.
 */

import { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/database';
import { verifyAccessToken } from '../utils/auth';
import { error } from '../utils/response';
import { config } from '../config';
import { logger } from '../utils/logger';

export interface AuthenticatedRequest extends Request {
  user?: {
    userId: string;
    shopId: string;
    role: string;
    email: string;
  };
  shop?: any;
}

/**
 * Require a valid JWT access token. Sets req.user and req.shop.
 */
export function requireAuth(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    error(res, 'Authentication required', {
      statusCode: 401,
      code: 'unauthorized',
    });
    return;
  }

  const token = authHeader.slice(7);
  const payload = verifyAccessToken(token);

  if (!payload) {
    error(res, 'Invalid or expired token', {
      statusCode: 401,
      code: 'token_invalid',
    });
    return;
  }

  req.user = {
    userId: payload.userId,
    shopId: payload.shopId,
    role: payload.role,
    email: payload.email,
  };

  next();
}

/**
 * Optional auth — sets req.user if a valid token is present, but doesn't require it.
 */
export function optionalAuth(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void {
  const authHeader = req.headers.authorization;

  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.slice(7);
    const payload = verifyAccessToken(token);
    if (payload) {
      req.user = {
        userId: payload.userId,
        shopId: payload.shopId,
        role: payload.role,
        email: payload.email,
      };
    }
  }

  next();
}

/**
 * Require admin role.
 */
export function requireAdmin(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void {
  if (!req.user) {
    error(res, 'Authentication required', {
      statusCode: 401,
      code: 'unauthorized',
    });
    return;
  }

  if (req.user.role !== 'admin') {
    error(res, 'Admin access required', {
      statusCode: 403,
      code: 'forbidden',
    });
    return;
  }

  next();
}

/**
 * Require shop context — loads the shop based on the user's shopId.
 */
export function requireShop(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void {
  if (!req.user) {
    error(res, 'Authentication required', {
      statusCode: 401,
      code: 'unauthorized',
    });
    return;
  }

  (async () => {
    try {
      const shop = await prisma.shop.findUnique({
        where: { id: req.user!.shopId },
        select: {
          id: true,
          name: true,
          slug: true,
          currency: true,
          low_stock_threshold: true,
          allow_public_orders: true,
          is_active: true,
        },
      });

      if (!shop || !shop.is_active) {
        error(res, 'Shop not found or inactive', {
          statusCode: 404,
          code: 'shop_not_found',
        });
        return;
      }

      req.shop = shop;
      next();
    } catch (err) {
      logger.error('Error loading shop', { error: err, shopId: req.user!.shopId });
      error(res, 'Internal server error', {
        statusCode: 500,
        code: 'internal_error',
      });
    }
  })();
}

/**
 * API key auth for machine-to-machine access (scripts, CI, health checks).
 */
export function requireApiKey(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const apiKey = req.headers['x-api-key'];

  if (!apiKey || Array.isArray(apiKey) || apiKey !== config.ADMIN_API_KEY) {
    error(res, 'Invalid or missing API key', {
      statusCode: 401,
      code: 'invalid_api_key',
    });
    return;
  }

  next();
}
