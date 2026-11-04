/**
 * Order validation schemas.
 */

import { z } from 'zod';

const orderItemSchema = z.object({
  product_id: z.string().uuid('Invalid product ID'),
  quantity: z.number().int().positive('Quantity must be positive'),
});

export const createOrderSchema = z.object({
  body: z.object({
    client_uuid: z.string().uuid().optional(),
    customer_name: z.string().min(1, 'Customer name is required').max(160),
    customer_phone: z.string().max(40).optional().nullable(),
    dxn_member_id: z.string().max(40).optional().nullable(),
    is_member: z.boolean().default(false),
    payment_method: z.enum(['CASH', 'BKASH', 'NAGAD', 'CARD', 'BANK_TRANSFER']).default('CASH'),
    discount: z.preprocess(
      (val) => (val === '' || val === undefined ? 0 : Number(val)),
      z.number().min(0, 'Discount must be non-negative').default(0)
    ),
    note: z.string().max(500).optional().nullable(),
    source: z.enum(['WEB', 'ANDROID', 'ADMIN']).default('WEB'),
    items: z.array(orderItemSchema).min(1, 'At least one item is required'),
  }),
});

export const updateOrderStatusSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid order ID'),
  }),
  body: z.object({
    status: z.enum(['PENDING', 'CONFIRMED', 'PACKED', 'DELIVERED', 'CANCELLED']),
  }),
});

export const orderIdParams = z.object({
  params: z.object({
    id: z.string().uuid('Invalid order ID'),
  }),
});

export const orderQuerySchema = z.object({
  query: z.object({
    status: z.enum(['PENDING', 'CONFIRMED', 'PACKED', 'DELIVERED', 'CANCELLED']).optional(),
    search: z.string().optional(),
    page: z.preprocess((val) => (val ? Number(val) : 1), z.number().int().min(1)).default(1),
    limit: z.preprocess((val) => (val ? Number(val) : 50), z.number().int().min(1).max(100)).default(50),
  }),
});

export const receiptIdParams = z.object({
  params: z.object({
    id: z.string().uuid('Invalid order ID'),
  }),
});
