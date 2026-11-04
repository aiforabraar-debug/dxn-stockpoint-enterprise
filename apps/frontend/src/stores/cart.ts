/**
 * Cart store — Zustand-based client-side cart state.
 * Persists to localStorage so carts survive page reloads.
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { Product, CartLine, CartTotals } from '@/types';
import { money } from '@/utils/format';

export interface CartState {
  tier: 'member' | 'retail';
  lines: Map<string, { productId: string; qty: number }>;
  customerName: string;
  customerPhone: string;
  dxnMemberId: string;
  paymentMethod: 'CASH' | 'BKASH' | 'NAGAD' | 'CARD' | 'BANK_TRANSFER';
  discount: number;
  note: string;

  // Actions
  setTier: (tier: 'member' | 'retail') => void;
  addItem: (product: Product, qty?: number) => { ok: boolean; message?: string };
  removeItem: (productId: string) => void;
  setQty: (productId: string, qty: number) => void;
  clearCart: () => void;
  setCustomer: (patch: Partial<{
    customerName: string;
    customerPhone: string;
    dxnMemberId: string;
    paymentMethod: string;
    discount: number;
    note: string;
  }>) => void;
  getTotals: (products: Map<string, Product>) => CartTotals;
  getLine: (productId: string) => { productId: string; qty: number } | undefined;
}

const DEFAULT_STATE = {
  tier: 'retail' as const,
  lines: new Map<string, { productId: string; qty: number }>(),
  customerName: 'Walk-in customer',
  customerPhone: '',
  dxnMemberId: '',
  paymentMethod: 'CASH' as const,
  discount: 0,
  note: '',
};

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      ...DEFAULT_STATE,

      setTier: (tier) => set({ tier }),

      addItem: (product, qty = 1) => {
        const state = get();
        const existing = state.lines.get(product.id);
        const nextQty = (existing?.qty || 0) + qty;

        if (nextQty > product.stock_qty) {
          return {
            ok: false,
            message: `Only ${product.stock_qty} left of ${product.name}.`,
          };
        }

        const lines = new Map(state.lines);
        if (nextQty <= 0) {
          lines.delete(product.id);
        } else {
          lines.set(product.id, { productId: product.id, qty: nextQty });
        }

        set({ lines });
        return { ok: true };
      },

      removeItem: (productId) => {
        const lines = new Map(get().lines);
        lines.delete(productId);
        set({ lines });
      },

      setQty: (productId, qty) => {
        const lines = new Map(get().lines);
        const target = Math.max(0, Math.round(qty));
        if (target <= 0) {
          lines.delete(productId);
        } else {
          lines.set(productId, { productId, qty: target });
        }
        set({ lines });
      },

      clearCart: () => set({ ...DEFAULT_STATE, lines: new Map() }),

      setCustomer: (patch) => {
        set({ ...patch });
      },

      getTotals: (products) => {
        const lines: CartLine[] = [];
        let subtotal = 0;
        let discount = 0;
        let totalPv = 0;
        let units = 0;

        for (const [productId, line] of get().lines) {
          const product = products.get(productId);
          if (!product) continue;

          const price = get().tier === 'member' ? product.member_price : product.retail_price;
          const pv = product.pv_points;
          const lineTotal = price * line.qty;
          const linePv = pv * line.qty;

          lines.push({
            productId: product.id,
            product,
            qty: line.qty,
            price,
            pv,
            lineTotal,
            linePv,
            available: product.stock_qty,
          });

          subtotal += lineTotal;
          totalPv += linePv;
          units += line.qty;
        }

        discount = Math.min(get().discount, subtotal);
        const total = Math.max(0, subtotal - discount);

        return {
          lines,
          subtotal,
          discount,
          total,
          pv: totalPv,
          units,
          count: lines.length,
        };
      },

      getLine: (productId) => {
        return get().lines.get(productId);
      },
    }),
    {
      name: 'dxn-cart-v2',
      storage: createJSONStorage(() => localStorage),
      // Custom serializer to handle Map
      serialize: (state) => {
        const linesArray = Array.from(state.lines.entries());
        return JSON.stringify({ ...state, lines: linesArray });
      },
      deserialize: (str) => {
        const parsed = JSON.parse(str);
        if (parsed.lines && Array.isArray(parsed.lines)) {
          parsed.lines = new Map(parsed.lines);
        }
        return parsed;
      },
      partialize: (state) => ({
        tier: state.tier,
        lines: state.lines,
        customerName: state.customerName,
        customerPhone: state.customerPhone,
        dxnMemberId: state.dxnMemberId,
        paymentMethod: state.paymentMethod,
        discount: state.discount,
        note: state.note,
      }),
    }
  )
);
