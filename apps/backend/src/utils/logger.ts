/**
 * Structured logging with Winston.
 * Logs to console in all environments, plus a file in production.
 */

import winston from 'winston';
import path from 'path';
import fs from 'fs';
import { config } from '../config';

const logDir = path.join(process.cwd(), 'logs');
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss.SSS' }),
  winston.format.errors({ stack: true }),
  winston.format.json()
);

const consoleFormat = winston.format.combine(
  winston.format.colorize({ all: true }),
  winston.format.timestamp({ format: 'HH:mm:ss' }),
  winston.format.printf(({ timestamp, level, message, stack, ...meta }) => {
    const metaStr = Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : '';
    return stack
      ? `[${timestamp}] ${level}: ${message}\n${stack}${metaStr}`
      : `[${timestamp}] ${level}: ${message}${metaStr}`;
  })
);

const transports: winston.transport[] = [
  new winston.transports.Console({
    level: config.LOG_LEVEL,
    format: consoleFormat,
  }),
];

if (config.NODE_ENV === 'production') {
  transports.push(
    new winston.transports.File({
      filename: path.join(logDir, 'error.log'),
      level: 'error',
      format: logFormat,
    }),
    new winston.transports.File({
      filename: path.join(logDir, 'combined.log'),
      format: logFormat,
    })
  );
}

export const logger = winston.createLogger({
  level: config.LOG_LEVEL,
  format: logFormat,
  transports,
  exitOnError: false,
});

export const requestLogger = (req: any, res: any, next: any) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    logger.info('HTTP request', {
      method: req.method,
      path: req.path,
      status: res.statusCode,
      duration_ms: duration,
      ip: req.ip,
      userAgent: req.get('user-agent'),
    });
  });
  next();
};
