/**
 * Cache management utilities for ISR and API response caching
 * Implements 5-minute cache strategy for availability data with manual invalidation
 */

import { revalidateTag, revalidatePath } from 'next/cache';

// Cache tags for different data types
export const CACHE_TAGS = {
  AVAILABILITY: 'availability',
  CATEGORIES: 'categories',
  LEADS: 'leads',
  CONTENT: 'content',
  TESTIMONIALS: 'testimonials',
  INDUSTRIES: 'industries',
  INSIGHTS: 'insights'
} as const;

// Cache durations (in seconds)
export const CACHE_DURATIONS = {
  AVAILABILITY: 300, // 5 minutes
  CATEGORIES: 900, // 15 minutes
  CONTENT: 3600, // 1 hour
  TESTIMONIALS: 1800, // 30 minutes
  INDUSTRIES: 3600, // 1 hour
  INSIGHTS: 900, // 15 minutes
  API_GENERAL: 60 // 1 minute for general API responses
} as const;

/**
 * Cache invalidation functions
 */
export async function invalidateAvailabilityCache() {
  try {
    revalidateTag(CACHE_TAGS.AVAILABILITY);
    revalidatePath('/api/public/availability');
    revalidatePath('/'); // Home page with availability indicators
    console.log('Availability cache invalidated');
  } catch (error) {
    console.error('Failed to invalidate availability cache:', error);
  }
}

export async function invalidateCategoriesCache() {
  try {
    revalidateTag(CACHE_TAGS.CATEGORIES);
    revalidatePath('/api/public/availability');
    revalidatePath('/');
    console.log('Categories cache invalidated');
  } catch (error) {
    console.error('Failed to invalidate categories cache:', error);
  }
}

export async function invalidateContentCache() {
  try {
    revalidateTag(CACHE_TAGS.CONTENT);
    revalidatePath('/');
    console.log('Content cache invalidated');
  } catch (error) {
    console.error('Failed to invalidate content cache:', error);
  }
}

export async function invalidateTestimonialsCache() {
  try {
    revalidateTag(CACHE_TAGS.TESTIMONIALS);
    revalidatePath('/api/public/testimonials');
    revalidatePath('/');
    console.log('Testimonials cache invalidated');
  } catch (error) {
    console.error('Failed to invalidate testimonials cache:', error);
  }
}

/**
 * Cache headers generator
 */
export function getCacheHeaders(duration: number, tags?: string[]) {
  const headers: Record<string, string> = {
    'Cache-Control': `public, s-maxage=${duration}, stale-while-revalidate=${Math.floor(duration / 5)}`,
    'CDN-Cache-Control': `public, s-maxage=${duration}`,
    'Vary': 'Accept-Encoding'
  };

  if (tags && tags.length > 0) {
    headers['Cache-Tag'] = tags.join(',');
  }

  return headers;
}

/**
 * API response caching utility
 */
export function createCachedResponse<T>(
  data: T,
  success: boolean = true,
  duration: number = CACHE_DURATIONS.API_GENERAL,
  tags?: string[]
) {
  return {
    body: {
      success,
      data,
      cached: true,
      cacheExpiry: new Date(Date.now() + duration * 1000).toISOString(),
      timestamp: new Date().toISOString()
    },
    headers: getCacheHeaders(duration, tags)
  };
}

/**
 * Cache warming utilities
 */
export async function warmAvailabilityCache() {
  try {
    // Trigger availability API to warm cache
    const response = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL}/api/public/availability`, {
      method: 'GET',
      headers: {
        'User-Agent': 'Cache-Warmer/1.0'
      }
    });
    
    if (response.ok) {
      console.log('Availability cache warmed successfully');
    } else {
      console.warn('Failed to warm availability cache:', response.status);
    }
  } catch (error) {
    console.error('Error warming availability cache:', error);
  }
}

/**
 * Cache status checker
 */
export function getCacheStatus(headers: Headers): {
  isCached: boolean;
  cacheAge?: number;
  maxAge?: number;
} {
  const cacheControl = headers.get('cache-control');
  const age = headers.get('age');
  
  if (!cacheControl) {
    return { isCached: false };
  }

  const maxAgeMatch = cacheControl.match(/s-maxage=(\d+)/);
  const maxAge = maxAgeMatch ? parseInt(maxAgeMatch[1]) : undefined;
  const cacheAge = age ? parseInt(age) : undefined;

  return {
    isCached: true,
    cacheAge,
    maxAge
  };
}

/**
 * Cache invalidation webhook handler
 */
export async function handleCacheInvalidation(
  resource: keyof typeof CACHE_TAGS,
  adminUserId?: string
) {
  const timestamp = new Date().toISOString();
  
  try {
    switch (resource) {
      case 'AVAILABILITY':
        await invalidateAvailabilityCache();
        break;
      case 'CATEGORIES':
        await invalidateCategoriesCache();
        break;
      case 'CONTENT':
        await invalidateContentCache();
        break;
      case 'TESTIMONIALS':
        await invalidateTestimonialsCache();
        break;
      default:
        console.warn(`Unknown cache resource: ${resource}`);
        return false;
    }

    // Log cache invalidation for audit
    console.log(`Cache invalidated: ${resource} by ${adminUserId || 'system'} at ${timestamp}`);
    return true;
  } catch (error) {
    console.error(`Failed to invalidate cache for ${resource}:`, error);
    return false;
  }
}

/**
 * Performance monitoring for cache effectiveness
 */
export function trackCachePerformance(
  endpoint: string,
  cacheHit: boolean,
  responseTime: number
) {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', 'cache_performance', {
      event_category: 'performance',
      event_label: endpoint,
      custom_map: {
        cache_hit: cacheHit,
        response_time: responseTime
      }
    });
  }
}