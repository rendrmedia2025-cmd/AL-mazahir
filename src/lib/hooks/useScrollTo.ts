'use client';

import { useCallback } from 'react';

export interface ScrollToOptions {
  offset?: number;
  behavior?: ScrollBehavior;
}

/**
 * Custom hook for smooth scrolling to sections
 * Provides consistent scroll behavior across the application
 */
export const useScrollTo = (options: ScrollToOptions = {}) => {
  const { offset = 80, behavior = 'smooth' } = options;

  const scrollToSection = useCallback((target: string | Element) => {
    let element: Element | null = null;

    if (typeof target === 'string') {
      // Handle both selector strings and IDs
      element = target.startsWith('#') 
        ? document.querySelector(target)
        : document.getElementById(target);
    } else {
      element = target;
    }

    if (!element) {
      console.warn(`Element not found: ${target}`);
      return;
    }

    const elementPosition = element.getBoundingClientRect().top;
    const offsetPosition = elementPosition + window.pageYOffset - offset;

    window.scrollTo({
      top: offsetPosition,
      behavior
    });
  }, [offset, behavior]);

  const scrollToTop = useCallback(() => {
    window.scrollTo({
      top: 0,
      behavior
    });
  }, [behavior]);

  return {
    scrollToSection,
    scrollToTop
  };
};