/**
 * Admin — Dashboard with analytics, inventory management, and stock movements.
 */

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { BarChart3, Package, Clock, Users, TrendingUp, CreditCard, AlertCircle } from 'lucide-react';
import { api } from '@/services/api';
import { useAuthStore } from '@/stores/auth';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { money, formatNumber, formatPv } from '@/utils/format';
import { toast } from 'sonner';

export function Admin() {
  const { isAuthenticated } = useAuthStore();

  const { data: dashboard, isLoading } = useQuery({
    queryKey: ['dashboard'],
    queryFn: async () => {
      const response = await api.getDashboard();
      return response.data;
    },
    enabled: isAuthenticated,
  });

  if (!isAuthenticated) return null;

  if (isLoading) {
    return (
      <div className="flex h-[400px] items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-500">Loading admin dashboard…</p>
        </div>
      </div>
    );
  }

  const stats = dashboard || {
    total_orders: 0,
    total_revenue: 0,
    total_pv: 0,
    today_orders: 0,
    today_revenue: 0,
    low_stock_products: [],
    recent_orders: [],
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="text-gray-600">Business overview and inventory management</p>
        </div>
        <Button onClick={() => {}}>New Product</Button>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Today's Revenue</p>
              <h3 className="text-2xl font-bold text-gray-900">{money(stats.today_revenue)}</h3>
              <p className="text-xs text-green-600 flex items-center gap-1">
                {stats.today_orders} orders
              </p>
            </div>
            <div className="p-3 rounded-lg bg-green-50 text-green-600">
              <CreditCard className="w-6 h-6" />
            </div>
          </div>
        </Card>

        <Card className="p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">All-time Revenue</p>
              <h3 className="text-2xl font-bold text-gray-900">{money(stats.total_revenue)}</h3>
              <p className="text-xs text-gray-500">{formatNumber(stats.total_orders)} total orders</p>
            </div>
            <div className="p-3 rounded-lg bg-blue-50 text-blue-600">
              <TrendingUp className="w-6 h-6" />
            </div>
          </div>
        </Card>

        <Card className="p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Stock on Hand</p>
              <h3 className="text-2xl font-bold text-gray-900">{formatNumber(stats.low_stock_products.reduce((sum: number, p: any) => sum + p.stock_qty, 0))}</h3>
              <p className="text-xs text-gray-500">units in inventory</p>
            </div>
            <div className="p-3 rounded-lg bg-purple-50 text-purple-600">
              <Package className="w-6 h-6" />
            </div>
          </div>
        </Card>

        <Card className="p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Needs Attention</p>
              <h3 className="text-2xl font-bold text-gray-900">{stats.low_stock_products.length}</h3>
              <p className="text-xs text-red-600">low or out of stock</p>
            </div>
            <div className="p-3 rounded-lg bg-red-50 text-red-600">
              <AlertCircle className="w-6 h-6" />
            </div>
          </div>
        </Card>
      </div>

      {/* Stock alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card>
          <div className="p-6">
            <h3 className="text-sm font-semibold text-gray-900 mb-4">Stock Alerts</h3>
            {stats.low_stock_products.length === 0 ? (
              <p className="text-gray-500 text-sm">All products are above alert levels.</p>
            ) : (
              <div className="space-y-3">
                {stats.low_stock_products.slice(0, 8).map((product: any) => (
                  <div key={product.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex-1">
                      <div className="text-sm font-medium text-gray-900">{product.name}</div>
                      <div className="text-xs text-gray-500">{product.sku}</div>
                    </div>
                    <Badge variant={product.stock_qty <= 0 ? 'danger' : 'warn'}>
                      {product.stock_qty} left
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </div>
        </Card>

        <Card>
          <div className="p-6">
            <h3 className="text-sm font-semibold text-gray-900 mb-4">Recent Orders</h3>
            {stats.recent_orders.length === 0 ? (
              <p className="text-gray-500 text-sm">No recent orders.</p>
            ) : (
              <div className="space-y-3">
                {stats.recent_orders.slice(0, 5).map((order: any) => (
                  <div key={order.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex-1">
                      <div className="text-sm font-medium text-gray-900">{order.order_number}</div>
                      <div className="text-xs text-gray-500">{order.customer_name}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-semibold text-gray-900">{money(order.total_amount)}</div>
                      <Badge variant={statusVariant(order.status)} className="mt-1">
                        {order.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </Card>

        <Card>
          <div className="p-6">
            <h3 className="text-sm font-semibold text-gray-900 mb-4">PV Summary</h3>
            <div className="text-2xl font-bold text-gray-900">{formatPv(stats.total_pv)} PV</div>
            <p className="text-xs text-gray-500 mt-1">Total PV points earned</p>
          </div>
        </Card>
      </div>
    </div>
  );
}

function statusVariant(status: string) {
  const variants: Record<string, 'ok' | 'warn' | 'info' | 'danger' | 'muted'> = {
    PENDING: 'warn',
    CONFIRMED: 'info',
    PACKED: 'info',
    DELIVERED: 'ok',
    CANCELLED: 'danger',
  };
  return variants[status] || 'muted';
}

