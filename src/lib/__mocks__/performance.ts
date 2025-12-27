/**
 * Mock implementation of performance utilities for testing
 */

import React from 'react';

export function useIntersectionObserver() {
  return [{ current: null }, true];
}

export function LazyLoad({ children }: { children: React.ReactNode }) {
  return children;
}

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

export function preloadCriticalResources() {
  return;
}

export function addResourceHints() {
  return;
}

export function measurePerformance() {
  return;
}

export function debounce<T extends (...args: unknown[]) => unknown>(func: T) {
  return func;
}

export function throttle<T extends (...args: unknown[]) => unknown>(func: T) {
  return func;
}

export const dynamicImports = {
  ProductCatalog: () => Promise.resolve({ default: () => null }),
  ContactSection: () => Promise.resolve({ default: () => null }),
  Modal: () => Promise.resolve({ default: () => null }),
};