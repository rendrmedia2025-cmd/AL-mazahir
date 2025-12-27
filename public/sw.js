/**
 * Service Worker for performance optimization
 * Implements caching strategies for static assets and API responses
 */

const CACHE_NAME = 'al-mazahir-v1';
const STATIC_CACHE = 'static-v1';
const DYNAMIC_CACHE = 'dynamic-v1';

// Assets to cache immediately
const STATIC_ASSETS = [
  '/',
  '/images/logo.png',
  '/images/hero-bg.jpg',
  '/favicon.ico',
  // Add other critical assets
];

// API endpoints to cache with different strategies
const API_CACHE_PATTERNS = [
  { pattern: '/api/public/availability', strategy: 'stale-while-revalidate', maxAge: 300 }, // 5 minutes
  { pattern: '/api/public/testimonials', strategy: 'cache-first', maxAge: 1800 }, // 30 minutes
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
  console.log('[SW] Installing service worker');
  
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => {
        console.log('[SW] Caching static assets');
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => {
        console.log('[SW] Static assets cached successfully');
        return self.skipWaiting();
      })
      .catch((error) => {
        console.error('[SW] Failed to cache static assets:', error);
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating service worker');
  
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== STATIC_CACHE && cacheName !== DYNAMIC_CACHE) {
              console.log('[SW] Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        console.log('[SW] Service worker activated');
        return self.clients.claim();
      })
  );
});

// Fetch event - implement caching strategies
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }
  
  // Skip admin routes from caching
  if (url.pathname.startsWith('/admin')) {
    return;
  }
  
  // Handle API requests with specific strategies
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(handleAPIRequest(request));
    return;
  }
  
  // Handle static assets
  if (isStaticAsset(url.pathname)) {
    event.respondWith(handleStaticAsset(request));
    return;
  }
  
  // Handle navigation requests
  if (request.mode === 'navigate') {
    event.respondWith(handleNavigation(request));
    return;
  }
  
  // Default: network first
  event.respondWith(
    fetch(request).catch(() => {
      return caches.match(request);
    })
  );
});

// Handle API requests with different caching strategies
async function handleAPIRequest(request) {
  const url = new URL(request.url);
  const cacheConfig = API_CACHE_PATTERNS.find(config => 
    url.pathname.includes(config.pattern)
  );
  
  if (!cacheConfig) {
    // No specific caching strategy - use network first
    try {
      const response = await fetch(request);
      return response;
    } catch (error) {
      const cachedResponse = await caches.match(request);
      return cachedResponse || new Response('Network error', { status: 503 });
    }
  }
  
  const cache = await caches.open(DYNAMIC_CACHE);
  
  switch (cacheConfig.strategy) {
    case 'cache-first':
      return handleCacheFirst(request, cache, cacheConfig.maxAge);
    case 'stale-while-revalidate':
      return handleStaleWhileRevalidate(request, cache, cacheConfig.maxAge);
    default:
      return fetch(request);
  }
}

// Cache first strategy
async function handleCacheFirst(request, cache, maxAge) {
  const cachedResponse = await cache.match(request);
  
  if (cachedResponse) {
    const cacheDate = new Date(cachedResponse.headers.get('sw-cache-date') || 0);
    const now = new Date();
    const age = (now.getTime() - cacheDate.getTime()) / 1000;
    
    if (age < maxAge) {
      console.log('[SW] Serving from cache:', request.url);
      return cachedResponse;
    }
  }
  
  try {
    const response = await fetch(request);
    if (response.ok) {
      const responseClone = response.clone();
      const headers = new Headers(responseClone.headers);
      headers.set('sw-cache-date', new Date().toISOString());
      
      const modifiedResponse = new Response(responseClone.body, {
        status: responseClone.status,
        statusText: responseClone.statusText,
        headers: headers
      });
      
      cache.put(request, modifiedResponse);
      console.log('[SW] Cached fresh response:', request.url);
    }
    return response;
  } catch (error) {
    console.log('[SW] Network failed, serving stale cache:', request.url);
    return cachedResponse || new Response('Network error', { status: 503 });
  }
}

// Stale while revalidate strategy
async function handleStaleWhileRevalidate(request, cache, maxAge) {
  const cachedResponse = await cache.match(request);
  
  // Always try to fetch fresh data in the background
  const fetchPromise = fetch(request).then(response => {
    if (response.ok) {
      const responseClone = response.clone();
      const headers = new Headers(responseClone.headers);
      headers.set('sw-cache-date', new Date().toISOString());
      
      const modifiedResponse = new Response(responseClone.body, {
        status: responseClone.status,
        statusText: responseClone.statusText,
        headers: headers
      });
      
      cache.put(request, modifiedResponse);
      console.log('[SW] Background updated cache:', request.url);
    }
    return response;
  }).catch(error => {
    console.warn('[SW] Background fetch failed:', error);
    return null;
  });
  
  if (cachedResponse) {
    const cacheDate = new Date(cachedResponse.headers.get('sw-cache-date') || 0);
    const now = new Date();
    const age = (now.getTime() - cacheDate.getTime()) / 1000;
    
    if (age < maxAge) {
      console.log('[SW] Serving fresh cache, updating in background:', request.url);
      // Don't wait for background update
      fetchPromise;
      return cachedResponse;
    }
  }
  
  // Cache is stale or doesn't exist, wait for network
  try {
    const response = await fetchPromise;
    return response || cachedResponse || new Response('Network error', { status: 503 });
  } catch (error) {
    return cachedResponse || new Response('Network error', { status: 503 });
  }
}

// Handle static assets
async function handleStaticAsset(request) {
  const cachedResponse = await caches.match(request);
  if (cachedResponse) {
    return cachedResponse;
  }
  
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(STATIC_CACHE);
      cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    return new Response('Asset not found', { status: 404 });
  }
}

// Handle navigation requests
async function handleNavigation(request) {
  try {
    const response = await fetch(request);
    return response;
  } catch (error) {
    // Serve cached index.html for offline navigation
    const cachedResponse = await caches.match('/');
    return cachedResponse || new Response('Offline', { status: 503 });
  }
}

// Check if URL is a static asset
function isStaticAsset(pathname) {
  return pathname.match(/\.(js|css|png|jpg|jpeg|gif|svg|ico|woff|woff2|ttf|eot)$/);
}

// Message handling for cache updates
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'CACHE_INVALIDATE') {
    const { pattern } = event.data;
    invalidateCache(pattern);
  }
});

// Invalidate cache for specific patterns
async function invalidateCache(pattern) {
  const cacheNames = await caches.keys();
  
  for (const cacheName of cacheNames) {
    const cache = await caches.open(cacheName);
    const requests = await cache.keys();
    
    for (const request of requests) {
      if (request.url.includes(pattern)) {
        await cache.delete(request);
        console.log('[SW] Invalidated cache for:', request.url);
      }
    }
  }
}