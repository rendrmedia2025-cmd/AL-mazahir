'use client';

import { useState, useEffect } from 'react';

export interface ScrollPosition {
  x: number;
  y: number;
}

/**
 * Custom hook to track scroll position
 * Useful for implementing scroll-based effects like header transparency
 */
export const useScrollPosition = (throttleMs: number = 100) => {
  const [scrollPosition, setScrollPosition] = useState<ScrollPosition>({ x: 0, y: 0 });

  useEffect(() => {
    // Only run on client side
    if (typeof window === 'undefined') return;

    let timeoutId: NodeJS.Timeout | null = null;

    const handleScroll = () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }

      timeoutId = setTimeout(() => {
        setScrollPosition({
          x: window.pageXOffset,
          y: window.pageYOffset
        });
      }, throttleMs);
    };

    window.addEventListener('scroll', handleScroll);

    return () => {
      window.removeEventListener('scroll', handleScroll);
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [throttleMs]);

  // Set initial position in a separate effect
  useEffect(() => {
    if (typeof window !== 'undefined') {
      // Use requestAnimationFrame to avoid synchronous setState in effect
      requestAnimationFrame(() => {
        setScrollPosition({
          x: window.pageXOffset,
          y: window.pageYOffset
        });
      });
    }
  }, []);

  return scrollPosition;
};