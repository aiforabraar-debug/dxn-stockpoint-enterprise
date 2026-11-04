/**
 * Product validation schemas.
 */

import { z } from 'zod';

const priceSchema = z
  .preprocess(
    (val) => (val === '' || val === undefined ? 0 : Number(val)),
    z.number().min(0, 'Price must be non-negative')
  );

export const createProductSchema = z.object({
  body: z.object({
    sku: z.string().min(1, 'SKU is required').max(64, 'SKU too long'),
    name: z.string().min(1, 'Name is required').max(160, 'Name too long'),
    category: z.string().min(1, 'Category is required').max(64),
    description: z.string().max(1000).optional().nullable(),
    retail_price: priceSchema.default(0),
    member_price: priceSchema.default(0),
    pv_points: priceSchema.default(0),
    stock_qty: z.preprocess(
      (val) => (val === '' || val === undefined ? 0 : Number(val)),
      z.number().int().min(0, 'Stock quantity must be non-negative')
    ).default(0),
    low_stock_at: z.preprocess(
      (val) => (val === '' || val === undefined ? 5 : Number(val)),
      z.number().int().min(0)
    ).default(5),
    image_url: z.string().url('Invalid image URL').max(500).optional().nullable(),
    is_active: z.boolean().default(true),
  }),
});

export const updateProductSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid product ID'),
  }),
  body: z.object({
    name: z.string().min(1).max(160).optional(),
    category: z.string().min(1).max(64).optional(),
    description: z.string().max(1000).optional().nullable(),
    retail_price: priceSchema.optional(),
    member_price: priceSchema.optional(),
    pv_points: priceSchema.optional(),
    stock_qty: z
      .number()
      .int()
      .min(0)
      .optional(),
    low_stock_at: z.number().int().min(0).optional(),
    image_url: z.string().url().max(500).optional().nullable(),
    is_active: z.boolean().optional(),
  }),
});

export const productIdParams = z.object({
  params: z.object({
    id: z.string().uuid('Invalid product ID'),
  }),
});

export const stockAdjustSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid product ID'),
  }),
  body: z.object({
    delta: z.number().int('Delta must be an integer'),
    reason: z
      .enum(['SALE', 'DELIVERY', 'ADJUSTMENT', 'DAMAGED', 'RETURN', 'SAMPLE', 'STOCK_TAKE'])
      .default('ADJUSTMENT'),
    reference: z.string().max(128).optional(),
  }),
});

export const stockTakeSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid product ID'),
  }),
  body: z.object({
    quantity: z.number().int().min(0, 'Quantity must be non-negative'),
    reason: z.string().default('STOCK_TAKE'),
  }),
});

export const productQuerySchema = z.object({
  query: z.object({
    category: z.string().optional(),
    search: z.string().optional(),
    is_active: z.preprocess((val) => val === 'true' || val === true, z.boolean()).optional(),
    page: z.preprocess((val) => (val ? Number(val) : 1), z.number().int().min(1)).default(1),
    limit: z.preprocess((val) => (val ? Number(val) : 50), z.number().int().min(1).max(100)).default(50),
  }),
});
