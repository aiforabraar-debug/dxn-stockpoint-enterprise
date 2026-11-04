/**
 * API service — typed fetch wrapper for the DXN Stockpoint backend.
 * Handles auth tokens, error normalization, and base URL resolution.
 */

/// <reference types="vite/client" />
import { ApiResponse } from '@/types';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000';

class ApiError extends Error {
  public status: number;
  public code: string | undefined;
  public details: any;

  constructor(message: string, status: number, code?: string, details?: any) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

function getToken(): string | null {
  if (typeof localStorage === 'undefined') return null;
  return localStorage.getItem('dxn_access_token');
}

async function request<T>(
  path: string,
  options: {
    method?: string;
    body?: unknown;
    auth?: boolean;
    headers?: Record<string, string>;
  } = {}
): Promise<T> {
  const { method = 'GET', body, auth = true, headers = {} } = options;

  const requestHeaders: Record<string, string> = {
    Accept: 'application/json',
    ...headers,
  };

  if (body !== undefined) {
    requestHeaders['Content-Type'] = 'application/json';
  }

  if (auth) {
    const token = getToken();
    if (token) {
      requestHeaders.Authorization = `Bearer ${token}`;
    }
  }

  const url = `${API_BASE}${path}`;

  let response: Response;
  try {
    response = await fetch(url, {
      method,
      headers: requestHeaders,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch (err) {
    throw new ApiError(
      'Cannot reach the shop server. Check your connection and API address.',
      0,
      'network_error'
    );
  }

  let data: any = null;
  const contentType = response.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    data = await response.json();
  } else {
    data = { message: await response.text() };
  }

  if (!response.ok) {
    throw new ApiError(
      data?.error?.message || `Request failed (HTTP ${response.status})`,
      response.status,
      data?.error?.code,
      data?.error?.details
    );
  }

  return data as T;
}

export const api = {
  // ── Auth ──────────────────────────────────────────────────────────────────
  shopLogin: (pin: string) =>
    request<{ token: string; refresh_token: string; expires_at: string; shop: any }>(
      '/api/v1/auth/login',
      { method: 'POST', body: { pin }, auth: false }
    ),

  refreshShopToken: (refreshToken: string) =>
    request<{ token: string; refresh_token: string; expires_at: string }>(
      '/api/v1/auth/refresh',
      { method: 'POST', body: { refresh_token: refreshToken }, auth: false }
    ),

  changeShopPin: (newPin: string) =>
    request<{ message: string; shop: any }>(
      '/api/v1/auth/pin',
      { method: 'POST', body: { new_pin: newPin } }
    ),

  registerUser: (body: any) =>
    request('/api/v1/auth/register', { method: 'POST', body, auth: false }),

  loginUser: (email: string, password: string) =>
    request<{ token: string; refresh_token: string; user: any; shop: any }>(
      '/api/v1/auth/user-login',
      { method: 'POST', body: { email, password }, auth: false }
    ),

  getMe: () => request<{ user: any; shop: any }>('/api/v1/auth/me'),

  // ── Products ───────────────────────────────────────────────────────────────
  getProducts: (params?: {
    category?: string;
    search?: string;
    is_active?: boolean;
    page?: number;
    limit?: number;
  }) => {
    const qs = new URLSearchParams();
    if (params?.category) qs.set('category', params.category);
    if (params?.search) qs.set('search', params.search);
    if (params?.is_active !== undefined) qs.set('is_active', String(params.is_active));
    if (params?.page) qs.set('page', String(params.page));
    if (params?.limit) qs.set('limit', String(params.limit));
    return request(`/api/v1/products?${qs.toString()}`);
  },

  getProduct: (id: string) => request(`/api/v1/products/${id}`),
  createProduct: (body: any) => request('/api/v1/products', { method: 'POST', body }),
  updateProduct: (id: string, body: any) =>
    request(`/api/v1/products/${id}`, { method: 'PUT', body }),
  archiveProduct: (id: string) =>
    request(`/api/v1/products/${id}`, { method: 'DELETE' }),
  restoreProduct: (id: string) =>
    request(`/api/v1/products/${id}/restore`, { method: 'POST' }),
  adjustStock: (id: string, body: { delta: number; reason: string; reference?: string }) =>
    request(`/api/v1/products/${id}/stock/adjust`, { method: 'POST', body }),
  stockTake: (id: string, body: { quantity: number }) =>
    request(`/api/v1/products/${id}/stock/take`, { method: 'POST', body }),
  getStockMovements: (limit?: number) =>
    request(`/api/v1/products/stock/movements?limit=${limit || 100}`),
  getCategories: () => request('/api/v1/products/categories'),

  // ── Orders ─────────────────────────────────────────────────────────────────
  createOrder: (body: any) => request('/api/v1/orders', { method: 'POST', body }),
  getOrders: (params?: {
    status?: string;
    search?: string;
    page?: number;
    limit?: number;
  }) => {
    const qs = new URLSearchParams();
    if (params?.status) qs.set('status', params.status);
    if (params?.search) qs.set('search', params.search);
    if (params?.page) qs.set('page', String(params.page));
    if (params?.limit) qs.set('limit', String(params.limit));
    return request(`/api/v1/orders?${qs.toString()}`);
  },
  getOrder: (id: string) => request(`/api/v1/orders/${id}`),
  updateOrderStatus: (id: string, status: string) =>
    request(`/api/v1/orders/${id}/status`, { method: 'POST', body: { status } }),
  getReceipt: (id: string) => request(`/api/v1/orders/${id}/receipt`),

  // ── Dashboard & Reports ────────────────────────────────────────────────────
  getDashboard: () => request('/api/v1/dashboard'),
  getSalesReport: (from: string, to: string) =>
    request(`/api/v1/reports/sales?from=${from}&to=${to}`),

  // ── Settings ───────────────────────────────────────────────────────────────
  getSettings: () => request<ShopSettings>('/api/v1/settings'),
  updateSettings: (body: any) =>
    request('/api/v1/settings', { method: 'PUT', body }),

  // ── Sync ───────────────────────────────────────────────────────────────────
  getSyncFeed: (since: number) =>
    request<{ products: any[]; orders: any[]; server_rev: number; truncated: boolean; since: number }>(
      `/api/v1/sync?since=${since}`
    ),
  getSyncStatus: () => request<{ server_rev: number; product_count: number; order_count: number; status: string }>(
    '/api/v1/sync/status'
  ),

  // ── Health ─────────────────────────────────────────────────────────────────
  health: () => request('/api/v1/health'),
};

export { ApiError };

// Type import for settings
type ShopSettings = {
  id: string;
  name: string;
  slug: string;
  whatsapp_number: string | null;
  currency: string;
  low_stock_threshold: number;
  business_phone: string | null;
  business_address: string | null;
  receipt_footer: string | null;
  allow_public_orders: boolean;
};
