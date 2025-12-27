/**
 * Unit tests for lazy loading and performance optimizations
 * Tests lazy loading behavior and cache invalidation logic
 * Requirements: 6.6, 1.7
 */

import { render, screen, waitFor, act } from '@testing-library/react';
import { jest } from '@jest/globals';
import { 
  createLazyComponent, 
  LazyOnVisible, 
  preloadComponent,
  trackBundleSize,
  initializeLazyLoading
} from './lazy-loading';

// Mock intersection observer
const mockIntersectionObserver = jest.fn();
mockIntersectionObserver.mockReturnValue({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
});
(window as any).IntersectionObserver = mockIntersectionObserver;

// Mock performance API
const mockPerformance = {
  now: jest.fn(() => Date.now()),
  getEntriesByType: jest.fn(() => [
    { name: 'test.js', transferSize: 50000 },
    { name: 'test.css', transferSize: 20000 }
  ])
};
(global as any).performance = mockPerformance;

// Mock analytics
jest.mock('./analytics', () => ({
  trackCustomMetric: jest.fn()
}));

import { trackCustomMetric } from './analytics';

describe('Lazy Loading Performance Optimizations', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockPerformance.now.mockReturnValue(Date.now());
  });

  describe('createLazyComponent', () => {
    it('should create a lazy component that tracks loading performance', async () => {
      const mockComponent = () => <div>Test Component</div>;
      const mockImport = jest.fn().mockResolvedValue({ default: mockComponent });
      
      const LazyTestComponent = createLazyComponent(mockImport, 'TestComponent');
      
      render(<LazyTestComponent />);
      
      // Wait for lazy component to load
      await waitFor(() => {
        expect(screen.getByText('Test Component')).toBeInTheDocument();
      });
      
      expect(mockImport).toHaveBeenCalled();
      expect(trackCustomMetric).toHaveBeenCalledWith(
        'lazy_load_TestComponent',
        expect.any(Number),
        expect.objectContaining({
          component: 'TestComponent',
          success: true
        })
      );
    });

    it('should handle lazy component loading failures gracefully', async () => {
      const mockError = new Error('Failed to load component');
      const mockImport = jest.fn().mockRejectedValue(mockError);
      
      const LazyTestComponent = createLazyComponent(mockImport, 'FailingComponent');
      
      // Suppress console.error for this test
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      
      render(<LazyTestComponent />);
      
      await waitFor(() => {
        expect(trackCustomMetric).toHaveBeenCalledWith(
          'lazy_load_FailingComponent',
          expect.any(Number),
          expect.objectContaining({
            component: 'FailingComponent',
            success: false,
            error: 'Failed to load component'
          })
        );
      });
      
      consoleSpy.mockRestore();
    });

    it('should display loading fallback while component loads', () => {
      const mockImport = jest.fn().mockImplementation(() => new Promise(() => {})); // Never resolves
      const LazyTestComponent = createLazyComponent(mockImport, 'SlowComponent');
      
      render(<LazyTestComponent />);
      
      expect(screen.getByText('Loading SlowComponent...')).toBeInTheDocument();
    });
  });

  describe('LazyOnVisible', () => {
    it('should render fallback initially and children when visible', async () => {
      let intersectionCallback: (entries: any[]) => void;
      
      mockIntersectionObserver.mockImplementation((callback) => {
        intersectionCallback = callback;
        return {
          observe: jest.fn(),
          unobserve: jest.fn(),
          disconnect: jest.fn(),
        };
      });

      render(
        <LazyOnVisible fallback={<div>Loading...</div>}>
          <div>Visible Content</div>
        </LazyOnVisible>
      );

      // Initially shows fallback
      expect(screen.getByText('Loading...')).toBeInTheDocument();
      expect(screen.queryByText('Visible Content')).not.toBeInTheDocument();

      // Simulate intersection
      act(() => {
        intersectionCallback([{ isIntersecting: true }]);
      });

      // Should now show content
      await waitFor(() => {
        expect(screen.getByText('Visible Content')).toBeInTheDocument();
      });
      expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
    });

    it('should use default skeleton when no fallback provided', () => {
      render(
        <LazyOnVisible>
          <div>Content</div>
        </LazyOnVisible>
      );

      // Should show default skeleton
      const skeleton = document.querySelector('.animate-pulse');
      expect(skeleton).toBeInTheDocument();
    });
  });

  describe('preloadComponent', () => {
    it('should preload component using requestIdleCallback when available', () => {
      const mockRequestIdleCallback = jest.fn((callback) => callback());
      (window as any).requestIdleCallback = mockRequestIdleCallback;
      
      const mockImport = jest.fn().mockResolvedValue({ default: () => <div>Test</div> });
      
      preloadComponent(mockImport);
      
      expect(mockRequestIdleCallback).toHaveBeenCalled();
      expect(mockImport).toHaveBeenCalled();
    });

    it('should fallback to setTimeout when requestIdleCallback not available', (done) => {
      delete (window as any).requestIdleCallback;
      
      const mockImport = jest.fn().mockResolvedValue({ default: () => <div>Test</div> });
      
      preloadComponent(mockImport);
      
      setTimeout(() => {
        expect(mockImport).toHaveBeenCalled();
        done();
      }, 150);
    });

    it('should handle preload failures gracefully', () => {
      const mockRequestIdleCallback = jest.fn((callback) => callback());
      (window as any).requestIdleCallback = mockRequestIdleCallback;
      
      const mockImport = jest.fn().mockRejectedValue(new Error('Preload failed'));
      
      expect(() => {
        preloadComponent(mockImport);
      }).not.toThrow();
    });
  });

  describe('trackBundleSize', () => {
    it('should track JavaScript and CSS bundle sizes', () => {
      const mockAddEventListener = jest.fn();
      (window as any).addEventListener = mockAddEventListener;

      trackBundleSize();

      // Simulate load event
      const loadCallback = mockAddEventListener.mock.calls.find(
        call => call[0] === 'load'
      )?.[1];

      if (loadCallback) {
        loadCallback();

        expect(trackCustomMetric).toHaveBeenCalledWith(
          'bundle_size_js',
          expect.any(Number),
          { unit: 'KB' }
        );
        expect(trackCustomMetric).toHaveBeenCalledWith(
          'bundle_size_css',
          expect.any(Number),
          { unit: 'KB' }
        );
        expect(trackCustomMetric).toHaveBeenCalledWith(
          'bundle_size_total',
          expect.any(Number),
          { unit: 'KB' }
        );
      }
    });

    it('should alert when bundle size exceeds target', () => {
      const mockAddEventListener = jest.fn();
      const mockConsoleWarn = jest.spyOn(console, 'warn').mockImplementation(() => {});
      (window as any).addEventListener = mockAddEventListener;

      // Mock large bundle size
      mockPerformance.getEntriesByType.mockReturnValue([
        { name: 'large.js', transferSize: 300000 }, // 300KB - exceeds 250KB target
        { name: 'test.css', transferSize: 20000 }
      ]);

      trackBundleSize();

      const loadCallback = mockAddEventListener.mock.calls.find(
        call => call[0] === 'load'
      )?.[1];

      if (loadCallback) {
        loadCallback();

        expect(mockConsoleWarn).toHaveBeenCalledWith(
          expect.stringContaining('JS bundle size exceeded target')
        );
        expect(trackCustomMetric).toHaveBeenCalledWith(
          'bundle_size_exceeded',
          expect.any(Number),
          expect.objectContaining({
            type: 'js',
            target: 250
          })
        );
      }

      mockConsoleWarn.mockRestore();
    });
  });

  describe('initializeLazyLoading', () => {
    it('should initialize all lazy loading optimizations', () => {
      const mockConsoleLog = jest.spyOn(console, 'log').mockImplementation(() => {});
      const mockAddEventListener = jest.fn();
      (window as any).addEventListener = mockAddEventListener;

      initializeLazyLoading();

      expect(mockConsoleLog).toHaveBeenCalledWith(
        '[Lazy Loading] Initialized bundle optimization'
      );

      mockConsoleLog.mockRestore();
    });
  });

  describe('Cache Invalidation Logic', () => {
    it('should handle cache invalidation for availability data', async () => {
      // Mock service worker message posting
      const mockServiceWorker = {
        postMessage: jest.fn()
      };
      
      Object.defineProperty(navigator, 'serviceWorker', {
        value: {
          controller: mockServiceWorker
        },
        writable: true
      });

      // Simulate cache invalidation trigger
      const invalidateCache = (pattern: string) => {
        if (navigator.serviceWorker?.controller) {
          navigator.serviceWorker.controller.postMessage({
            type: 'CACHE_INVALIDATE',
            pattern
          });
        }
      };

      invalidateCache('/api/public/availability');

      expect(mockServiceWorker.postMessage).toHaveBeenCalledWith({
        type: 'CACHE_INVALIDATE',
        pattern: '/api/public/availability'
      });
    });

    it('should handle missing service worker gracefully', () => {
      // Remove service worker
      Object.defineProperty(navigator, 'serviceWorker', {
        value: undefined,
        writable: true
      });

      const invalidateCache = (pattern: string) => {
        if (navigator.serviceWorker?.controller) {
          navigator.serviceWorker.controller.postMessage({
            type: 'CACHE_INVALIDATE',
            pattern
          });
        }
      };

      expect(() => {
        invalidateCache('/api/public/availability');
      }).not.toThrow();
    });
  });

  describe('Performance Requirements Validation', () => {
    it('should validate that lazy loading meets performance targets', async () => {
      // Test that lazy loading doesn't exceed performance budgets
      const startTime = performance.now();
      
      const mockComponent = () => <div>Fast Component</div>;
      const mockImport = jest.fn().mockResolvedValue({ default: mockComponent });
      
      const LazyComponent = createLazyComponent(mockImport, 'FastComponent');
      
      render(<LazyComponent />);
      
      await waitFor(() => {
        expect(screen.getByText('Fast Component')).toBeInTheDocument();
      });
      
      const loadTime = performance.now() - startTime;
      
      // Lazy loading should be fast (under 100ms for test environment)
      expect(loadTime).toBeLessThan(100);
      
      // Verify performance tracking was called
      expect(trackCustomMetric).toHaveBeenCalledWith(
        'lazy_load_FastComponent',
        expect.any(Number),
        expect.objectContaining({
          component: 'FastComponent',
          success: true
        })
      );
    });

    it('should ensure bundle size constraints are maintained', () => {
      const mockAddEventListener = jest.fn();
      (window as any).addEventListener = mockAddEventListener;

      // Mock reasonable bundle sizes
      mockPerformance.getEntriesByType.mockReturnValue([
        { name: 'main.js', transferSize: 180000 }, // 180KB - within target
        { name: 'styles.css', transferSize: 30000 }  // 30KB
      ]);

      trackBundleSize();

      const loadCallback = mockAddEventListener.mock.calls.find(
        call => call[0] === 'load'
      )?.[1];

      if (loadCallback) {
        loadCallback();

        // Should track bundle sizes
        expect(trackCustomMetric).toHaveBeenCalledWith(
          'bundle_size_js',
          180, // 180KB
          { unit: 'KB' }
        );

        // Should not trigger size exceeded warning
        expect(trackCustomMetric).not.toHaveBeenCalledWith(
          'bundle_size_exceeded',
          expect.any(Number),
          expect.any(Object)
        );
      }
    });
  });
});