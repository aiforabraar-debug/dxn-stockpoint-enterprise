/**
 * TypeScript types for DXN Stockpoint Enterprise Frontend.
 * These mirror the backend Prisma models and API responses.
 */

export type Product = {
  id: string;
  shop_id: string;
  sku: string;
  name: string;
  description: string | null;
  category: string;
  retail_price: number;
  member_price: number;
  pv_points: number;
  stock_qty: number;
  low_stock_at: number;
  image_url: string | null;
  is_active: boolean;
  revision: number;
  created_at: string;
  updated_at: string;
};

export type OrderItem = {
  id: string;
  order_id: string;
  product_id: string;
  sku: string;
  name: string;
  quantity: number;
  unit_price: number;
  unit_pv: number;
  line_total: number;
};

export type Order = {
  id: string;
  shop_id: string;
  user_id: string | null;
  customer_id: string | null;
  client_uuid: string | null;
  order_number: string;
  customer_name: string;
  customer_phone: string | null;
  dxn_member_id: string | null;
  is_member: boolean;
  payment_method: string;
  subtotal: number;
  discount: number;
  total_amount: number;
  total_pv: number;
  status: 'PENDING' | 'CONFIRMED' | 'PACKED' | 'DELIVERED' | 'CANCELLED';
  source: 'WEB' | 'ANDROID' | 'ADMIN';
  note: string | null;
  revision: number;
  created_at: string;
  updated_at: string;
  items: OrderItem[];
  customer?: {
    id: string;
    name: string;
    phone: string | null;
    member_id: string | null;
    is_member: boolean;
    total_orders: number;
    total_spent: number;
    total_pv: number;
  } | null;
};

export type Customer = {
  id: string;
  shop_id: string;
  name: string;
  phone: string | null;
  member_id: string | null;
  is_member: boolean;
  total_orders: number;
  total_spent: number;
  total_pv: number;
  created_at: string;
  updated_at: string;
};

export type StockMovement = {
  id: string;
  shop_id: string;
  product_id: string;
  order_id: string | null;
  reason: string;
  delta: number;
  quantity_after: number;
  reference: string | null;
  created_at: string;
  product?: {
    name: string;
    sku: string;
  };
};

export type ShopSettings = {
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
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type DashboardStats = {
  total_orders: number;
  total_revenue: number;
  total_pv: number;
  today_orders: number;
  today_revenue: number;
  low_stock_products: Product[];
  recent_orders: Order[];
};

export type SyncFeed = {
  products: Product[];
  orders: Order[];
  server_rev: number;
  truncated: boolean;
  since: number;
};

export type SyncStatus = {
  server_rev: number;
  product_count: number;
  order_count: number;
  status: string;
};

export type PaginatedResponse<T> = {
  data: T[];
  meta: {
    page: number;
    limit: number;
    total: number;
    has_more: boolean;
  };
};

export type ApiResponse<T> = {
  success: boolean;
  data?: T;
  message?: string;
  error?: {
    message: string;
    code?: string;
    details?: any;
  };
};

export type CartLine = {
  productId: string;
  product: Product;
  qty: number;
  price: number;
  pv: number;
  lineTotal: number;
  linePv: number;
  available: number;
};

export type CartTotals = {
  lines: CartLine[];
  subtotal: number;
  discount: number;
  total: number;
  pv: number;
  units: number;
  count: number;
};

export type AuthTokens = {
  token: string;
  refresh_token: string;
  expires_at: string;
};
