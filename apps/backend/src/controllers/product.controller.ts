/**
 * Product controller — CRUD, stock adjustments, categories.
 */

import { Request, Response } from 'express';
import { asyncHandler } from '../middleware/error';
import { productService } from '../services/product.service';
import { success, error, paginated } from '../utils/response';

export class ProductController {
  listProducts = asyncHandler(async (req: Request, res: Response) => {
    const shopId = (req as any).shop?.id || (req as any).user?.shopId;
    const { category, search, is_active, page, limit } = req.query as any;

    const result = await productService.listProducts(shopId, {
      category,
      search,
      is_active: is_active !== undefined ? is_active === 'true' : undefined,
      page,
      limit,
    });

    paginated(res, result.products, {
      page: result.page,
      limit: result.limit,
      total: result.total,
    }, { message: 'Products retrieved' });
  });

  getProduct = asyncHandler(async (req: Request, res: Response) => {
    const shopId = (req as any).shop?.id || (req as any).user?.shopId;
    const product = await productService.getProduct(shopId, req.params.id);

    success(res, product, { message: 'Product retrieved' });
  });

  createProduct = asyncHandler(async (req: Request, res: Response) => {
    const shopId = (req as any).shop?.id || (req as any).user?.shopId;
    const product = await productService.createProduct(shopId, req.body);

    success(res, product, { statusCode: 201, message: 'Product created' });
  });

  updateProduct = asyncHandler(async (req: Request, res: Response) => {
    const shopId = (req as any).shop?.id || (req as any).user?.shopId;
    const product = await productService.updateProduct(shopId, req.params.id, req.body);

    success(res, product, { message: 'Product updated' });
  });

  archiveProduct = asyncHandler(async (req: Request, res: Response) => {
    const shopId = (req as any).shop?.id || (req as any).user?.shopId;
    await productService.archiveProduct(shopId, req.params.id);

    success(res, { id: req.params.id }, { message: 'Product archived' });
  });

  restoreProduct = asyncHandler(async (req: Request, res: Response) => {
    const shopId = (req as any).shop?.id || (req as any).user?.shopId;
    await productService.restoreProduct(shopId, req.params.id);

    success(res, { id: req.params.id }, { message: 'Product restored' });
  });

  adjustStock = asyncHandler(async (req: Request, res: Response) => {
    const shopId = (req as any).shop?.id || (req as any).user?.shopId;
    const result = await productService.adjustStock(shopId, req.params.id, req.body);

    success(res, result, { message: 'Stock adjusted' });
  });

  stockTake = asyncHandler(async (req: Request, res: Response) => {
    const shopId = (req as any).shop?.id || (req as any).user?.shopId;
    const result = await productService.stockTake(shopId, req.params.id, req.body.quantity);

    success(res, result, { message: 'Stock take completed' });
  });

  getStockMovements = asyncHandler(async (req: Request, res: Response) => {
    const shopId = (req as any).shop?.id || (req as any).user?.shopId;
    const limit = req.query.limit ? Number(req.query.limit) : 100;
    const movements = await productService.getStockMovements(shopId, limit);

    success(res, movements, { message: 'Stock movements retrieved' });
  });

  getCategories = asyncHandler(async (req: Request, res: Response) => {
    const shopId = (req as any).shop?.id || (req as any).user?.shopId;
    const categories = await productService.getCategories(shopId);

    success(res, categories, { message: 'Categories retrieved' });
  });
}

export const productController = new ProductController();
