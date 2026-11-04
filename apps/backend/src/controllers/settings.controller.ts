/**
 * Settings controller — shop profile, PIN, sync.
 */

import { Request, Response } from 'express';
import { asyncHandler } from '../middleware/error';
import { settingsService } from '../services/settings.service';
import { syncService } from '../services/sync.service';
import { success } from '../utils/response';

export class SettingsController {
  getSettings = asyncHandler(async (req: Request, res: Response) => {
    const shopId = (req as any).shop?.id || (req as any).user?.shopId;
    const settings = await settingsService.getSettings(shopId);

    success(res, settings, { message: 'Settings retrieved' });
  });

  updateSettings = asyncHandler(async (req: Request, res: Response) => {
    const shopId = (req as any).shop?.id || (req as any).user?.shopId;
    const settings = await settingsService.updateSettings(shopId, req.body);

    success(res, settings, { message: 'Settings updated' });
  });

  changeShopPin = asyncHandler(async (req: Request, res: Response) => {
    const shopId = (req as any).shop?.id || (req as any).user?.shopId;
    const result = await settingsService.changeShopPin(shopId, req.body.new_pin);

    success(res, result, { message: 'PIN changed' });
  });

  getSyncFeed = asyncHandler(async (req: Request, res: Response) => {
    const shopId = (req as any).shop?.id || (req as any).user?.shopId;
    const since = Number(req.query.since) || 0;

    const feed = await syncService.getSyncFeed(shopId, since);

    success(res, feed, { message: 'Sync feed retrieved' });
  });

  getSyncStatus = asyncHandler(async (req: Request, res: Response) => {
    const shopId = (req as any).shop?.id || (req as any).user?.shopId;
    const status = await syncService.getSyncStatus(shopId);

    success(res, status, { message: 'Sync status retrieved' });
  });
}

export const settingsController = new SettingsController();
