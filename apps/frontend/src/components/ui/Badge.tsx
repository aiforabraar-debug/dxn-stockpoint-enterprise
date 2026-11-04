/**
 * Badge — Status badge component with variants.
 */

import { HTMLAttributes } from 'react';
import { cn } from '@/utils/cn';

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: 'ok' | 'warn' | 'danger' | 'info' | 'muted';
}

const variants = {
  ok: 'border-green-100 bg-green-50 text-green-700',
  warn: 'border-amber-100 bg-amber-50 text-amber-700',
  danger: 'border-red-100 bg-red-50 text-red-700',
  info: 'border-blue-100 bg-blue-50 text-blue-700',
  muted: 'border-gray-100 bg-gray-50 text-gray-600',
};

export function Badge({ variant = 'muted', className, ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold',
        variants[variant],
        className
      )}
      {...props}
    />
  );
}
