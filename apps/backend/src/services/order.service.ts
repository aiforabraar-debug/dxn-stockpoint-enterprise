/**
 * Order service — order creation (idempotent), status updates, stock deduction, receipt.
 */

import { prisma } from '../config/database';
import { AppError } from '../middleware/error';

export interface OrderItemInput {
  product_id: string;
  quantity: number;
}

export async function createOrder(
  shopId: string,
  data: {
    client_uuid?: string;
    customer_name: string;
    customer_phone?: string | null;
    dxn_member_id?: string | null;
    is_member: boolean;
    payment_method: string;
    discount: number;
    note?: string | null;
    source: string;
    items: OrderItemInput[];
    userId?: string;
    customerId?: string;
  }
) {
  // Idempotency — check if this client_uuid was already processed
  if (data.client_uuid) {
    const existing = await prisma.order.findUnique({
      where: { client_uuid: data.client_uuid },
    });
    if (existing) {
      return { order: existing, duplicate: true };
    }
  }

  // Resolve customer
  let customerId: string | undefined = data.customerId;
  if (!customerId && data.customer_phone) {
    let customer = await prisma.customer.findFirst({
      where: { shopId, phone: data.customer_phone },
    });
    if (!customer) {
      customer = await prisma.customer.create({
        data: {
          shopId,
          name: data.customer_name,
          phone: data.customer_phone,
          member_id: data.dxn_member_id || null,
          is_member: data.is_member,
          total_orders: 0,
          total_spent: 0,
          total_pv: 0,
        },
      });
    } else {
      customer = await prisma.customer.update({
        where: { id: customer.id },
        data: {
          name: data.customer_name,
          ...(data.dxn_member_id ? { member_id: data.dxn_member_id } : {}),
          is_member: data.is_member,
        },
      });
    }
    customerId = customer.id;
  }

  // Resolve products and compute totals in a transaction
  const result = await prisma.$transaction(async (tx) => {
    const resolvedItems: any[] = [];
    let subtotal = 0;
    let totalPv = 0;

    for (const item of data.items) {
      const product = await tx.product.findFirst({
        where: { id: item.product_id, shopId },
      });

      if (!product) {
        throw new AppError(`Product ${item.product_id} not found`, 404, 'product_not_found');
      }

      if (product.stock_qty < item.quantity) {
        throw new AppError(
          `Insufficient stock for "${product.name}" (available: ${product.stock_qty})`,
          409,
          'insufficient_stock'
        );
      }

      const unitPrice = data.is_member ? Number(product.member_price) : Number(product.retail_price);
      const unitPv = Number(product.pv_points);
      const lineTotal = unitPrice * item.quantity;

      subtotal += lineTotal;
      totalPv += unitPv * item.quantity;

      resolvedItems.push({
        product,
        quantity: item.quantity,
        unitPrice,
        unitPv,
        lineTotal,
      });
    }

    const discount = Math.max(0, data.discount);
    const totalAmount = Math.max(0, subtotal - discount);

    const orderNumber = `DXN-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

    const order = await tx.order.create({
      data: {
        shopId,
        userId: data.userId || null,
        customerId,
        client_uuid: data.client_uuid || null,
        order_number: orderNumber,
        customer_name: data.customer_name,
        customer_phone: data.customer_phone || null,
        dxn_member_id: data.dxn_member_id || null,
        is_member: data.is_member,
        payment_method: data.payment_method as any,
        subtotal,
        discount,
        total_amount: totalAmount,
        total_pv: totalPv,
        status: 'CONFIRMED',
        source: data.source as any,
        note: data.note || null,
        revision: 0,
      },
    });

    // Create order items and deduct stock
    for (const item of resolvedItems) {
      await tx.orderItem.create({
        data: {
          orderId: order.id,
          productId: item.product.id,
          sku: item.product.sku,
          name: item.product.name,
          quantity: item.quantity,
          unit_price: item.unitPrice,
          unit_pv: item.unitPv,
          line_total: item.lineTotal,
        },
      });

      await tx.product.update({
        where: { id: item.product.id },
        data: {
          stock_qty: { decrement: item.quantity },
          revision: { increment: 1 },
        },
      });

      await tx.stockMovement.create({
        data: {
          shopId,
          productId: item.product.id,
          orderId: order.id,
          reason: 'SALE',
          delta: -item.quantity,
          quantity_after: item.product.stock_qty - item.quantity,
          reference: orderNumber,
        },
      });
    }

    // Update customer stats
    if (customerId) {
      await tx.customer.update({
        where: { id: customerId },
        data: {
          total_orders: { increment: 1 },
          total_spent: { increment: totalAmount },
          total_pv: { increment: totalPv },
        },
      });
    }

    return order;
  });

  const orderWithItems = await prisma.order.findUnique({
    where: { id: result.id },
    include: {
      items: {
        orderBy: { id: 'asc' },
      },
      customer: true,
    },
  });

  return { order: orderWithItems!, duplicate: false };
}

export async function getOrder(shopId: string, id: string) {
  const order = await prisma.order.findFirst({
    where: { id, shopId },
    include: {
      items: { orderBy: { id: 'asc' } },
      customer: true,
    },
  });

  if (!order) {
    throw new AppError('Order not found', 404, 'order_not_found');
  }

  return order;
}

export async function listOrders(shopId: string, filters: {
  status?: string;
  search?: string;
  page: number;
  limit: number;
}) {
  const where: any = { shopId };

  if (filters.status) where.status = filters.status;
  if (filters.search) {
    where.OR = [
      { order_number: { contains: filters.search, mode: 'insensitive' } },
      { customer_name: { contains: filters.search, mode: 'insensitive' } },
      { dxn_member_id: { contains: filters.search, mode: 'insensitive' } },
      { customer_phone: { contains: filters.search, mode: 'insensitive' } },
    ];
  }

  const [orders, total] = await Promise.all([
    prisma.order.findMany({
      where,
      include: {
        items: { orderBy: { id: 'asc' } },
        customer: true,
      },
      orderBy: { created_at: 'desc' },
      skip: (filters.page - 1) * filters.limit,
      take: filters.limit,
    }),
    prisma.order.count({ where }),
  ]);

  return { orders, total, page: filters.page, limit: filters.limit };
}

export async function updateOrderStatus(shopId: string, id: string, status: string) {
  const order = await prisma.order.findFirst({
    where: { id, shopId },
  });

  if (!order) {
    throw new AppError('Order not found', 404, 'order_not_found');
  }

  const updated = await prisma.order.update({
    where: { id },
    data: { status: status as any, revision: { increment: 1 } },
    include: {
      items: { orderBy: { id: 'asc' } },
    },
  });

  return updated;
}

export async function getReceipt(shopId: string, id: string) {
  const order = await prisma.order.findFirst({
    where: { id, shopId },
    include: {
      items: { orderBy: { id: 'asc' } },
    },
  });

  if (!order) {
    throw new AppError('Order not found', 404, 'order_not_found');
  }

  const shop = await prisma.shop.findUnique({
    where: { id: shopId },
  });

  return { order, shop };
}

export async function getDashboard(shopId: string) {
  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfWeek = new Date(now.getFullYear(), now.getMonth(), now.getDate() - now.getDay());

  const [
    totalOrders,
    totalRevenue,
    todayOrders,
    todayRevenue,
    lowStockProducts,
    recentOrders,
  ] = await Promise.all([
    prisma.order.count({ where: { shopId, status: { not: 'CANCELLED' } } }),
    prisma.order.aggregate({
      where: { shopId, status: { not: 'CANCELLED' } },
      _sum: { total_amount: true, total_pv: true },
    }),
    prisma.order.count({
      where: { shopId, status: { not: 'CANCELLED' }, created_at: { gte: startOfDay } },
    }),
    prisma.order.aggregate({
      where: {
        shopId,
        status: { not: 'CANCELLED' },
        created_at: { gte: startOfDay },
      },
      _sum: { total_amount: true },
    }),
    prisma.product.findMany({
      where: { shopId, is_active: true, stock_qty: { lt: 5 } },
      orderBy: { stock_qty: 'asc' },
      take: 10,
    }),
    prisma.order.findMany({
      where: { shopId },
      include: { items: true },
      orderBy: { created_at: 'desc' },
      take: 10,
    }),
  ]);

  return {
    total_orders: totalOrders,
    total_revenue: Number(totalRevenue._sum.total_amount || 0),
    total_pv: Number(totalRevenue._sum.total_pv || 0),
    today_orders: todayOrders,
    today_revenue: Number(todayRevenue._sum.total_amount || 0),
    low_stock_products: lowStockProducts,
    recent_orders: recentOrders,
  };
}

export async function getSalesReport(shopId: string, from: Date, to: Date) {
  const orders = await prisma.order.findMany({
    where: {
      shopId,
      status: { not: 'CANCELLED' },
      created_at: { gte: from, lte: to },
    },
    include: { items: true },
    orderBy: { created_at: 'asc' },
  });

  const totalRevenue = orders.reduce((sum, o) => sum + Number(o.total_amount), 0);
  const totalPV = orders.reduce((sum, o) => sum + Number(o.total_pv), 0);

  return {
    from,
    to,
    total_orders: orders.length,
    total_revenue: totalRevenue,
    total_pv: totalPV,
    orders,
  };
}

export const orderService = {
  createOrder,
  getOrder,
  listOrders,
  updateOrderStatus,
  getReceipt,
  getDashboard,
  getSalesReport,
};
