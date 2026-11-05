/**
 * Settings validation schemas.
 */

import { z } from 'zod';

export const updateShopSettingsSchema = z.object({
  body: z.object({
    name: z.string().min(1).max(120).optional(),
    whatsapp_number: z.string().max(40).optional().nullable(),
    currency: z.string().min(3).max(8).optional(),
    low_stock_threshold: z.preprocess(
      (val) => (val === '' || val === undefined ? 5 : Number(val)),
      z.number().int().min(0).default(5)
    ),
    business_phone: z.string().max(40).optional().nullable(),
    business_address: z.string().max(200).optional().nullable(),
    receipt_footer: z.string().max(300).optional().nullable(),
    allow_public_orders: z.boolean().optional(),
  }),
});

export const changeShopPinSchema = z.object({
  body: z.object({
    new_pin: z.string().min(4, 'PIN must be at least 4 characters').max(64),
  }),
});

export const courierSettingsSchema = z.object({
  body: z.object({
    base_url: z.string().url('Invalid base URL'),
    api_key: z.string().min(1, 'API key is required'),
    secret_key: z.string().min(1, 'Secret key is required'),
    webhook_token: z.string().optional().nullable(),
  }),
});

export { syncQuerySchema } from './sync';
