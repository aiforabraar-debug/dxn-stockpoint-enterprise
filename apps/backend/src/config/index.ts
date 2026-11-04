/**
 * Centralized configuration with validation.
 * All environment variables are parsed here and exported as a single config object.
 */

import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().transform(Number).default(4000),
  API_BASE_URL: z.string().url().default('http://localhost:4000'),
  FRONTEND_URL: z.string().url().default('http://localhost:5173'),

  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),

  JWT_ACCESS_SECRET: z.string().min(32, 'JWT_ACCESS_SECRET must be at least 32 characters'),
  JWT_REFRESH_SECRET: z.string().min(32, 'JWT_REFRESH_SECRET must be at least 32 characters'),
  JWT_ACCESS_TTL: z.string().default('15m'),
  JWT_REFRESH_TTL: z.string().default('30d'),
  ADMIN_PIN: z.string().min(4, 'ADMIN_PIN must be at least 4 characters').default('2468'),
  ADMIN_API_KEY: z.string().min(1, 'ADMIN_API_KEY is required'),

  BCRYPT_SALT_ROUNDS: z.string().transform(Number).default(12),

  CORS_ORIGINS: z.string().default('http://localhost:5173'),

  LOG_LEVEL: z.enum(['debug', 'info', 'warn', 'error']).default('debug'),

  SOCKET_IO_CORS_ORIGIN: z.string().default('http://localhost:5173'),

  STEADFAST_BASE_URL: z.string().url().optional(),
  STEADFAST_API_KEY: z.string().optional(),
  STEADFAST_SECRET_KEY: z.string().optional(),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('❌ Invalid environment variables:');
  console.error(parsed.error.format());
  process.exit(1);
}

export const config = parsed.data;

export const corsOrigins = config.CORS_ORIGINS.split(',').map((o) => o.trim());
export const isProduction = config.NODE_ENV === 'production';
export const isDevelopment = config.NODE_ENV === 'development';
