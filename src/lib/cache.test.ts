/**
 * Unit tests for cache invalidation logic
 * Tests ISR cache management and invalidation triggers
 * Requirements: 6.6, 1.7
 */

import { jest } from '@jest/globals';
import {
  invalidateAvailabilityCache,
  invalidateCategoriesCache,
  invalidateContentCache,
  getCacheHeaders,
  createCachedResponse,
  warmAvailabilityCache,
  getCacheStatus,
  handleCacheInvalidation,
  trackCachePerformance,
  CACHE_DURATIONS,
  CACHE_TAGS
} from './cache';

// Mock Next.js revalidation functions
jest.mock('next/cache', () => ({
  revalidateTag: jest.fn(),
  revalidatePath: jest.fn()
}));

import { revalidateTag, revalidatePath } from 'next/cache';

// Mock fetch for cache warming
const mockFetch = jest.fn();
(global as any).fetch = mockFetch;

// Mock console methods
const mockConsole = {
  log: jest.fn(),
  warn: jest.fn(),
  error: jest.fn()
};
(global as any).console = mockConsole;

// Mock analytics
jest.mock('./analytics', () => ({
  trackCustomMetric: jest.fn()
}));

// Mock window.gtag
(global as any).window = {
  gtag: jest.fn()
};

describe('Cache Management', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockFetch.mockResolvedValue({ ok: true });
    process.env.NEXT_PUBLIC_SITE_URL = 'https://test.com';
  });

  describe('Cache Invalidation', () => {
    it('should invalidate availability cache correctly', async () => {
      await invalidateAvailabilityCache();

      expect(revalidateTag).toHaveBeenCalledWith(CACHE_TAGS.AVAILABILITY);
      expect(revalidatePath).toHaveBeenCalledWith('/api/public/availability');
      expect(revalidatePath).toHaveBeenCalledWith('/');
      expect(mockConsole.log).toHaveBeenCalledWith('Availability cache invalidated');
    });

    it('should handle cache invalidation errors gracefully', async () => {
      const mockError = new Error('Revalidation failed');
      (revalidateTag as jest.Mock).mockRejectedValue(mockError);

      await invalidateAvailabilityCache();

      expect(mockConsole.error).toHaveBeenCalledWith(
        'Failed to invalidate availability cache:',
        mockError
      );
    });

    it('should invalidate categories cache correctly', async () => {
      await invalidateCategoriesCache();

      expect(revalidateTag).toHaveBeenCalledWith(CACHE_TAGS.CATEGORIES);
      expect(revalidatePath).toHaveBeenCalledWith('/api/public/availability');
      expect(revalidatePath).toHaveBeenCalledWith('/');
      expect(mockConsole.log).toHaveBeenCalledWith('Categories cache invalidated');
    });

    it('should invalidate content cache correctly', async () => {
      await invalidateContentCache();

      expect(revalidateTag).toHaveBeenCalledWith(CACHE_TAGS.CONTENT);
      expect(revalidatePath).toHaveBeenCalledWith('/');
      expect(mockConsole.log).toHaveBeenCalledWith('Content cache invalidated');
    });
  });

  describe('Cache Headers Generation', () => {
    it('should generate correct cache headers with duration', () => {
      const duration = 300; // 5 minutes
      const headers = getCacheHeaders(duration);

      expect(headers).toEqual({
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=60',
        'CDN-Cache-Control': 'public, s-maxage=300',
        'Vary': 'Accept-Encoding'
      });
    });

    it('should include cache tags when provided', () => {
      const duration = 300;
      const tags = ['availability', 'categories'];
      const headers = getCacheHeaders(duration, tags);

      expect(headers['Cache-Tag']).toBe('availability,categories');
    });

    it('should calculate stale-while-revalidate correctly', () => {
      const duration = 1000;
      const headers = getCacheHeaders(duration);

      expect(headers['Cache-Control']).toContain('stale-while-revalidate=200');
    });
  });

  describe('Cached Response Creation', () => {
    it('should create cached response with correct structure', () => {
      const testData = { test: 'data' };
      const duration = CACHE_DURATIONS.AVAILABILITY;
      const tags = [CACHE_TAGS.AVAILABILITY];

      const response = createCachedResponse(testData, true, duration, tags);

      expect(response.body).toEqual({
        success: true,
        data: testData,
        cached: true,
        cacheExpiry: expect.any(String),
        timestamp: expect.any(String)
      });

      expect(response.headers).toEqual({
        'Cache-Control': `public, s-maxage=${duration}, stale-while-revalidate=${Math.floor(duration / 5)}`,
        'CDN-Cache-Control': `public, s-maxage=${duration}`,
        'Vary': 'Accept-Encoding',
        'Cache-Tag': tags.join(',')
      });
    });

    it('should handle failed responses correctly', () => {
      const errorData = { error: 'Something went wrong' };
      const response = createCachedResponse(errorData, false);

      expect(response.body.success).toBe(false);
      expect(response.body.data).toEqual(errorData);
    });

    it('should use default duration when not specified', () => {
      const response = createCachedResponse({ test: 'data' });
      const expectedDuration = CACHE_DURATIONS.API_GENERAL;

      expect(response.headers['Cache-Control']).toContain(`s-maxage=${expectedDuration}`);
    });
  });

  describe('Cache Warming', () => {
    it('should warm availability cache successfully', async () => {
      mockFetch.mockResolvedValue({ ok: true });

      await warmAvailabilityCache();

      expect(mockFetch).toHaveBeenCalledWith(
        'https://test.com/api/public/availability',
        {
          method: 'GET',
          headers: {
            'User-Agent': 'Cache-Warmer/1.0'
          }
        }
      );
      expect(mockConsole.log).toHaveBeenCalledWith('Availability cache warmed successfully');
    });

    it('should handle cache warming failures', async () => {
      mockFetch.mockResolvedValue({ ok: false, status: 500 });

      await warmAvailabilityCache();

      expect(mockConsole.warn).toHaveBeenCalledWith(
        'Failed to warm availability cache:',
        500
      );
    });

    it('should handle network errors during cache warming', async () => {
      const networkError = new Error('Network error');
      mockFetch.mockRejectedValue(networkError);

      await warmAvailabilityCache();

      expect(mockConsole.error).toHaveBeenCalledWith(
        'Error warming availability cache:',
        networkError
      );
    });
  });

  describe('Cache Status Detection', () => {
    it('should detect cached responses correctly', () => {
      const headers = new Headers({
        'cache-control': 'public, s-maxage=300',
        'age': '150'
      });

      const status = getCacheStatus(headers);

      expect(status).toEqual({
        isCached: true,
        cacheAge: 150,
        maxAge: 300
      });
    });

    it('should handle non-cached responses', () => {
      const headers = new Headers();

      const status = getCacheStatus(headers);

      expect(status).toEqual({
        isCached: false
      });
    });

    it('should handle missing age header', () => {
      const headers = new Headers({
        'cache-control': 'public, s-maxage=300'
      });

      const status = getCacheStatus(headers);

      expect(status).toEqual({
        isCached: true,
        cacheAge: undefined,
        maxAge: 300
      });
    });
  });

  describe('Cache Invalidation Handler', () => {
    it('should handle availability cache invalidation', async () => {
      const result = await handleCacheInvalidation('AVAILABILITY', 'admin-123');

      expect(result).toBe(true);
      expect(revalidateTag).toHaveBeenCalledWith(CACHE_TAGS.AVAILABILITY);
      expect(mockConsole.log).toHaveBeenCalledWith(
        expect.stringContaining('Cache invalidated: AVAILABILITY by admin-123')
      );
    });

    it('should handle unknown cache resources', async () => {
      const result = await handleCacheInvalidation('UNKNOWN' as any);

      expect(result).toBe(false);
      expect(mockConsole.warn).toHaveBeenCalledWith('Unknown cache resource: UNKNOWN');
    });

    it('should handle cache invalidation failures', async () => {
      const mockError = new Error('Invalidation failed');
      (revalidateTag as jest.Mock).mockRejectedValue(mockError);

      const result = await handleCacheInvalidation('AVAILABILITY');

      expect(result).toBe(false);
      expect(mockConsole.error).toHaveBeenCalledWith(
        'Failed to invalidate cache for AVAILABILITY:',
        mockError
      );
    });
  });

  describe('Cache Performance Tracking', () => {
    it('should track cache performance with gtag', () => {
      trackCachePerformance('/api/test', true, 150);

      expect(window.gtag).toHaveBeenCalledWith('event', 'cache_performance', {
        event_category: 'performance',
        event_label: '/api/test',
        custom_map: {
          cache_hit: true,
          response_time: 150
        }
      });
    });

    it('should handle missing gtag gracefully', () => {
      delete (window as any).gtag;

      expect(() => {
        trackCachePerformance('/api/test', false, 300);
      }).not.toThrow();
    });
  });

  describe('Cache Duration Constants', () => {
    it('should have correct cache durations for different resources', () => {
      expect(CACHE_DURATIONS.AVAILABILITY).toBe(300); // 5 minutes
      expect(CACHE_DURATIONS.CATEGORIES).toBe(900); // 15 minutes
      expect(CACHE_DURATIONS.CONTENT).toBe(3600); // 1 hour
      expect(CACHE_DURATIONS.API_GENERAL).toBe(60); // 1 minute
    });

    it('should have all required cache tags', () => {
      expect(CACHE_TAGS.AVAILABILITY).toBe('availability');
      expect(CACHE_TAGS.CATEGORIES).toBe('categories');
      expect(CACHE_TAGS.LEADS).toBe('leads');
      expect(CACHE_TAGS.CONTENT).toBe('content');
    });
  });

  describe('Integration with ISR Requirements', () => {
    it('should meet 5-minute cache requirement for availability data', () => {
      const availabilityDuration = CACHE_DURATIONS.AVAILABILITY;
      expect(availabilityDuration).toBe(300); // 5 minutes in seconds
    });

    it('should provide manual cache override capabilities', async () => {
      // Test that admin can manually invalidate cache
      const result = await handleCacheInvalidation('AVAILABILITY', 'admin-override');
      
      expect(result).toBe(true);
      expect(revalidateTag).toHaveBeenCalledWith(CACHE_TAGS.AVAILABILITY);
    });

    it('should support cache warming for better performance', async () => {
      mockFetch.mockResolvedValue({ ok: true });
      
      await warmAvailabilityCache();
      
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/public/availability'),
        expect.objectContaining({
          method: 'GET'
        })
      );
    });
  });
});