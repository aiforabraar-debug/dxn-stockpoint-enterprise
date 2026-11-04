/**
 * Order controller — order CRUD, status updates, receipts, dashboard, reports.
 */

import { Request, Response } from 'express';
import { asyncHandler } from '../middleware/error';
import { orderService } from '../services/order.service';
import { success, error, paginated } from '../utils/response';

export class OrderController {
  createOrder = asyncHandler(async (req: Request, res: Response) => {
    const shopId = (req as any).shop?.id || (req as any).user?.shopId;
    const userId = (req as any).user?.userId || undefined;

    const result = await orderService.createOrder(shopId, {
      ...req.body,
      userId,
    });

    success(res, result.order, {
      statusCode: result.duplicate ? 200 : 201,
      message: result.duplicate ? 'Order already exists (idempotent replay)' : 'Order created',
    });
  });

  getOrder = asyncHandler(async (req: Request, res: Response) => {
    const shopId = (req as any).shop?.id || (req as any).user?.shopId;
    const order = await orderService.getOrder(shopId, req.params.id);

    success(res, order, { message: 'Order retrieved' });
  });

  listOrders = asyncHandler(async (req: Request, res: Response) => {
    const shopId = (req as any).shop?.id || (req as any).user?.shopId;
    const { status, search, page, limit } = req.query as any;

    const result = await orderService.listOrders(shopId, {
      status,
      search,
      page,
      limit,
    });

    paginated(res, result.orders, {
      page: result.page,
      limit: result.limit,
      total: result.total,
    }, { message: 'Orders retrieved' });
  });

  updateOrderStatus = asyncHandler(async (req: Request, res: Response) => {
    const shopId = (req as any).shop?.id || (req as any).user?.shopId;
    const order = await orderService.updateOrderStatus(shopId, req.params.id, req.body.status);

    success(res, order, { message: 'Order status updated' });
  });

  getReceipt = asyncHandler(async (req: Request, res: Response) => {
    const shopId = (req as any).shop?.id || (req as any).user?.shopId;
    const result = await orderService.getReceipt(shopId, req.params.id);

    success(res, result, { message: 'Receipt retrieved' });
  });

  getDashboard = asyncHandler(async (req: Request, res: Response) => {
    const shopId = (req as any).shop?.id || (req as any).user?.shopId;
    const dashboard = await orderService.getDashboard(shopId);

    success(res, dashboard, { message: 'Dashboard data retrieved' });
  });

  getSalesReport = asyncHandler(async (req: Request, res: Response) => {
    const shopId = (req as any).shop?.id || (req as any).user?.shopId;
    const { from, to } = req.query as any;

    const report = await orderService.getSalesReport(
      shopId,
      new Date(from),
      new Date(to)
    );

    success(res, report, { message: 'Sales report retrieved' });
  });
}

export const orderController = new OrderController();
