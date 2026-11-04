/**
 * Button — Base button component with variants.
 */

import { ButtonHTMLAttributes, forwardRef } from 'react';
import { cn } from '@/utils/cn';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'ghost' | 'danger' | 'outline';
  size?: 'sm' | 'default' | 'lg';
  asChild?: boolean;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'default', size = 'default', asChild = false, ...props }, ref) => {
    const Comp = asChild ? props.children as any : 'button';

    const variants = {
      default: 'bg-primary-600 text-white hover:bg-primary-700 focus:ring-primary-500 focus:ring-2 focus:ring-offset-2',
      ghost: 'bg-transparent text-primary-700 hover:bg-gray-100 focus:ring-primary-500 focus:ring-2 focus:ring-offset-2',
      danger: 'bg-red-500 text-white hover:bg-red-600 focus:ring-red-500 focus:ring-2 focus:ring-offset-2',
      outline: 'border border-gray-300 bg-transparent text-gray-700 hover:bg-gray-100 focus:ring-primary-500 focus:ring-2 focus:ring-offset-2',
    };

    const sizes = {
      sm: 'px-3 py-1.5 text-xs',
      default: 'px-4 py-2.5 text-sm',
      lg: 'px-6 py-3 text-base',
    };

    return (
      <Comp
        ref={ref}
        className={cn(
          'inline-flex items-center justify-center rounded-full font-semibold transition-all duration-200 active:scale-95 disabled:opacity-50 disabled:pointer-events-none',
          variants[variant],
          sizes[size],
          className
        )}
        {...(asChild ? {} : props)}
      />
    );
  }
);

Button.displayName = 'Button';

export { Button };
