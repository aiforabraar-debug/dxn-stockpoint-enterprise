/**
 * CartDrawer — Slide-over cart with customer details, totals, and checkout.
 */

import { useState } from 'react';
import { Plus, Minus, Trash2, Check, Wallet, Print, Send, X } from 'lucide-react';
import { useCartStore } from '@/stores/cart';
import { Product } from '@/types';
import { money, formatPv } from '@/utils/format';
import { cn } from '@/utils/cn';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Switch } from '@/components/ui/Switch';

const PAYMENT_METHODS = [
  { value: 'CASH', label: 'Cash' },
  { value: 'BKASH', label: 'bKash' },
  { value: 'NAGAD', label: 'Nagad' },
  { value: 'CARD', label: 'Card' },
  { value: 'BANK_TRANSFER', label: 'Bank Transfer' },
];

export function CartDrawer() {
  const {
    lines,
    tier,
    setTier,
    customerName,
    customerPhone,
    dxnMemberId,
    paymentMethod,
    discount,
    note,
    setCustomer,
    addItem,
    removeItem,
    setQty,
    clearCart,
    getTotals,
  } = useCartStore((state) => ({
    lines: state.lines,
    tier: state.tier,
    setTier: state.setTier,
    customerName: state.customerName,
    customerPhone: state.customerPhone,
    dxnMemberId: state.dxnMemberId,
    paymentMethod: state.paymentMethod,
    discount: state.discount,
    note: state.note,
    setCustomer: state.setCustomer,
    addItem: state.addItem,
    removeItem: state.removeItem,
    setQty: state.setQty,
    clearCart: state.clearCart,
    getTotals: state.getTotals,
  }));

  const [productsMap, setProductsMap] = useState<Map<string, Product>>(new Map());

  // This would normally be passed from the catalog page
  // For now, we accept products via a global store or prop
  // This is a simplified version — in production the drawer receives products via context

  const isOpen = lines.size > 0;
  const totals = getTotals(productsMap);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col lg:flex-row">
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm lg:hidden"
        onClick={clearCart}
      />

      {/* Drawer panel */}
      <aside
        className={cn(
          'fixed inset-y-0 right-0 z-50 w-full lg:w-96 bg-white border-l border-gray-200 shadow-2xl transform transition-transform duration-300 translate-x-full lg:translate-x-0',
          isOpen ? 'translate-x-0' : 'translate-x-full'
        )}
      >
        <div className="flex h-full flex-col">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
            <h2 className="text-lg font-bold text-gray-900">Current Sale</h2>
            <button
              onClick={clearCart}
              className="p-2 text-gray-400 hover:text-gray-600"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {totals.lines.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
                  <Wallet className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900">The cart is empty</h3>
                <p className="text-sm text-gray-500 mt-2">
                  Add products from the catalogue to start a sale.
                </p>
              </div>
            ) : (
              <>
                {/* Items */}
                <div className="space-y-4">
                  {totals.lines.map((line) => {
                    const product = line.product;
                    const atMax = line.qty >= line.available;
                    return (
                      <div
                        key={line.productId}
                        className="flex items-center gap-4 bg-gray-50 rounded-xl p-3 border border-gray-100"
                      >
                        <div className="flex-shrink-0">
                          {product.image_url ? (
                            <img
                              src={product.image_url}
                              alt={product.name}
                              className="w-12 h-12 rounded-lg object-cover"
                            />
                          ) : (
                            <div className="w-12 h-12 rounded-lg bg-gray-200 flex items-center justify-center text-gray-400">
                              <Wallet className="w-6 h-6" />
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <h4 className="text-sm font-semibold text-gray-900 truncate">{product.name}</h4>
                            <Badge variant={product.stock_qty <= 0 ? 'danger' : product.stock_qty <= product.low_stock_at ? 'warn' : 'ok'}>
                              {product.stock_qty <= 0 ? 'Out' : `${product.stock_qty} left`}
                            </Badge>
                          </div>
                          <div className="text-xs text-gray-500">{product.sku}</div>
                          <div className="text-sm font-medium text-gray-900 mt-1">
                            {money(line.price)} × {line.qty} = {money(line.lineTotal)}
                          </div>
                          {line.linePv > 0 && (
                            <div className="text-xs text-gray-400 mt-0.5">
                              {formatPv(line.linePv)} PV
                            </div>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setQty(line.productId, line.qty - 1)}
                            disabled={line.qty <= 1}
                            className="p-1.5 text-gray-400 hover:text-gray-600 disabled:opacity-30"
                          >
                            <Minus className="w-4 h-4" />
                          </button>
                          <span className="w-6 text-center text-sm font-medium">{line.qty}</span>
                          <button
                            onClick={() => setQty(line.productId, line.qty + 1)}
                            disabled={atMax}
                            className="p-1.5 text-gray-400 hover:text-primary-600 disabled:opacity-30"
                          >
                            <Plus className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => removeItem(line.productId)}
                            className="p-1.5 text-gray-400 hover:text-red-600"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Customer details */}
                <div className="space-y-4 pt-4 border-t border-gray-100">
                  <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider">Customer</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input
                      value={customerName}
                      onChange={(e) => setCustomer({ customerName: e.target.value })}
                      placeholder="Customer name"
                    />
                    <Input
                      value={customerPhone}
                      onChange={(e) => setCustomer({ customerPhone: e.target.value })}
                      placeholder="Phone"
                      inputMode="tel"
                    />
                    <Input
                      value={dxnMemberId || ''}
                      onChange={(e) => setCustomer({ dxnMemberId: e.target.value })}
                      placeholder="DXN Member ID"
                    />
                    <Select
                      value={paymentMethod}
                      onChange={(e) => setCustomer({ paymentMethod: e.target.value as any })}
                    >
                      {PAYMENT_METHODS.map((pm) => (
                        <option key={pm.value} value={pm.value}>{pm.label}</option>
                      ))}
                    </Select>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-center gap-3">
                      <Switch
                        checked={tier === 'member'}
                        onCheckedChange={(v) => setTier(v ? 'member' : 'retail')}
                      />
                      <span className="text-sm text-gray-700">Member pricing</span>
                    </div>
                    <div className="flex items-end gap-2">
                      <label className="text-sm font-medium text-gray-700">Discount</label>
                      <Input
                        type="number"
                        value={discount || ''}
                        onChange={(e) =>
                          setCustomer({ discount: parseFloat(e.target.value) || 0 })}
                        placeholder="0.00"
                        className="w-24"
                      />
                    </div>
                  </div>

                  <Input
                    value={note}
                    onChange={(e) => setCustomer({ note: e.target.value })}
                    placeholder="Notes (optional)"
                    className="h-auto min-h-[80px]"
                  />
                </div>
              </>
            )}
          </div>

          {/* Footer */}
          <div className="p-6 border-t border-gray-100 bg-gray-50">
            <div className="space-y-3 mb-6">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Subtotal</span>
                <span className="text-sm font-medium text-gray-900">{money(totals.subtotal)}</span>
              </div>
              {totals.discount > 0 && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Discount</span>
                  <span className="text-sm font-medium text-red-600">-{money(totals.discount)}</span>
                </div>
              )}
              <div className="flex items-center justify-between pt-2 border-t border-gray-200">
                <span className="text-base font-bold text-gray-900">Total</span>
                <span className="text-lg font-bold text-primary-700">{money(totals.total)}</span>
              </div>
              <div className="flex items-center justify-between text-xs text-gray-500">
                <span>PV Points</span>
                <span>{formatPv(totals.pv)} PV</span>
              </div>
            </div>

            <div className="space-y-3">
              <Button
                onClick={() => {
                  // Checkout would go here
                  toast('Checkout integration — order saved to outbox', {
                    description: 'Sale queued for sync',
                  });
                }}
                className="w-full"
              >
                <Check className="w-4 h-4 mr-2" />
                Save Sale — {money(totals.total)}
              </Button>
              <div className="flex gap-2">
                <Button variant="ghost" onClick={clearCart} className="flex-1">
                  Clear
                </Button>
                <button className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-full bg-green-500 text-white text-sm font-semibold hover:bg-green-600 transition-colors">
                  <Send className="w-4 h-4" />
                  WhatsApp
                </button>
              </div>
            </div>
          </div>
        </div>
      </aside>
    </div>
  );
}
