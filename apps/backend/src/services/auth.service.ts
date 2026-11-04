/**
 * Authentication service — PIN login, user login, token management, brute-force protection.
 */

import { prisma } from '../config/database';
import { hashPassword, comparePassword } from '../utils/password';
import { generateTokenPair, verifyRefreshToken } from '../utils/auth';
import { AppError } from '../middleware/error';
import { config } from '../config';

export async function shopLogin(pin: string, ipAddress?: string) {
  const shop = await prisma.shop.findFirst({
    where: { is_active: true },
  });

  if (!shop) {
    throw new AppError('No active shop configured', 404, 'shop_not_found');
  }

  // Brute force check
  const since = new Date(Date.now() - 15 * 60 * 1000);
  const failures = await prisma.authAttempt.count({
    where: {
      shopId: shop.id,
      ipAddress: ipAddress || '0.0.0.0',
      succeeded: false,
      attemptedAt: { gte: since },
    },
  });

  if (failures >= 8) {
    throw new AppError('Too many failed attempts. Try again in 15 minutes.', 429, 'rate_limited');
  }

  const valid = await comparePassword(pin, shop.admin_pin_hash);

  await prisma.authAttempt.create({
    data: {
      shopId: shop.id,
      ipAddress: ipAddress || '0.0.0.0',
      succeeded: valid,
    },
  });

  if (!valid) {
    throw new AppError('Invalid PIN', 401, 'invalid_credentials');
  }

  // Issue a shop-level access token (role: admin)
  const tokens = generateTokenPair({
    userId: 'shop',
    shopId: shop.id,
    role: 'admin',
    email: `${shop.slug}@dxn-stockpoint.local`,
  });

  return {
    token: tokens.accessToken,
    refresh_token: tokens.refreshToken,
    expires_at: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
    shop: {
      id: shop.id,
      name: shop.name,
      slug: shop.slug,
      currency: shop.currency,
    },
  };
}

export async function refreshShopToken(refreshToken: string) {
  const payload = verifyRefreshToken(refreshToken);
  if (!payload) {
    throw new AppError('Invalid refresh token', 401, 'token_invalid');
  }

  const shop = await prisma.shop.findUnique({
    where: { id: payload.shopId },
    select: { id: true, name: true, slug: true, currency: true, is_active: true },
  });

  if (!shop || !shop.is_active) {
    throw new AppError('Shop not found or inactive', 404, 'shop_not_found');
  }

  const tokens = generateTokenPair({
    userId: 'shop',
    shopId: shop.id,
    role: 'admin',
    email: `${shop.slug}@dxn-stockpoint.local`,
  });

  return {
    token: tokens.accessToken,
    refresh_token: tokens.refreshToken,
    expires_at: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
  };
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

export async function registerUser(data: { email: string; password: string; full_name: string; role: string }) {
  const existing = await prisma.user.findUnique({ where: { email: data.email } });
  if (existing) {
    throw new AppError('Email already registered', 409, 'duplicate_email');
  }

  // Default to first shop or create one
  let shop = await prisma.shop.findFirst();
  if (!shop) {
    shop = await prisma.shop.create({
      data: {
        name: 'Default Stock Point',
        slug: 'default-stock-point',
        currency: 'BDT',
        admin_pin_hash: await hashPassword('2468'),
      },
    });
  }

  const passwordHash = await hashPassword(data.password);
  const user = await prisma.user.create({
    data: {
      email: data.email,
      passwordHash,
      fullName: data.full_name,
      role: data.role,
      shopId: shop.id,
    },
    select: { id: true, email: true, fullName: true, role: true },
  });

  return user;
}

export async function loginUser(email: string, password: string) {
  const user = await prisma.user.findUnique({
    where: { email },
    include: { shop: true },
  });

  if (!user || !user.is_active) {
    throw new AppError('Invalid credentials', 401, 'invalid_credentials');
  }

  const valid = await comparePassword(password, user.passwordHash);
  if (!valid) {
    throw new AppError('Invalid credentials', 401, 'invalid_credentials');
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { last_login_at: new Date() },
  });

  const tokens = generateTokenPair({
    userId: user.id,
    shopId: user.shopId,
    role: user.role,
    email: user.email,
  });

  // Persist refresh token
  await prisma.authSession.create({
    data: {
      userId: user.id,
      shopId: user.shopId,
      refreshToken: tokens.refreshToken,
      expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    },
  });

  return {
    token: tokens.accessToken,
    refresh_token: tokens.refreshToken,
    user: {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      role: user.role,
    },
    shop: {
      id: user.shop.id,
      name: user.shop.name,
      slug: user.shop.slug,
      currency: user.shop.currency,
    },
  };
}

export async function getMe(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { shop: true },
  });

  if (!user) {
    throw new AppError('User not found', 404, 'user_not_found');
  }

  return {
    user: {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      role: user.role,
    },
    shop: {
      id: user.shop.id,
      name: user.shop.name,
      slug: user.shop.slug,
      currency: user.shop.currency,
    },
  };
}
