/**
 * Shop settings service.
 */

import { prisma } from '../config/database';
import { hashPassword } from '../utils/password';
import { AppError } from '../middleware/error';

export async function getSettings(shopId: string) {
  const shop = await prisma.shop.findUnique({
    where: { id: shopId },
    select: {
      id: true,
      name: true,
      slug: true,
      whatsapp_number: true,
      currency: true,
      low_stock_threshold: true,
      business_phone: true,
      business_address: true,
      receipt_footer: true,
      allow_public_orders: true,
      is_active: true,
      created_at: true,
      updated_at: true,
    },
  });

  if (!shop) {
    throw new AppError('Shop not found', 404, 'shop_not_found');
  }

  return shop;
}

export async function updateSettings(shopId: string, data: any) {
  const shop = await prisma.shop.findUnique({
    where: { id: shopId },
  });

  if (!shop) {
    throw new AppError('Shop not found', 404, 'shop_not_found');
  }

  return prisma.shop.update({
    where: { id: shopId },
    data: {
      ...(data.name !== undefined && { name: data.name }),
      ...(data.whatsapp_number !== undefined && { whatsapp_number: data.whatsapp_number }),
      ...(data.currency !== undefined && { currency: data.currency }),
      ...(data.low_stock_threshold !== undefined && { low_stock_threshold: data.low_stock_threshold }),
      ...(data.business_phone !== undefined && { business_phone: data.business_phone }),
      ...(data.business_address !== undefined && { business_address: data.business_address }),
      ...(data.receipt_footer !== undefined && { receipt_footer: data.receipt_footer }),
      ...(data.allow_public_orders !== undefined && { allow_public_orders: data.allow_public_orders }),
    },
    select: {
      id: true,
      name: true,
      whatsapp_number: true,
      currency: true,
      low_stock_threshold: true,
      business_phone: true,
      business_address: true,
      receipt_footer: true,
      allow_public_orders: true,
    },
  });
}

export async function changeShopPin(shopId: string, newPin: string) {
  const hash = await hashPassword(newPin);
  const shop = await prisma.shop.update({
    where: { id: shopId },
    data: { admin_pin_hash: hash },
    select: { id: true, name: true },
  });

  return { message: 'PIN updated successfully', shop };
}

export const settingsService = {
  getSettings,
  updateSettings,
  changeShopPin,
};
