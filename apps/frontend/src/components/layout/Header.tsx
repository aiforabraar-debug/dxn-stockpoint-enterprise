/**
 * Header — App shell header with brand, navigation, sync status, cart, and account.
 */

import { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Grid, Receipt, Chart, Settings, User, Cart, RefreshCw, Logout } from 'lucide-react';
import { useAuthStore } from '@/stores/auth';
import { useSyncStore } from '@/stores/sync';
import { cn } from '@/utils/cn';
import { Button } from '@/components/ui/Button';
import { IconButton } from '@/components/ui/IconButton';

interface HeaderProps {
  shop: { id: string; name: string; slug: string; currency: string } | null;
  onSignOut: () => void;
}

export function Header({ shop, onSignOut }: HeaderProps) {
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const location = useLocation();
  const auth = useAuthStore();
  const sync = useSyncStore();

  const routes = [
    { path: '/catalog', label: 'Catalogue', icon: Grid },
    { path: '/orders', label: 'Orders', icon: Receipt },
    { path: '/admin', label: 'Admin', icon: Chart },
    { path: '/settings', label: 'Settings', icon: Settings },
  ];

  const syncLabel = (status: string) => {
    switch (status) {
      case 'syncing': return 'Syncing…';
      case 'online': return 'Live';
      case 'pending': return 'Sending…';
      case 'offline': return 'Offline';
      case 'error': return 'Sync error';
      default: return 'Ready';
    }
  };

  const badgeVariant = (status: string) => {
    switch (status) {
      case 'online': return 'bg-green-50 text-green-700 border-green-100';
      case 'pending': return 'bg-amber-50 text-amber-700 border-amber-100';
      case 'offline': return 'bg-red-50 text-red-700 border-red-100';
      case 'error': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-600 border-gray-200';
    }
  };

  return (
    <header className="sticky top-0 z-50 border-b border-gray-200 bg-surface/95 backdrop-blur supports-[backdrop-blur]:bg-surface/80">
      <div className="flex flex-col lg:flex-row gap-0">
        <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-primary-700 to-primary-900 text-white lg:px-6">
          <div className="flex items-center gap-3 flex-1 lg:flex-none">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-accent-500 to-primary-600 text-white shadow-lg">
              <Grid className="w-5 h-5" />
            </div>
            <div className="flex flex-col leading-tight">
              <span className="text-sm font-bold leading-tight">{shop?.name || 'DXN Stockpoint'}</span>
              <span className="text-xs text-primary-100 font-medium uppercase tracking-tighter">
                {auth.isAuthenticated ? 'Admin • Live' : 'Demo Mode'}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 lg:gap-3">
            <IconButton icon={Cart} badge={0} />
            <IconButton icon={User} onClick={() => setUserMenuOpen(true)} />
          </div>
        </div>

        <nav className="flex-1 border-x border-gray-200 bg-gradient-to-r from-primary-700/95 to-primary-900/95 lg:flex lg:items-center lg:justify-center lg:gap-1 lg:px-8">
          {routes.map((route) => {
            const Icon = route.icon;
            const isActive = location.pathname === route.path || location.pathname.startsWith(route.path + '/');
            return (
              <Button
                key={route.path}
                asChild
                variant={isActive ? 'default' : 'ghost'}
                className={cn(
                  'rounded-full px-4 py-2.5 text-sm font-semibold border-transparent lg:px-6',
                  isActive ? 'bg-white text-primary-700 shadow-sm' : 'text-gray-300 hover:text-white hover:bg-white/10'
                )}
              >
                <a href={route.path}>
                  <Icon className="w-4 h-4 mr-2" />
                  {route.label}
                </a>
              </Button>
            );
          })}
        </nav>

        <div className="flex items-center gap-2 px-4 py-3 bg-gradient-to-r from-primary-700 to-primary-900 lg:px-6">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-white/20 bg-white/10">
            <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
            <span className="text-xs font-semibold text-white">{syncLabel(sync.syncStatus)}</span>
            <span className="text-xs font-semibold text-primary-100">
              rev {sync.revision}
            </span>
          </div>
        </div>
      </div>

      {userMenuOpen && (
        <div className="absolute right-4 top-16 w-48 bg-surface border border-gray-200 rounded-xl shadow-lg py-2 z-50 animate-fade-in">
          <Button
            variant="ghost"
            onClick={() => { setUserMenuOpen(false); onSignOut(); }}
            className="w-full justify-start text-left text-sm"
          >
            <Logout className="w-4 h-4 mr-2" />
            Sign out
          </Button>
        </div>
      )}
    </header>
  );
}
