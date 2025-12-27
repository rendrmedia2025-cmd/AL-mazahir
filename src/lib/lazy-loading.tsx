/**
 * Lazy loading utilities for optimizing JavaScript bundle size
 * Implements code splitting for admin features and non-critical components
 */

import React, { Suspense, lazy, ComponentType } from 'react';
import { trackBusinessMetric, event } from './analytics';

/**
 * Loading fallback components
 */
export const LoadingSpinner = () => (
  <div className="flex items-center justify-center p-8">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
  </div>
);

export const LoadingSkeleton = ({ className = "" }: { className?: string }) => (
  <div className={`animate-pulse bg-gray-200 rounded ${className}`} />
);

export const AdminLoadingFallback = () => (
  <div className="min-h-screen bg-gray-50 flex items-center justify-center">
    <div className="text-center">
      <LoadingSpinner />
      <p className="mt-4 text-gray-600">Loading admin panel...</p>
    </div>
  </div>
);

export const ComponentLoadingFallback = ({ name }: { name: string }) => (
  <div className="flex items-center justify-center p-4">
    <div className="text-center">
      <LoadingSkeleton className="h-4 w-32 mb-2" />
      <p className="text-sm text-gray-500">Loading {name}...</p>
    </div>
  </div>
);

/**
 * Enhanced lazy loading with performance tracking
 */
export function createLazyComponent<T extends ComponentType<any>>(
  importFn: () => Promise<{ default: T }>,
  componentName: string,
  fallback?: React.ComponentType
): React.ComponentType<React.ComponentProps<T>> {
  const LazyComponent = lazy(async () => {
    const startTime = performance.now();
    
    try {
      const module = await importFn();
      const loadTime = performance.now() - startTime;
      
      // Track lazy loading performance
      event({
        action: 'lazy_load_success',
        category: 'performance',
        label: componentName,
        value: Math.round(loadTime)
      });
      
      return module;
    } catch (error) {
      const loadTime = performance.now() - startTime;
      
      // Track failed lazy loading
      event({
        action: 'lazy_load_error',
        category: 'performance',
        label: componentName,
        value: Math.round(loadTime)
      });
      
      throw error;
    }
  });

  const WrappedComponent = (props: React.ComponentProps<T>) => (
    <Suspense fallback={fallback ? React.createElement(fallback) : <ComponentLoadingFallback name={componentName} />}>
      <LazyComponent {...props} />
    </Suspense>
  );

  WrappedComponent.displayName = `Lazy(${componentName})`;
  return WrappedComponent;
}

/**
 * Pre-defined lazy components for common use cases
 */

// Admin components (heavy, only loaded when needed)
export const LazyAdminPanel = createLazyComponent(
  () => import('@/app/admin/page'),
  'AdminPanel',
  AdminLoadingFallback
);

export const LazyAdminLayout = createLazyComponent(
  () => import('@/app/admin/layout'),
  'AdminLayout',
  AdminLoadingFallback
);

export const LazyLeadsPage = createLazyComponent(
  () => import('@/app/admin/leads/page'),
  'LeadsPage',
  AdminLoadingFallback
);

export const LazyAvailabilityPage = createLazyComponent(
  () => import('@/app/admin/availability/page'),
  'AvailabilityPage',
  AdminLoadingFallback
);

export const LazyContentPage = createLazyComponent(
  () => import('@/app/admin/content/page'),
  'ContentPage',
  AdminLoadingFallback
);

// UI components (moderate priority)
export const LazyModal = createLazyComponent(
  () => import('@/components/ui/Modal').then(module => ({ default: module.Modal })),
  'Modal'
);

export const LazyTestimonialSlider = createLazyComponent(
  () => import('@/components/sections/TestimonialSlider'),
  'TestimonialSlider',
  () => <LoadingSkeleton className="h-64 w-full" />
);

// Section components (can be lazy loaded below the fold)
export const LazyContactSection = createLazyComponent(
  () => import('@/components/sections/ContactSection'),
  'ContactSection',
  () => <LoadingSkeleton className="h-96 w-full" />
);

export const LazyProductCatalog = createLazyComponent(
  () => import('@/components/sections/ProductCatalog'),
  'ProductCatalog',
  () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-6">
      {Array.from({ length: 6 }).map((_, i) => (
        <LoadingSkeleton key={i} className="h-48 w-full" />
      ))}
    </div>
  )
);

/**
 * Intersection Observer based lazy loading for components below the fold
 */
export function LazyOnVisible({ 
  children, 
  fallback, 
  rootMargin = '100px',
  threshold = 0.1,
  className = ''
}: {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  rootMargin?: string;
  threshold?: number;
  className?: string;
}) {
  const [isVisible, setIsVisible] = React.useState(false);
  const ref = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin, threshold }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => observer.disconnect();
  }, [rootMargin, threshold]);

  return (
    <div ref={ref} className={className}>
      {isVisible ? children : (fallback || <LoadingSkeleton className="h-32 w-full" />)}
    </div>
  );
}

/**
 * Preload utilities for critical components
 */
export function preloadComponent(importFn: () => Promise<any>) {
  if (typeof window !== 'undefined') {
    // Preload on idle or after a short delay
    if ('requestIdleCallback' in window) {
      window.requestIdleCallback(() => {
        importFn().catch(() => {
          // Ignore preload failures
        });
      });
    } else {
      setTimeout(() => {
        importFn().catch(() => {
          // Ignore preload failures
        });
      }, 100);
    }
  }
}

/**
 * Preload critical components that might be needed soon
 */
export function preloadCriticalComponents() {
  // Preload modal for potential use
  preloadComponent(() => import('@/components/ui/Modal'));
  
  // Preload contact section for users who scroll down
  preloadComponent(() => import('@/components/sections/ContactSection'));
}

/**
 * Bundle size monitoring
 */
export function trackBundleSize() {
  if (typeof window !== 'undefined' && 'performance' in window) {
    // Track resource loading
    window.addEventListener('load', () => {
      const resources = performance.getEntriesByType('resource') as PerformanceResourceTiming[];
      
      let totalJSSize = 0;
      let totalCSSSize = 0;
      
      resources.forEach(resource => {
        if (resource.name.includes('.js')) {
          totalJSSize += resource.transferSize || 0;
        } else if (resource.name.includes('.css')) {
          totalCSSSize += resource.transferSize || 0;
        }
      });
      
      // Track bundle sizes
      trackBusinessMetric('bundle_size_js', totalJSSize / 1024, 'engagement'); // Convert to KB
      trackBusinessMetric('bundle_size_css', totalCSSSize / 1024, 'engagement');
      trackBusinessMetric('bundle_size_total', (totalJSSize + totalCSSSize) / 1024, 'engagement');
      
      // Alert if bundle size exceeds requirements (6.6: not more than 50KB increase)
      const baselineJS = 200; // Assume baseline of 200KB
      if (totalJSSize / 1024 > baselineJS + 50) {
        console.warn(`JS bundle size exceeded target: ${totalJSSize / 1024}KB (target: ${baselineJS + 50}KB)`);
        event({
          action: 'bundle_size_exceeded',
          category: 'performance',
          label: 'js_bundle',
          value: Math.round(totalJSSize / 1024 - baselineJS)
        });
      }
    });
  }
}

/**
 * Initialize lazy loading optimizations
 */
export function initializeLazyLoading() {
  // Track bundle sizes
  trackBundleSize();
  
  // Preload critical components
  preloadCriticalComponents();
  
  console.log('[Lazy Loading] Initialized bundle optimization');
}