/**
 * Input — Styled input component.
 */

import { HTMLAttributes, forwardRef } from 'react';
import { cn } from '@/utils/cn';

interface InputProps extends HTMLAttributes<HTMLInputElement> {}

const Input = forwardRef<HTMLInputElement, InputProps>(({ className, type, ...props }, ref) => (
  <input
    type={type}
    ref={ref}
    className={cn(
      'flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 disabled:opacity-50 disabled:cursor-not-allowed',
      className
    )}
    {...props}
  />
));

Input.displayName = 'Input';

export { Input };
