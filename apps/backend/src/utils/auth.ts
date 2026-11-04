/**
 * JWT token utilities — access tokens (short-lived) and refresh tokens (long-lived).
 */

import jwt, { SignOptions, VerifyOptions, Secret } from 'jsonwebtoken';
import { config } from '../config';

const accessSecret: Secret = config.JWT_ACCESS_SECRET;
const refreshSecret: Secret = config.JWT_REFRESH_SECRET;

export interface TokenPayload {
  userId: string;
  shopId: string;
  role: string;
  email: string;
}

export interface AccessTokenPayload extends TokenPayload {
  type: 'access';
}

export interface RefreshTokenPayload extends TokenPayload {
  type: 'refresh';
}

export function signAccessToken(payload: Omit<TokenPayload, 'type'>): string {
  const options: SignOptions = {
    expiresIn: config.JWT_ACCESS_TTL as SignOptions['expiresIn'],
    issuer: 'dxn-stockpoint',
    audience: 'dxn-stockpoint-client',
  };
  return jwt.sign({ ...payload, type: 'access' }, accessSecret, options);
}

export function signRefreshToken(payload: Omit<TokenPayload, 'type'>): string {
  const options: SignOptions = {
    expiresIn: config.JWT_REFRESH_TTL as SignOptions['expiresIn'],
    issuer: 'dxn-stockpoint',
    audience: 'dxn-stockpoint-client',
  };
  return jwt.sign({ ...payload, type: 'refresh' }, refreshSecret, options);
}

export function verifyAccessToken(token: string): AccessTokenPayload | null {
  try {
    const decoded = jwt.verify(token, accessSecret, {
      issuer: 'dxn-stockpoint',
      audience: 'dxn-stockpoint-client',
    } as VerifyOptions) as AccessTokenPayload;
    return decoded.type === 'access' ? decoded : null;
  } catch {
    return null;
  }
}

export function verifyRefreshToken(token: string): RefreshTokenPayload | null {
  try {
    const decoded = jwt.verify(token, refreshSecret, {
      issuer: 'dxn-stockpoint',
      audience: 'dxn-stockpoint-client',
    } as VerifyOptions) as RefreshTokenPayload;
    return decoded.type === 'refresh' ? decoded : null;
  } catch {
    return null;
  }
}

export function generateTokenPair(payload: Omit<TokenPayload, 'type'>) {
  return {
    accessToken: signAccessToken(payload),
    refreshToken: signRefreshToken(payload),
  };
}
