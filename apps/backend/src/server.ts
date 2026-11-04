/**
 * DXN Stockpoint Enterprise — Express server entry point.
 * Initializes middleware, routes, error handling, and starts the HTTP server.
 */

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import { config, corsOrigins, isProduction } from './config';
import { logger, requestLogger } from './utils/logger';
import { errorHandler, AppError } from './middleware/error';
import apiRouter from './routes';

const app = express();

// ─── Trust proxy (for accurate IP addresses behind load balancers) ───────────
app.set('trust proxy', true);

// ─── Security middleware ─────────────────────────────────────────────────────
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  contentSecurityPolicy: isProduction ? undefined : false, // disable CSP in dev for ease
}));

// CORS
app.use(cors({
  origin: corsOrigins,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Api-Key', 'X-Requested-With'],
  credentials: true,
  maxAge: 86400,
}));

// ─── Body parsing ────────────────────────────────────────────────────────────
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// ─── Request logging ─────────────────────────────────────────────────────────
app.use(morgan('combined', {
  stream: { write: (msg) => logger.http(msg.trim()) },
}));
app.use(requestLogger);

// ─── Health check (no middleware) ────────────────────────────────────────────
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'dxn-stockpoint-api', timestamp: new Date().toISOString() });
});

// ─── API routes ──────────────────────────────────────────────────────────────
app.use('/api/v1', apiRouter);

// ─── 404 handler ─────────────────────────────────────────────────────────────
app.use((_req, _res, next) => {
  next(new AppError('Route not found', 404, 'route_not_found'));
});

// ─── Global error handler ────────────────────────────────────────────────────
app.use(errorHandler);

// ─── Start server ────────────────────────────────────────────────────────────
const server = app.listen(config.PORT, () => {
  logger.info('DXN Stockpoint API server started', {
    port: config.PORT,
    env: config.NODE_ENV,
    timestamp: new Date().toISOString(),
  });
});

// Graceful shutdown
const shutdown = (signal: string) => {
  logger.info(`Received ${signal}, shutting down gracefully...`);
  server.close(() => {
    logger.info('HTTP server closed');
    process.exit(0);
  });
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

// Handle unhandled rejections
process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at', { promise, reason });
});

process.on('uncaughtException', (err) => {
  logger.error('Uncaught Exception', { error: err.message, stack: err.stack });
  process.exit(1);
});

export default app;
