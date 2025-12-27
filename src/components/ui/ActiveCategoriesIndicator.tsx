'use client';

import React from 'react';
import { AnimatedCounter } from '@/components/ui/AnimatedCounter';
import { useActiveCategories } from '@/lib/hooks/useActiveCategories';

interface ActiveCategoriesIndicatorProps {
  /** Display variant */
  variant?: 'compact' | 'detailed' | 'badge';
  /** Custom CSS classes */
  className?: string;
  /** Show loading state */
  showLoading?: boolean;
}

export const ActiveCategoriesIndicator: React.FC<ActiveCategoriesIndicatorProps> = ({
  variant = 'detailed',
  className = '',
  showLoading = true
}) => {
  const { activeCount, loading, error } = useActiveCategories();

  // Handle loading state - mobile optimized
  if (loading && showLoading) {
    return (
      <div className={`animate-pulse ${className}`}>
        {variant === 'badge' ? (
          <div className="inline-flex items-center px-3 py-1 rounded-full bg-gray-200">
            <div className="w-4 h-4 bg-gray-300 rounded mr-2"></div>
            <div className="w-12 sm:w-16 h-4 bg-gray-300 rounded"></div>
          </div>
        ) : (
          <div className="text-center">
            <div className="w-10 sm:w-12 h-6 sm:h-8 bg-gray-200 rounded mx-auto mb-2"></div>
            <div className="w-20 sm:w-24 h-4 bg-gray-200 rounded mx-auto"></div>
          </div>
        )}
      </div>
    );
  }

  // Handle error state with fallback
  if (error) {
    console.warn('ActiveCategoriesIndicator error:', error);
    // Continue with fallback value instead of showing error to user
  }

  // Compact variant - just the number - with accessibility
  if (variant === 'compact') {
    return (
      <span 
        className={`font-bold text-brand-orange-500 ${className}`}
        role="status"
        aria-label={`${activeCount} active product categories available`}
      >
        <AnimatedCounter
          target={activeCount}
          duration={1500}
        />
      </span>
    );
  }

  // Badge variant - inline badge style - mobile optimized with accessibility
  if (variant === 'badge') {
    return (
      <div 
        className={`inline-flex items-center px-2 sm:px-3 py-1 rounded-full bg-brand-orange-100 text-brand-orange-700 text-xs sm:text-sm font-medium ${className}`}
        role="status"
        aria-label={`${activeCount} active product categories available`}
      >
        <div className="w-2 h-2 bg-brand-orange-500 rounded-full mr-1 sm:mr-2 animate-pulse" aria-hidden="true"></div>
        <AnimatedCounter
          target={activeCount}
          duration={1500}
          className="mr-1"
        />
        <span className="hidden sm:inline">Active Categories</span>
        <span className="sm:hidden">Active</span>
      </div>
    );
  }

  // Detailed variant - full display with description - mobile optimized with accessibility
  return (
    <div 
      className={`text-center ${className}`}
      role="status"
      aria-label={`${activeCount} active supply categories with comprehensive industrial solutions available`}
    >
      <div className="mb-2">
        <AnimatedCounter
          target={activeCount}
          duration={2000}
          className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl text-brand-orange-500 font-bold block"
        />
      </div>
      <h3 className="text-base sm:text-lg md:text-xl text-brand-navy-900 mb-1 font-semibold">
        Active Supply Categories
      </h3>
      <p className="text-sm sm:text-base text-brand-navy-600 text-readable">
        <span className="hidden sm:inline">Comprehensive industrial solutions available now</span>
        <span className="sm:hidden">Industrial solutions available</span>
      </p>
      <div className="mt-2 flex justify-center">
        <div className="w-2 h-2 bg-brand-orange-500 rounded-full animate-pulse" aria-hidden="true"></div>
      </div>
    </div>
  );
};

export default ActiveCategoriesIndicator;