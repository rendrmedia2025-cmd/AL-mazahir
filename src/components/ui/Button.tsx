import React from 'react';
import { cn } from '@/lib/utils';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  children: React.ReactNode;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', children, ...props }, ref) => {
    const baseStyles = 'inline-flex items-center justify-center font-semibold transition-all duration-200 ease-in-out focus-ring disabled:pointer-events-none disabled:opacity-50 touch-target text-readable transform hover:-translate-y-0.5 active:translate-y-0';
    
    const variants = {
      primary: 'button-primary shadow-md hover:shadow-lg',
      secondary: 'button-secondary',
      outline: 'border-2 border-brand-red-600 text-brand-red-600 bg-transparent hover:bg-brand-red-50 hover:border-brand-red-700 hover:text-brand-red-700 focus:ring-brand-red-500 active:bg-brand-red-100 rounded-md',
      ghost: 'text-brand-navy-700 bg-transparent hover:bg-brand-navy-50 hover:text-brand-navy-900 focus:ring-brand-navy-500 active:bg-brand-navy-100 rounded-md'
    };
    
    const sizes = {
      sm: 'h-11 px-4 text-sm min-w-[88px] gap-2', 
      md: 'h-12 px-6 py-3 min-w-[120px] gap-2', 
      lg: 'h-14 px-8 text-lg min-w-[140px] gap-3' 
    };
    
    return (
      <button
        className={cn(
          baseStyles,
          variants[variant],
          sizes[size],
          className
        )}
        ref={ref}
        {...props}
      >
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';

export { Button };