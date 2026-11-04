/**
 * Authentication validation schemas.
 */

import { z } from 'zod';

export const loginSchema = z.object({
  body: z.object({
    pin: z.string().min(4, 'PIN must be at least 4 characters').max(64),
  }),
});

export const changePinSchema = z.object({
  body: z.object({
    current_pin: z.string().min(4, 'Current PIN is required'),
    new_pin: z.string().min(4, 'New PIN must be at least 4 characters').max(64),
  }),
});

export const refreshTokenSchema = z.object({
  body: z.object({
    refresh_token: z.string().min(1, 'Refresh token is required'),
  }),
});

export const registerUserSchema = z.object({
  body: z.object({
    email: z.string().email('Invalid email address'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    full_name: z.string().min(1, 'Full name is required').max(120),
    role: z.enum(['admin', 'cashier', 'viewer']).default('cashier'),
  }),
});

export const loginUserSchema = z.object({
  body: z.object({
    email: z.string().email('Invalid email address'),
    password: z.string().min(1, 'Password is required'),
  }),
});
