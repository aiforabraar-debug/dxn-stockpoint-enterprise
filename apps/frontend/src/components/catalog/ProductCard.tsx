/**
 * ProductCard — Product card for the catalogue with add-to-cart.
 */

import { Product } from '@/types';
import { Plus, AlertCircle, Check2 } from 'lucide-react';
import { useCartStore } from '@/stores/cart';
import { money } from '@/utils/format';
import { cn } from '@/utils/cn';
import { Badge } from '@/components/ui/Badge';

interface ProductCardProps {
  product: Product;
  onAdd: (product: Product) => { ok: boolean; message?: string };
}

export function ProductCard({ product, onAdd }: ProductCardProps) {
  const { addItem, getLine } = useCartStore();
  const isAdded = getLine(product.id)?.qty ?? 0 > 0;
  const isOut = product.stock_qty <= 0;

  return (
    <article
      className={cn(
        'group relative flex flex-col rounded-xl border border-gray-200 bg-white overflow-hidden transition-all duration-200 hover:shadow-md',
        isOut && 'opacity-75 border-gray-100 bg-gray-50'
      )}
    >
      {/* Media */}
      <div className="relative h-48 overflow-hidden">
        {product.image_url ? (
          <img
            src={product.image_url}
            alt={product.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full bg-gray-100 flex items-center justify-center">
            <AlertCircle className="w-12 h-12 text-gray-400" />
          </div>
        )}
        {isOut && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
            <span className="text-white font-bold text-sm bg-red-500/80 px-3 py-1 rounded-full">
              Sold Out
            </span>
          </div>
        )}
      </div>

      <div className="p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-medium text-primary-700 uppercase tracking-tighter">
            {product.category}
          </span>
          <Badge variant={product.stock_qty <= product.low_stock_at ? 'warn' : 'ok'}>
            {product.stock_qty} in stock
          </Badge>
        </div>

        <h3 className="font-semibold text-gray-900 leading-tight mb-1">{product.name}</h3>
        <div className="text-xs text-gray-500 mb-3">{product.sku}</div>

        <div className="flex items-center justify-between mb-3">
          <div>
            <span className="text-lg font-bold text-gray-900">
              {money(product.tier === 'member' ? product.member_price : product.retail_price)}
            </span>
            {product.pv_points > 0 && (
              <span className="ml-2 text-xs text-gray-400">{product.pv_points} PV</span>
            )}
          </div>
        </div>

        <button
          onClick={() => {
            const result = onAdd(product);
            if (!result.ok && result.message) {
              // Toast would be shown by parent
            }
          }}
          disabled={isOut || isAdded}
          className={cn(
            'w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg font-semibold transition-all duration-200 disabled:opacity-50 disabled:pointer-events-none',
            isOut
              ? 'bg-gray-100 text-gray-400 border border-gray-200'
              : isAdded
                ? 'bg-green-500 text-white border border-green-200'
                : 'bg-primary-600 text-white border border-transparent hover:bg-primary-700 active:scale-95'
          )}
        >
          {isOut ? (
            <span>Sold Out</span>
          ) : isAdded ? (
            <>
              <Check2 className="w-4 h-4" />
              <span>Added</span>
            </>
          ) : (
            <>
              <Plus className="w-4 h-4" />
              <span>Add</span>
            </>
          )}
        </button>
      </div>
    </article>
  );
}
