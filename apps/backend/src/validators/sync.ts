/**
 * Sync validation schemas.
 */

import { z } from 'zod';

export const syncQuerySchema = z.object({
  query: z.object({
    since: z.preprocess(
      (val) => (val === undefined ? 0 : Number(val)),
      z.number().int().min(0).default(0)
    ),
  }),
});

export const outboxOrderSchema = z.object({
  body: z.object({
    client_uuid: z.string().uuid(),
    customer_name: z.string().min(1).max(160),
    customer_phone: z.string().max(40).optional().nullable(),
    dxn_member_id: z.string().max(40).optional().nullable(),
    is_member: z.boolean().default(false),
    payment_method: z.enum(['CASH', 'BKASH', 'NAGAD', 'CARD', 'BANK_TRANSFER']).default('CASH'),
    discount: z.number().min(0).default(0),
    note: z.string().max(500).optional().nullable(),
    source: z.enum(['WEB', 'ANDROID', 'ADMIN']).default('WEB'),
    items: z.array(
      z.object({
        product_id: z.string().uuid(),
        product_sku: z.string().max(64),
        quantity: z.number().int().positive(),
        unit_price: z.number().min(0),
        unit_pv: z.number().min(0),
      })
    ).min(1),
  }),
});
