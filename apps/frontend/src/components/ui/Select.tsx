/**
 * Select - Styled select component with controlled value support.
 */

import { forwardRef, SelectHTMLAttributes } from 'react';
import { cn } from '@/utils/cn';

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {}

const Select = forwardRef<HTMLSelectElement, SelectProps>(({ className, ...props }, ref) => (
  <select
    ref={ref}
    className={cn(
      'flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 disabled:opacity-50 disabled:cursor-not-allowed',
      className
    )}
    {...props}
  />
));

Select.displayName = 'Select';

export { Select };
