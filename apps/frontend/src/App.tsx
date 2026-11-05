/**
 * App.tsx - Main application shell with routing, auth guards, and global layout.
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
import { Header } from '@/components/layout/Header';
import { BottomNav } from '@/components/layout/BottomNav';
import { CartDrawer } from '@/components/cart/CartDrawer';
import { Loader2 } from 'lucide-react';

const Catalog = lazy(() => import('@/pages/Catalog').then((m) => ({ default: m.Catalog })));
const Orders = lazy(() => import('@/pages/Orders').then((m) => ({ default: m.Orders })));
const Admin = lazy(() => import('@/pages/Admin').then((m) => ({ default: m.Admin })));
const Settings = lazy(() => import('@/pages/Settings').then((m) => ({ default: m.Settings })));
const Login = lazy(() => import('@/pages/Login').then((m) => ({ default: m.Login })));

function AppShell() {
  const location = useLocation();
  const auth = useAuthStore();
  const sync = useSyncStore();
  const isAuthenticated = auth.isAuthenticated;

  return (
    <div className="min-h-screen bg-gray-50">
      {!isAuthenticated ? (
        <Suspense fallback={<div className="flex h-screen items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary-600" /></div>}>
          <Login />
        </Suspense>
      ) : (
        <>
          <Header shop={auth.shop} onSignOut={auth.clearAuth} />

          <main className="relative max-w-7xl mx-auto p-4 md:p-6 pb-24">
            <Suspense fallback={
              <div className="flex h-[400px] items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-primary-600 mr-2" />
                <span className="text-gray-500">Loading…</span>
              </div>
            }>
              <Routes location={location}>
                <Route path="/catalog" element={<Catalog />} />
                <Route path="/orders" element={<Orders />} />
                <Route path="/admin" element={<Admin />} />
                <Route path="/settings" element={<Settings />} />
                <Route path="/" element={<Navigate to="/catalog" replace />} />
                <Route path="/login" element={<Navigate to="/catalog" replace />} />
              </Routes>
            </Suspense>
          </main>

          <BottomNav currentPath={location.pathname} />
          <CartDrawer />

          {/* Sync status indicator (accessible to screen-readers) */}
          <span aria-live="polite" className="sr-only">
            {sync.syncStatus === 'syncing' ? 'Syncing data…' : 'Data in sync'}
          </span>
        </>
      )}
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppShell />
    </BrowserRouter>
  );
}
