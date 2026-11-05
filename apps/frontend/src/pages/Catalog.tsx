/**
 * Catalog - Main point of sale page with product grid, search, filters, and cart.
 */

import { useState, useEffect, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Search, RefreshCw, Filter, AlertCircle } from 'lucide-react';
import { useCartStore } from '@/stores/cart';
import { useSyncStore } from '@/stores/sync';
import { api } from '@/services/api';
import { ProductCard } from '@/components/catalog/ProductCard';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Switch } from '@/components/ui/Switch';
import { cn } from '@/utils/cn';
import { toast } from 'sonner';
import { useAuthStore } from '@/stores/auth';
import { Product } from '@/types';

export function Catalog() {
  const { addItem, setTier, tier } = useCartStore((state) => ({
    addItem: state.addItem,
    setTier: state.setTier,
    tier: state.tier,
  }));
  const { setSyncStatus } = useSyncStore();
  const { isAuthenticated } = useAuthStore();

  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('all');
  const [lowOnly, setLowOnly] = useState(false);
  const [categories, setCategories] = useState<string[]>([]);

  const { data: productsResponse, isLoading, refetch } = useQuery({
    queryKey: ['products', category],
    queryFn: async () => {
      const response = (await api.getProducts({
        category: category !== 'all' ? category : undefined,
      })) as { data?: Product[] };
      return response.data ?? [];
    },
    enabled: isAuthenticated,
  });

  const products: Product[] = productsResponse ?? [];

  // Client-side filtering for search + low-stock
  const filteredProducts = products.filter((p) => {
    if (lowOnly && p.stock_qty > p.low_stock_at) return false;
    if (search) {
      const q = search.toLowerCase();
      return (
        p.name?.toLowerCase().includes(q) ||
        p.sku?.toLowerCase().includes(q) ||
        p.category?.toLowerCase().includes(q)
      );
    }
    return true;
  });

  // Extract unique categories from server data
  useEffect(() => {
    const cats = [...new Set(products.map((p) => p.category))].sort();
    setCategories(cats);
  }, [products]);

  const handleAdd = useCallback(
    (product: Product) => {
      const result = addItem(product);
      if (!result.ok && result.message) {
        toast.error(result.message);
      } else if (result.ok) {
        toast.success(`${product.name} added to cart`);
      }
      return result;
    },
    [addItem]
  );

  const handleSync = async () => {
    try {
      setSyncStatus('syncing');
      await refetch();
      setSyncStatus('online');
      toast.success('Catalog synced');
    } catch {
      setSyncStatus('error');
      toast.error('Sync failed — check API connection');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Point of Sale</h1>
          <p className="text-gray-600">
            {tier === 'member' ? 'Member pricing active' : 'Retail pricing'} ·{' '}
            {isLoading ? 'Loading…' : `${products.length} products in catalogue`}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={handleSync} size="sm">
            <RefreshCw className="w-4 h-4 mr-2" />
            Sync
          </Button>
        </div>
      </div>

      {/* Offline queue notice */}
      <div className="rounded-xl border border-amber-100 bg-amber-50 p-4">
        <div className="flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0" />
          <div className="flex-1">
            <h3 className="text-sm font-semibold text-amber-800">Offline-Ready</h3>
            <p className="text-xs text-amber-700">
              Sales made while offline are queued and sync automatically when connection returns.
            </p>
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            placeholder="Search products or SKU…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>

        <div className="flex items-center gap-3">
          <Switch
            checked={tier === 'member'}
            onCheckedChange={(v) => setTier(v ? 'member' : 'retail')}
          />
          <div className="text-left">
            <span className="text-sm font-medium text-gray-900">Member Pricing</span>
            <p className="text-xs text-gray-500">
              {tier === 'member' ? 'DP price active' : 'MRP retail price'}
            </p>
          </div>
        </div>
      </div>

      {/* Category chips */}
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
        <button
          onClick={() => setCategory('all')}
          className={cn(
            'px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors flex-shrink-0',
            category === 'all'
              ? 'bg-primary-600 text-white'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          )}
        >
          All
        </button>
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setCategory(cat)}
            className={cn(
              'px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors flex-shrink-0',
              category === cat
                ? 'bg-primary-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            )}
          >
            {cat}
          </button>
        ))}
        <button
          onClick={() => setLowOnly(!lowOnly)}
          className={cn(
            'px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors flex-shrink-0 flex items-center',
            lowOnly
              ? 'bg-amber-50 text-amber-700 border border-amber-200'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          )}
        >
          <Filter className="w-3 h-3 mr-1.5" />
          Low Stock
        </button>
      </div>

      {/* Product grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="rounded-xl border border-gray-200 bg-white overflow-hidden animate-pulse">
              <div className="h-48 bg-gray-200" />
              <div className="p-4 space-y-3">
                <div className="h-4 bg-gray-200 rounded w-1/3" />
                <div className="h-4 bg-gray-200 rounded w-3/4" />
                <div className="h-4 bg-gray-200 rounded w-1/2" />
                <div className="h-10 bg-gray-200 rounded" />
              </div>
            </div>
          ))}
        </div>
      ) : filteredProducts.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
            <Search className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No products found</h3>
          <p className="text-gray-500 max-w-xs">
            {products.length === 0
              ? 'Connect to your backend server to load the DXN catalog.'
              : 'Try adjusting your search or filters.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredProducts.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              tier={tier}
              onAdd={handleAdd}
            />
          ))}
        </div>
      )}
    </div>
  );
}
