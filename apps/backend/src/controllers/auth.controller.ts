/**
 * Auth controller — shop PIN login, user auth, token refresh, PIN change.
 */

import { Request, Response } from 'express';
import { asyncHandler } from '../middleware/error';
import { authService } from '../services/auth.service';
import { success, error } from '../utils/response';

export class AuthController {
  // Shop PIN login (legacy mobile/web POS flow)
  shopLogin = asyncHandler(async (req: Request, res: Response) => {
    const { pin } = req.body;
    const ip = req.ip;

    const result = await authService.shopLogin(pin, ip);

    success(res, result, { message: 'Shop authenticated successfully' });
  });

  // Refresh shop token
  refreshShopToken = asyncHandler(async (req: Request, res: Response) => {
    const { refresh_token } = req.body;

    const result = await authService.refreshShopToken(refresh_token);

    success(res, result, { message: 'Token refreshed' });
  });

  // Change shop PIN
  changeShopPin = asyncHandler(async (req: Request, res: Response) => {
    const { new_pin } = req.body;
    const shopId = (req as any).shop?.id || (req as any).user?.shopId;

    if (!shopId) {
      error(res, 'Shop context required', { statusCode: 400, code: 'shop_required' });
      return;
    }

    const result = await authService.changeShopPin(shopId, new_pin);

    success(res, result, { message: 'PIN changed successfully' });
  });

  // Register a staff user
  registerUser = asyncHandler(async (req: Request, res: Response) => {
    const user = await authService.registerUser(req.body);

    success(res, user, { statusCode: 201, message: 'User registered successfully' });
  });

  // Staff user login
  loginUser = asyncHandler(async (req: Request, res: Response) => {
    const { email, password } = req.body;

    const result = await authService.loginUser(email, password);

    success(res, result, { message: 'Logged in successfully' });
  });

  // Get current user
  getMe = asyncHandler(async (req: Request, res: Response) => {
    const userId = (req as any).user?.userId;

    if (!userId) {
      error(res, 'Authentication required', { statusCode: 401, code: 'unauthorized' });
      return;
    }

    const result = await authService.getMe(userId);

    success(res, result);
  });
}

export const authController = new AuthController();
