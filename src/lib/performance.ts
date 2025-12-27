/**
 * Performance optimization utilities for the corporate website
 * Includes lazy loading, image optimization, bundle optimization helpers,
 * and comprehensive Core Web Vitals monitoring
 */

import React, { useEffect, useRef, useState } from 'react';

/**
 * Core Web Vitals tracking interface
 */
interface WebVitalMetric {
  name: 'CLS' | 'FID' | 'FCP' | 'LCP' | 'TTFB' | 'INP';
  value: number;
  id: string;
  delta: number;
  rating: 'good' | 'needs-improvement' | 'poor';
}

/**
 * Performance monitoring configuration
 */
const PERFORMANCE_CONFIG = {
  // Core Web Vitals thresholds
  thresholds: {
    LCP: { good: 2500, poor: 4000 },
    FID: { good: 100, poor: 300 },
    CLS: { good: 0.1, poor: 0.25 },
    FCP: { good: 1800, poor: 3000 },
    TTFB: { good: 800, poor: 1800 },
    INP: { good: 200, poor: 500 }
  },
  // Sampling rate for performance monitoring
  sampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
  // Enable detailed logging in development
  debug: process.env.NODE_ENV === 'development'
};

/**
 * Enhanced Core Web Vitals tracking
 */
export function trackWebVitals(metric: WebVitalMetric) {
  // Sample based on configuration
  if (Math.random() > PERFORMANCE_CONFIG.sampleRate) return;

  const { name, value, id, delta, rating } = metric;
  
  // Log to console in debug mode
  if (PERFORMANCE_CONFIG.debug) {
    console.log(`[Performance] ${name}: ${value}ms (${rating})`);
  }

  // Send to analytics
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', 'web_vitals', {
      event_category: 'performance',
      event_label: name,
      value: Math.round(value),
      custom_map: {
        metric_id: id,
        metric_delta: delta,
        metric_rating: rating
      }
    });
  }

  // Send to custom performance endpoint for detailed analysis
  if (typeof window !== 'undefined') {
    fetch('/api/performance/metrics', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        metric: name,
        value,
        id,
        delta,
        rating,
        url: window.location.href,
        timestamp: Date.now(),
        userAgent: navigator.userAgent,
        connection: (navigator as any).connection?.effectiveType || 'unknown'
      })
    }).catch(error => {
      if (PERFORMANCE_CONFIG.debug) {
        console.warn('Failed to send performance metric:', error);
      }
    });
  }
}

/**
 * Initialize comprehensive performance monitoring
 */
export function initializePerformanceMonitoring() {
  if (typeof window === 'undefined') return;

  // Track Core Web Vitals using web-vitals library pattern
  const observer = new PerformanceObserver((list) => {
    for (const entry of list.getEntries()) {
      // Largest Contentful Paint
      if (entry.entryType === 'largest-contentful-paint') {
        const value = entry.startTime;
        trackWebVitals({
          name: 'LCP',
          value,
          id: generateMetricId(),
          delta: value,
          rating: getRating('LCP', value)
        });
      }

      // First Input Delay
      if (entry.entryType === 'first-input') {
        const fidEntry = entry as PerformanceEventTiming;
        const value = fidEntry.processingStart - entry.startTime;
        trackWebVitals({
          name: 'FID',
          value,
          id: generateMetricId(),
          delta: value,
          rating: getRating('FID', value)
        });
      }

      // Cumulative Layout Shift
      if (entry.entryType === 'layout-shift') {
        const clsEntry = entry as PerformanceEntry & { hadRecentInput: boolean; value: number };
        if (!clsEntry.hadRecentInput) {
          trackWebVitals({
            name: 'CLS',
            value: clsEntry.value,
            id: generateMetricId(),
            delta: clsEntry.value,
            rating: getRating('CLS', clsEntry.value)
          });
        }
      }

      // First Contentful Paint
      if (entry.entryType === 'paint' && entry.name === 'first-contentful-paint') {
        const value = entry.startTime;
        trackWebVitals({
          name: 'FCP',
          value,
          id: generateMetricId(),
          delta: value,
          rating: getRating('FCP', value)
        });
      }

      // Navigation timing for TTFB
      if (entry.entryType === 'navigation') {
        const navEntry = entry as PerformanceNavigationTiming;
        const value = navEntry.responseStart - navEntry.requestStart;
        trackWebVitals({
          name: 'TTFB',
          value,
          id: generateMetricId(),
          delta: value,
          rating: getRating('TTFB', value)
        });
      }
    }
  });

  // Observe all relevant entry types
  try {
    observer.observe({ 
      entryTypes: [
        'largest-contentful-paint',
        'first-input',
        'layout-shift',
        'paint',
        'navigation'
      ] 
    });
  } catch (error) {
    if (PERFORMANCE_CONFIG.debug) {
      console.warn('Performance observer not supported:', error);
    }
  }

  // Track custom dynamic feature metrics
  trackDynamicFeaturePerformance();
}

/**
 * Track performance of dynamic features
 */
function trackDynamicFeaturePerformance() {
  if (typeof window === 'undefined') return;

  // Track availability indicator loading time
  const trackAvailabilityLoad = () => {
    const startTime = performance.now();
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'childList') {
          const availabilityElements = document.querySelectorAll('[data-availability-indicator]');
          if (availabilityElements.length > 0) {
            const loadTime = performance.now() - startTime;
            trackCustomMetric('availability_load_time', loadTime);
            observer.disconnect();
          }
        }
      });
    });

    observer.observe(document.body, { childList: true, subtree: true });
    
    // Timeout after 10 seconds
    setTimeout(() => observer.disconnect(), 10000);
  };

  // Track form interaction performance
  const trackFormPerformance = () => {
    const forms = document.querySelectorAll('form[data-smart-enquiry]');
    forms.forEach(form => {
      let interactionStart: number;
      
      form.addEventListener('focusin', () => {
        interactionStart = performance.now();
      });
      
      form.addEventListener('submit', () => {
        if (interactionStart) {
          const interactionTime = performance.now() - interactionStart;
          trackCustomMetric('form_interaction_time', interactionTime);
        }
      });
    });
  };

  // Initialize tracking when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      trackAvailabilityLoad();
      trackFormPerformance();
    });
  } else {
    trackAvailabilityLoad();
    trackFormPerformance();
  }
}

/**
 * Track custom performance metrics
 */
export function trackCustomMetric(name: string, value: number, metadata?: Record<string, any>) {
  if (PERFORMANCE_CONFIG.debug) {
    console.log(`[Custom Metric] ${name}: ${value}ms`, metadata);
  }

  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', 'custom_performance', {
      event_category: 'performance',
      event_label: name,
      value: Math.round(value),
      custom_map: metadata
    });
  }
}

/**
 * Generate unique metric ID
 */
function generateMetricId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Get performance rating based on thresholds
 */
function getRating(metric: keyof typeof PERFORMANCE_CONFIG.thresholds, value: number): 'good' | 'needs-improvement' | 'poor' {
  const thresholds = PERFORMANCE_CONFIG.thresholds[metric];
  if (value <= thresholds.good) return 'good';
  if (value <= thresholds.poor) return 'needs-improvement';
  return 'poor';
}

/**
 * Performance monitoring hook for React components
 */
export function usePerformanceMonitoring(componentName: string) {
  const renderStart = useRef<number>(0);
  const [renderTime, setRenderTime] = useState<number>(0);

  useEffect(() => {
    renderStart.current = performance.now();
  }, []);

  useEffect(() => {
    const renderEnd = performance.now();
    const duration = renderEnd - renderStart.current;
    setRenderTime(duration);
    
    if (duration > 16) { // Longer than one frame
      trackCustomMetric(`component_render_time`, duration, { component: componentName });
    }
  });

  return renderTime;
}

/**
 * Intersection Observer hook for lazy loading components
 */
export function useIntersectionObserver(
  options: IntersectionObserverInit = {}
): [React.RefObject<HTMLDivElement | null>, boolean] {
  const [isIntersecting, setIsIntersecting] = useState(false);
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setIsIntersecting(true);
        observer.disconnect();
      }
    }, {
      threshold: 0.1,
      rootMargin: '50px',
      ...options,
    });

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => observer.disconnect();
  }, [options]);

  return [ref, isIntersecting];
}

/**
 * Lazy loading wrapper component with performance tracking
 */
interface LazyLoadProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  className?: string;
  trackingName?: string;
}

export function LazyLoad({ children, fallback = null, className, trackingName }: LazyLoadProps) {
  const [ref, isIntersecting] = useIntersectionObserver();
  const loadStart = useRef<number>(0);

  useEffect(() => {
    if (isIntersecting && trackingName) {
      loadStart.current = performance.now();
    }
  }, [isIntersecting, trackingName]);

  useEffect(() => {
    if (isIntersecting && trackingName && loadStart.current > 0) {
      const loadTime = performance.now() - loadStart.current;
      trackCustomMetric(`lazy_load_time`, loadTime, { component: trackingName });
    }
  }, [isIntersecting, trackingName]);

  return React.createElement(
    'div',
    { ref, className },
    isIntersecting ? children : fallback
  );
}

/**
 * Image optimization helper
 */
export function getOptimizedImageProps(
  src: string,
  alt: string,
  width?: number,
  height?: number
) {
  return {
    src,
    alt,
    width,
    height,
    loading: 'lazy' as const,
    decoding: 'async' as const,
    sizes: width 
      ? `(max-width: 768px) 100vw, (max-width: 1200px) 50vw, ${width}px`
      : '(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw',
    style: {
      maxWidth: '100%',
      height: 'auto',
    },
  };
}

/**
 * Preload critical resources
 */
export function preloadCriticalResources() {
  if (typeof window === 'undefined') return;

  // Preload hero image
  const heroImageLink = document.createElement('link');
  heroImageLink.rel = 'preload';
  heroImageLink.href = '/images/hero-bg.jpg';
  heroImageLink.as = 'image';
  document.head.appendChild(heroImageLink);
}

/**
 * Debounce utility for performance optimization
 */
export function debounce<T extends (...args: unknown[]) => unknown>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

/**
 * Throttle utility for performance optimization
 */
export function throttle<T extends (...args: unknown[]) => unknown>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}

/**
 * Bundle size optimization - dynamic imports
 */
export const dynamicImports = {
  // Lazy load heavy components
  ProductCatalog: () => import('@/components/sections/ProductCatalog'),
  ContactSection: () => import('@/components/sections/ContactSection'),
  Modal: () => import('@/components/ui/Modal'),
  AdminPanel: () => import('@/app/admin/page'),
  TestimonialSlider: () => import('@/components/sections/TestimonialSlider'),
};

/**
 * Resource hints for better loading performance
 */
export function addResourceHints() {
  if (typeof window === 'undefined') return;

  // DNS prefetch for external resources
  const dnsPrefetch = [
    'https://fonts.googleapis.com',
    'https://fonts.gstatic.com',
  ];

  dnsPrefetch.forEach(domain => {
    const link = document.createElement('link');
    link.rel = 'dns-prefetch';
    link.href = domain;
    document.head.appendChild(link);
  });

  // Preconnect to critical third-party origins
  const preconnect = [
    'https://fonts.googleapis.com',
    'https://fonts.gstatic.com',
  ];

  preconnect.forEach(origin => {
    const link = document.createElement('link');
    link.rel = 'preconnect';
    link.href = origin;
    link.crossOrigin = 'anonymous';
    document.head.appendChild(link);
  });
}