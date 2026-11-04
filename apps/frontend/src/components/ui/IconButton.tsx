/**
 * IconButton — Icon-only button with optional badge.
 */

import { useState } from 'react';
import { SVGProps } from 'react';
import { cn } from '@/utils/cn';

interface IconButtonProps {
  icon: React.ComponentType<SVGProps<SVGSVGElement>>;
  badge?: number;
  onClick?: () => void;
  className?: string;
}

export function IconButton({ icon: Icon, badge, onClick, className }: IconButtonProps) {
  const [pressed, setPressed] = useState(false);

  return (
    <button
      onClick={(e) => {
        e.preventDefault();
        setPressed(true);
        setTimeout(() => setPressed(false), 150);
        onClick?.();
      }}
      className={cn(
        'relative flex items-center justify-center w-10 h-10 rounded-full border border-gray-200 bg-surface text-gray-600 hover:bg-primary-50 hover:text-primary-700 transition-colors active:scale-90 focus:outline-none focus:ring-2 focus:ring-primary-500/30',
        className
      )}
      aria-label="button"
    >
      <Icon className="w-5 h-5" />
      {badge && badge > 0 && (
        <span className={cn(
          'absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full border border-white bg-red-500 text-white text-[10px] font-bold shadow',
          pressed && 'scale-90'
        )}>
          {badge > 9 ? '9+' : badge}
        </span>
      )}
    </button>
  );
}
