/**
 * Health controller — health check, version, database connectivity.
 */

import { Request, Response } from 'express';
import { asyncHandler } from '../middleware/error';
import { prisma } from '../config/database';
import { success } from '../utils/response';

export class HealthController {
  health = asyncHandler(async (_req: Request, res: Response) => {
    // Check database connectivity
    await prisma.$queryRaw`SELECT 1`;

    success(res, {
      status: 'ok',
      version: '2.0.0',
      service: 'dxn-stockpoint-api',
      timestamp: new Date().toISOString(),
      database: 'connected',
    }, { message: 'Service is healthy' });
  });

  healthz = asyncHandler(async (_req: Request, res: Response) => {
    // Lightweight health check without database for load balancers
    success(res, {
      status: 'ok',
      service: 'dxn-stockpoint-api',
      timestamp: new Date().toISOString(),
    });
  });
}

export const healthController = new HealthController();
