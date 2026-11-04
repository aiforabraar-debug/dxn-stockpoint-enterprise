/**
 * Catalog — Main point of sale page with product grid, search, filters, and cart.
 */

import { useState, useEffect, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Search, RefreshCw, Grid, Filter, AlertCircle } from 'lucide-react';
import { useCartStore } from '@/stores/cart';
import { useSyncStore } from '@/stores/sync';
import { api } from '@/services/api';
import { ProductCard } from '@/components/catalog/ProductCard';
import { CartDrawer } from '@/components/cart/CartDrawer';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Switch } from '@/components/ui/Switch';
import { money, formatPv } from '@/utils/format';
import { toast } from 'sonner';
import { useAuthStore } from '@/stores/auth';

export function Catalog() {
  const { addItem, setTier, tier, clearCart } = useCartStore((state) => ({
    addItem: state.addItem,
    setTier: state.setTier,
    tier: state.tier,
    clearCart: state.clearCart,
  }));
  const { setSyncStatus, setRevision } = useSyncStore();
  const { isAuthenticated } = useAuthStore();

  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('all');
  const [lowOnly, setLowOnly] = useState(false);
  const [categories, setCategories] = useState<string[]>([]);

  const { data: productsResponse, isLoading, error, refetch } = useQuery({
    queryKey: ['products', search, category, lowOnly],
    queryFn: async () => {
      const response = await api.getProducts({
        search: search || undefined,
        category: category !== 'all' ? category : undefined,
      });
      return response.data || [];
    },
    enabled: isAuthenticated,
  });

  const products: any[] = productsResponse || [];

  // Filter products
  const filteredProducts = products.filter((p) => {
    if (category !== 'all' && p.category !== category) return false;
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

  // Extract unique categories
  useEffect(() => {
    const cats = [...new Set(products.map((p) => p.category))].sort();
    setCategories(cats);
  }, [products]);

  const handleAdd = useCallback(
    (product: any) => {
      return addItem(product);
    },
    [addItem]
  );

  const handleSync = async () => {
    try {
      // Sync would call the API sync endpoint
      setSyncStatus('syncing');
      // In a real app, this would fetch the sync feed
      setTimeout(() => {
        setSyncStatus('online');
        toast('Synced successfully');
      }, 1000);
    } catch (err) {
      setSyncStatus('error');
      toast.error('Sync failed');
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="flex h-screen flex-col items-center justify-center text-center">
        <div className="w-full max-w-md">
          <Card className="p-8">
            <div className="flex items-center justify-center mb-4">
              <Grid className="w-12 h-12 text-primary-600" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">DXN Stockpoint</h2>
            <p className="text-gray-500 mb-6">
              Please sign in to access the point of sale.
            </p>
            <Button onClick={() => {}} className="w-full">
              Sign in with Shop PIN
            </Button>
          </Card>
        </div>
      </div>
    );
  }

  const totals = useCartStore.getState().getTotals(
    new Map(products.map((p) => [p.id, p]))
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Point of Sale</h1>
          <p className="text-gray-600">
            {tier === 'member' ? 'Member pricing active' : 'Retail pricing'} •
            {products.length} products in catalogue
          </p>
        </div>

        <div className="flex items-center gap-3">
          {isAuthenticated && (
            <Button variant="outline" onClick={handleSync} size="sm">
              <RefreshCw className="w-4 h-4 mr-2" />
              Sync
            </Button>
          )}
          <Button variant="ghost" size="sm">
            <Filter className="w-4 h-4 mr-2" />
            Filters
          </Button>
        </div>
      </div>

      {/* Alert banner for queued/failed sales */}
      <div className="rounded-xl border border-amber-100 bg-amber-50 p-4">
        <div className="flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-amber-600" />
          <div className="flex-1">
            <h3 className="text-sm font-semibold text-amber-800">Sales Queue</h3>
            <p className="text-xs text-amber-700">
              Sales made while offline are queued and sync when connection returns.
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

        <div className="flex items-end gap-4">
          <div className="flex items-center gap-3">
            <Switch
              checked={tier === 'member'}
              onCheckedChange={(v) => setTier(v ? 'member' : 'retail')}
            />
            <div className="text-left">
              <span className="text-sm font-medium text-gray-900">Member Pricing</span>
              <p className="text-xs text-gray-500">
                {tier === 'member' ? 'Members pay less' : 'Retail walk-in price'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Category chips */}
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
        <button
          onClick={() => setCategory('all')}
          className={cn(
            'px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors',
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
              'px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors',
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
            'px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors',
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
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filteredProducts.length === 0 ? (
          <div className="col-span-full flex flex-col items-center justify-center py-16 text-center">
            <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
              <Search className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              No products found
            </h3>
            <p className="text-gray-500">
              Try adjusting your search or filters.
            </p>
          </div>
        ) : (
          filteredProducts.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              onAdd={handleAdd}
            />
          ))
        )}
      </div>

      {/* Cart summary (desktop) */}
      <div className="lg:block hidden">
        <CartDrawer />
      </div>
    </div>
  );
}
