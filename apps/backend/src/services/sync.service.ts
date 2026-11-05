/**
 * Sync service — revision-based change feed for offline-first clients.
 */

import { prisma } from '../config/database';

export async function getSyncFeed(shopId: string, sinceRevision: number) {
  // Products changed since the given revision
  const products = await prisma.product.findMany({
    where: {
      shopId,
      revision: { gt: sinceRevision },
    },
    orderBy: { revision: 'asc' },
    take: 500,
  });

  // Orders changed since the given revision
  const orders = await prisma.order.findMany({
    where: {
      shopId,
      revision: { gt: sinceRevision },
    },
    include: {
      items: { orderBy: { id: 'asc' } },
    },
    orderBy: { revision: 'asc' },
    take: 500,
  });

  // Get the current max revision across products and orders
  const [maxProductRev, maxOrderRev] = await Promise.all([
    prisma.product.aggregate({
      where: { shopId },
      _max: { revision: true },
    }),
    prisma.order.aggregate({
      where: { shopId },
      _max: { revision: true },
    }),
  ]);

  const serverRev = Math.max(
    maxProductRev._max.revision || 0,
    maxOrderRev._max.revision || 0
  );

  const truncated = products.length === 500 || orders.length === 500;

  return {
    products,
    orders,
    server_rev: serverRev,
    truncated,
    since: sinceRevision,
  };
}

export async function getSyncStatus(shopId: string) {
  const [maxProductRev, maxOrderRev, productCount, orderCount] = await Promise.all([
    prisma.product.aggregate({
      where: { shopId },
      _max: { revision: true },
    }),
    prisma.order.aggregate({
      where: { shopId },
      _max: { revision: true },
    }),
    prisma.product.count({ where: { shopId } }),
    prisma.order.count({ where: { shopId } }),
  ]);

  return {
    server_rev: Math.max(maxProductRev._max.revision || 0, maxOrderRev._max.revision || 0),
    product_count: productCount,
    order_count: orderCount,
    status: 'ok',
  };
}

export const syncService = {
  getSyncFeed,
  getSyncStatus,
};
