/**
 * BottomNav - Mobile bottom navigation bar.
 */

import { Grid, Receipt, BarChart3, Settings } from 'lucide-react';
import { cn } from '@/utils/cn';

interface BottomNavProps {
  currentPath: string;
}

const NAV_ITEMS = [
  { path: '/catalog', label: 'Catalogue', icon: Grid },
  { path: '/orders', label: 'Orders', icon: Receipt },
  { path: '/admin', label: 'Admin', icon: BarChart3 },
  { path: '/settings', label: 'Settings', icon: Settings },
];

export function BottomNav({ currentPath }: BottomNavProps) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-gray-200 bg-surface/95 backdrop-blur-md px-4 pb-4 pt-3 lg:hidden">
      <div className="flex justify-around">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = currentPath === item.path;
          return (
            <a
              key={item.path}
              href={item.path}
              className={cn(
                'flex flex-col items-center justify-center gap-1 px-3 py-2 rounded-xl transition-colors',
                isActive
                  ? 'bg-primary-50 text-primary-700'
                  : 'text-gray-500 hover:text-primary-700 hover:bg-gray-100'
              )}
            >
              <Icon className={cn('w-5 h-5', isActive ? 'text-primary-700' : 'text-gray-400')} />
              <span className="text-[10px] font-semibold">{item.label}</span>
            </a>
          );
        })}
      </div>
    </nav>
  );
}
