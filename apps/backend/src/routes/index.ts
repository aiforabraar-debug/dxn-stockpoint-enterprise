/**
 * API route definitions — v1.
 * All routes are mounted under /api/v1.
 */

import { Router } from 'express';
import {
  authController,
} from '../controllers/auth.controller';
import {
  productController,
} from '../controllers/product.controller';
import {
  orderController,
} from '../controllers/order.controller';
import {
  settingsController,
} from '../controllers/settings.controller';
import {
  healthController,
} from '../controllers/health.controller';
import {
  requireAuth,
  requireAdmin,
  requireShop,
  requireApiKey,
  optionalAuth,
} from '../middleware/auth';
import { validate } from '../middleware/validation';
import {
  loginSchema,
  changePinSchema,
  refreshTokenSchema,
  registerUserSchema,
  loginUserSchema,
} from '../validators/auth';
import {
  createProductSchema,
  updateProductSchema,
  productIdParams,
  stockAdjustSchema,
  stockTakeSchema,
  productQuerySchema,
} from '../validators/product';
import {
  createOrderSchema,
  updateOrderStatusSchema,
  orderIdParams,
  orderQuerySchema,
  receiptIdParams,
} from '../validators/order';
import {
  updateShopSettingsSchema,
  changeShopPinSchema,
  syncQuerySchema,
} from '../validators/settings';

const router = Router();

// ─── Health (no auth) ────────────────────────────────────────────────────────
router.get('/health', healthController.health);
router.get('/healthz', healthController.healthz);

// ─── Auth ────────────────────────────────────────────────────────────────────
router.post('/auth/login', validate(loginSchema), authController.shopLogin);
router.post('/auth/refresh', validate(refreshTokenSchema), authController.refreshShopToken);
router.post('/auth/pin', requireAuth, validate(changePinSchema), authController.changeShopPin);

// Staff user auth (separate from shop PIN)
router.post('/auth/register', validate(registerUserSchema), authController.registerUser);
router.post('/auth/user-login', validate(loginUserSchema), authController.loginUser);
router.get('/auth/me', requireAuth, authController.getMe);

// ─── Products ────────────────────────────────────────────────────────────────
router.get('/products', optionalAuth, requireShop, validate(productQuerySchema), productController.listProducts);
router.get('/products/:id', optionalAuth, requireShop, validate(productIdParams), productController.getProduct);
router.post('/products', requireAuth, requireAdmin, requireShop, validate(createProductSchema), productController.createProduct);
router.put('/products/:id', requireAuth, requireAdmin, requireShop, validate(updateProductSchema), productController.updateProduct);
router.delete('/products/:id', requireAuth, requireAdmin, requireShop, validate(productIdParams), productController.archiveProduct);
router.post('/products/:id/restore', requireAuth, requireAdmin, requireShop, validate(productIdParams), productController.restoreProduct);
router.post('/products/:id/stock/adjust', requireAuth, requireShop, validate(stockAdjustSchema), productController.adjustStock);
router.post('/products/:id/stock/take', requireAuth, requireShop, validate(stockTakeSchema), productController.stockTake);
router.get('/products/stock/movements', requireAuth, requireShop, productController.getStockMovements);
router.get('/products/categories', optionalAuth, requireShop, productController.getCategories);

// ─── Orders ──────────────────────────────────────────────────────────────────
router.post('/orders', optionalAuth, requireShop, validate(createOrderSchema), orderController.createOrder);
router.get('/orders', requireAuth, requireShop, validate(orderQuerySchema), orderController.listOrders);
router.get('/orders/:id', requireAuth, requireShop, validate(orderIdParams), orderController.getOrder);
router.post('/orders/:id/status', requireAuth, requireAdmin, requireShop, validate(updateOrderStatusSchema), orderController.updateOrderStatus);
router.get('/orders/:id/receipt', requireAuth, requireShop, validate(receiptIdParams), orderController.getReceipt);

// ─── Dashboard & Reports ─────────────────────────────────────────────────────
router.get('/dashboard', requireAuth, requireShop, orderController.getDashboard);
router.get('/reports/sales', requireAuth, requireShop, orderController.getSalesReport);

// ─── Settings ────────────────────────────────────────────────────────────────
router.get('/settings', requireAuth, requireShop, settingsController.getSettings);
router.put('/settings', requireAuth, requireAdmin, requireShop, validate(updateShopSettingsSchema), settingsController.updateSettings);

// Sync feed (revision-based, used by offline-first clients)
router.get('/sync', requireAuth, requireShop, validate(syncQuerySchema), settingsController.getSyncFeed);
router.get('/sync/status', requireAuth, requireShop, settingsController.getSyncStatus);

// ─── Machine-to-machine (API key) ────────────────────────────────────────────
router.get('/m2m/health', requireApiKey, healthController.healthz);

export default router;
