/**
 * Product service — CRUD, stock adjustments, inventory queries.
 */

import { prisma } from '../config/database';
import { AppError } from '../middleware/error';

export async function listProducts(shopId: string, filters: {
  category?: string;
  search?: string;
  is_active?: boolean;
  page: number;
  limit: number;
}) {
  const where: any = { shopId };

  if (filters.category) where.category = filters.category;
  if (filters.search) {
    where.OR = [
      { name: { contains: filters.search, mode: 'insensitive' } },
      { sku: { contains: filters.search, mode: 'insensitive' } },
      { category: { contains: filters.search, mode: 'insensitive' } },
    ];
  }
  if (filters.is_active !== undefined) where.is_active = filters.is_active;

  const [products, total] = await Promise.all([
    prisma.product.findMany({
      where,
      orderBy: [{ category: 'asc' }, { name: 'asc' }],
      skip: (filters.page - 1) * filters.limit,
      take: filters.limit,
    }),
    prisma.product.count({ where }),
  ]);

  return { products, total, page: filters.page, limit: filters.limit };
}

export async function getProduct(shopId: string, id: string) {
  const product = await prisma.product.findFirst({
    where: { id, shopId },
  });

  if (!product) {
    throw new AppError('Product not found', 404, 'product_not_found');
  }

  return product;
}

export async function createProduct(shopId: string, data: any) {
  // Check SKU uniqueness within shop
  const existing = await prisma.product.findFirst({
    where: { shopId, sku: data.sku },
  });
  if (existing) {
    throw new AppError('SKU already exists', 409, 'duplicate_sku');
  }

  const product = await prisma.product.create({
    data: {
      shopId,
      sku: data.sku,
      name: data.name,
      category: data.category || 'General',
      description: data.description || null,
      retail_price: data.retail_price || 0,
      member_price: data.member_price || 0,
      pv_points: data.pv_points || 0,
      stock_qty: data.stock_qty || 0,
      low_stock_at: data.low_stock_at || 5,
      image_url: data.image_url || null,
      is_active: data.is_active !== false,
      revision: 0,
    },
  });

  // Create initial stock movement if opening stock > 0
  if ((data.stock_qty || 0) > 0) {
    await prisma.stockMovement.create({
      data: {
        shopId,
        productId: product.id,
        reason: 'DELIVERY',
        delta: data.stock_qty,
        quantity_after: data.stock_qty,
        reference: 'opening_stock',
      },
    });
  }

  return product;
}

export async function updateProduct(shopId: string, id: string, data: any) {
  const product = await prisma.product.findFirst({
    where: { id, shopId },
  });

  if (!product) {
    throw new AppError('Product not found', 404, 'product_not_found');
  }

  const updated = await prisma.product.update({
    where: { id },
    data: {
      ...(data.name !== undefined && { name: data.name }),
      ...(data.category !== undefined && { category: data.category }),
      ...(data.description !== undefined && { description: data.description }),
      ...(data.retail_price !== undefined && { retail_price: data.retail_price }),
      ...(data.member_price !== undefined && { member_price: data.member_price }),
      ...(data.pv_points !== undefined && { pv_points: data.pv_points }),
      ...(data.low_stock_at !== undefined && { low_stock_at: data.low_stock_at }),
      ...(data.image_url !== undefined && { image_url: data.image_url }),
      ...(data.is_active !== undefined && { is_active: data.is_active }),
      revision: { increment: 1 },
    },
  });

  return updated;
}

export async function archiveProduct(shopId: string, id: string) {
  const product = await prisma.product.findFirst({
    where: { id, shopId },
  });

  if (!product) {
    throw new AppError('Product not found', 404, 'product_not_found');
  }

  return prisma.product.update({
    where: { id },
    data: { is_active: false, revision: { increment: 1 } },
  });
}

export async function restoreProduct(shopId: string, id: string) {
  const product = await prisma.product.findFirst({
    where: { id, shopId },
  });

  if (!product) {
    throw new AppError('Product not found', 404, 'product_not_found');
  }

  return prisma.product.update({
    where: { id },
    data: { is_active: true, revision: { increment: 1 } },
  });
}

export async function adjustStock(shopId: string, productId: string, data: { delta: number; reason: string; reference?: string }) {
  const product = await prisma.product.findFirst({
    where: { id: productId, shopId },
  });

  if (!product) {
    throw new AppError('Product not found', 404, 'product_not_found');
  }

  const newQty = Math.max(0, product.stock_qty + data.delta);

  const result = await prisma.$transaction([
    prisma.product.update({
      where: { id: productId },
      data: {
        stock_qty: newQty,
        revision: { increment: 1 },
      },
    }),
    prisma.stockMovement.create({
      data: {
        shopId,
        productId,
        reason: data.reason as any,
        delta: data.delta,
        quantity_after: newQty,
        reference: data.reference,
      },
    }),
  ]);

  return { product: result[0], movement: result[1] };
}

export async function stockTake(shopId: string, productId: string, quantity: number) {
  const product = await prisma.product.findFirst({
    where: { id: productId, shopId },
  });

  if (!product) {
    throw new AppError('Product not found', 404, 'product_not_found');
  }

  const delta = quantity - product.stock_qty;

  const result = await prisma.$transaction([
    prisma.product.update({
      where: { id: productId },
      data: {
        stock_qty: quantity,
        revision: { increment: 1 },
      },
    }),
    prisma.stockMovement.create({
      data: {
        shopId,
        productId,
        reason: 'STOCK_TAKE',
        delta,
        quantity_after: quantity,
        reference: 'stock_take',
      },
    }),
  ]);

  return { product: result[0], movement: result[1] };
}

export async function getStockMovements(shopId: string, limit = 100) {
  return prisma.stockMovement.findMany({
    where: { shopId },
    include: { product: { select: { name: true, sku: true } } },
    orderBy: { created_at: 'desc' },
    take: limit,
  });
}

export async function getCategories(shopId: string) {
  const categories = await prisma.product.findMany({
    where: { shopId, is_active: true },
    select: { category: true },
    distinct: ['category'],
    orderBy: { category: 'asc' },
  });

  return categories.map((c) => c.category);
}

export const productService = {
  listProducts,
  getProduct,
  createProduct,
  updateProduct,
  archiveProduct,
  restoreProduct,
  adjustStock,
  stockTake,
  getStockMovements,
  getCategories,
};
