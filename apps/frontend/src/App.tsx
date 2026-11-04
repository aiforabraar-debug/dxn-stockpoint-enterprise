/**
 * App.tsx — Main application shell with routing, auth guards, and global layout.
 */

import { Suspense, lazy } from 'react';
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  useLocation,
} from 'react-router-dom';
import { useSyncStore } from '@/stores/sync';
import { useAuthStore } from '@/stores/auth';
import { cn } from '@/utils/cn';
import { Header } from '@/components/layout/Header';
import { BottomNav } from '@/components/layout/BottomNav';
import { CartDrawer } from '@/components/cart/CartDrawer';
import { useCartStore } from '@/stores/cart';
import { toast } from 'sonner';
import { Loader2, RefreshCw } from 'lucide-react';

const Catalog = lazy(() => import('@/pages/Catalog'));
const Orders = lazy(() => import('@/pages/Orders'));
const Admin = lazy(() => import('@/pages/Admin'));
const Settings = lazy(() => import('@/pages/Settings'));
const Login = lazy(() => import('@/pages/Login'));

function requireShop(auth: ReturnType<typeof useAuthStore>) {
  if (!auth.isAuthenticated || !auth.shop) {
    return <Navigate to="/login" replace />;
  }
  return null;
}

function AppShell() {
  const location = useLocation();
  const auth = useAuthStore();
  const sync = useSyncStore();
  const { clearCart } = useCartStore();

  // Listen for auth changes and react
  const isAuthenticated = auth.isAuthenticated;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Not authenticated — show login */}
      {!isAuthenticated ? (
        <Login />
      ) : (
        <>
          {/* Header */}
          <Header shop={auth.shop} onSignOut={auth.clearAuth} />

          {/* Main content */}
          <main className="relative max-w-7xl mx-auto p-4 md:p-6 pb-24">
            <Suspense fallback={
              <div className="flex h-[400px] items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-primary-600 mr-2" />
                <span className="text-muted-foreground">Loading catalogue…</span>
              </div>
            }>
              <Routes location={location}>
                <Route path="/catalog" element={<Catalog />} />
                <Route path="/orders" element={<Orders />} />
                <Route path="/admin" element={<Admin />} />
                <Route path="/settings" element={<Settings />} />
                <Route path="/" element={<Navigate to="/catalog" replace />} />
              </Routes>
            </Suspense>
          </main>

          {/* Bottom navigation (mobile) */}
          <BottomNav currentPath={location.pathname} />

          {/* Cart drawer */}
          <CartDrawer />
        </>
      )}
    </div>
  );
}

export default function App() {
  const auth = useAuthStore();
  const sync = useSyncStore();

  // Check for stored token on load
  // (handled by persist middleware in zustand)

  return (
    <BrowserRouter>
      <AppShell />
    </BrowserRouter>
  );
}
