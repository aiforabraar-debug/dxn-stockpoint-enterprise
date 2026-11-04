/**
 * Orders — Order history list with status management and receipts.
 */

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Search, RefreshCw, Print, Send, Receipt } from 'lucide-react';
import { api } from '@/services/api';
import { useAuthStore } from '@/stores/auth';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { money, formatDateTime, formatRelativeTime } from '@/utils/format';
import { toast } from 'sonner';

const STATUSES = ['ALL', 'CONFIRMED', 'PACKED', 'DELIVERED', 'CANCELLED'] as const;

const statusVariant: Record<string, 'ok' | 'warn' | 'info' | 'danger' | 'muted'> = {
  PENDING: 'warn',
  CONFIRMED: 'info',
  PACKED: 'info',
  DELIVERED: 'ok',
  CANCELLED: 'danger',
  ALL: 'muted',
};

export function Orders() {
  const { isAuthenticated, shop } = useAuthStore();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'CONFIRMED' | 'PACKED' | 'DELIVERED' | 'CANCELLED'>('ALL');

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['orders', search, statusFilter],
    queryFn: async () => {
      const response = await api.getOrders({
        search: search || undefined,
        status: statusFilter !== 'ALL' ? statusFilter : undefined,
      });
      return response.data || [];
    },
    enabled: isAuthenticated,
  });

  const orders = data || [];

  const handleStatusChange = async (orderId: string, newStatus: string) => {
    try {
      await api.updateOrderStatus(orderId, newStatus);
      toast.success(`Order marked ${newStatus}`);
      refetch();
    } catch (err: any) {
      toast.error(err.message || 'Failed to update status');
    }
  };

  const handlePrint = (order: any) => {
    // Print receipt
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    const itemsHtml = order.items?.map((item: any) => `
      <tr>
        <td>${item.name}</td>
        <td style="text-align:center">${item.quantity}</td>
        <td style="text-align:right">${money(item.unit_price)}</td>
        <td style="text-align:right">${money(item.line_total)}</td>
      </tr>
    `).join('');

    printWindow!.document.write(`
      <html>
        <head>
          <title>Receipt ${order.order_number}</title>
          <style>
            body { font-family: 'Space Mono', monospace; padding: 20px; }
            .header { text-align: center; border-bottom: 2px solid #054A29; padding-bottom: 10px; margin-bottom: 20px; }
            table { width: 100%; border-collapse: collapse; }
            th, td { padding: 8px; text-align: left; border-bottom: 1px solid #ddd; }
            .total { font-weight: bold; font-size: 1.2em; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>${shop?.name || 'DXN Stockpoint'}</h1>
            <p>Order: ${order.order_number}</p>
            <p>Date: ${formatDateTime(order.created_at)}</p>
          </div>
          <table>
            <thead>
              <tr><th>Item</th><th>Qty</th><th>Price</th><th>Total</th></tr>
            </thead>
            <tbody>${itemsHtml}</tbody>
          </table>
          <div class="total">
            <p>Total: ${money(order.total_amount)}</p>
            <p>PV: ${order.total_pv.toFixed(2)}</p>
            <p>Customer: ${order.customer_name}</p>
            <p>Payment: ${order.payment_method}</p>
          </div>
        </body>
      </html>
    `);
    printWindow!.document.close();
    printWindow!.print();
  };

  const handleWhatsApp = (order: any) => {
    const phone = order.customer_phone || '';
    const message = `*Order Confirmation*\n\nOrder: ${order.order_number}\nCustomer: ${order.customer_name}\nTotal: ${money(order.total_amount)}\nStatus: ${order.status}\n\nThank you for shopping with us!`;
    const url = `https://wa.me/${phone.replace(/\D/g, '')}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
  };

  if (!isAuthenticated) return null;

  if (isLoading) {
    return (
      <div className="flex h-[400px] items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-500">Loading orders…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Orders</h1>
          <p className="text-gray-600">{orders.length} order(s) in history</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={refetch} size="sm">
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
          <Button variant="ghost" onClick={() => {}} size="sm">
            <Receipt className="w-4 h-4 mr-2" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col lg:flex-row gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            placeholder="Search order number, customer, member ID…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex gap-2">
          {STATUSES.map((s) => (
            <Button
              key={s}
              variant={statusFilter === s ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setStatusFilter(s)}
              className="whitespace-nowrap"
            >
              {s}
            </Button>
          ))}
        </div>
      </div>

      {/* Orders table */}
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="px-4 py-3 text-sm font-semibold text-gray-500">Order</th>
                <th className="px-4 py-3 text-sm font-semibold text-gray-500">Customer</th>
                <th className="px-4 py-3 text-sm font-semibold text-gray-500">Items</th>
                <th className="px-4 py-3 text-sm font-semibold text-gray-500 text-right">Total</th>
                <th className="px-4 py-3 text-sm font-semibold text-gray-500 text-right">PV</th>
                <th className="px-4 py-3 text-sm font-semibold text-gray-500">Status</th>
                <th className="px-4 py-3 text-sm font-semibold text-gray-500 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {orders.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-4 py-8 text-center text-gray-500">
                    No orders found.
                  </td>
                </tr>
              ) : (
                orders.map((order: any) => (
                  <tr key={order.id} className="border-b border-gray-50 hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div className="text-sm font-semibold text-gray-900">{order.order_number}</div>
                      <div className="text-xs text-gray-400 font-mono">{formatRelativeTime(order.created_at)}</div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-sm font-medium text-gray-900">{order.customer_name}</div>
                      {order.dxn_member_id && (
                        <div className="text-xs text-gray-400">DXN ID: {order.dxn_member_id}</div>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-sm text-gray-700">
                        {(order.items || []).slice(0, 2).map((item: any) => item.name).join(', ')}
                        {(order.items || []).length > 2 && ` +${(order.items || []).length - 2} more`}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className="text-sm font-semibold text-gray-900">{money(order.total_amount)}</span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className="text-sm text-gray-500 font-mono">{order.total_pv.toFixed(0)}</span>
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={statusVariant[order.status] || 'muted'}>
                        {order.status}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handlePrint(order)}
                          className="text-gray-500 hover:text-primary-600"
                        >
                          <Print className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleWhatsApp(order)}
                          className="text-green-600 hover:text-green-700"
                        >
                          <Send className="w-4 h-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
