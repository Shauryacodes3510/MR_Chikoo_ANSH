const CACHE_NAME = 'chikoo-cache-v3';

// Assets to cache immediately on service worker installation
const PRECACHE_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/splash_screen.webp',
  '/Chest.webp',
  '/Home.webp',
  '/Practice.webp',
  '/Quest.webp',
  '/Ranks.webp',
  '/Rewards.webp',
  '/avatar.webp',
  '/avatar.png',
  '/world.webp',
  '/streak.webp',
  '/cookies.webp',
  '/bg_image.webp',
  '/unit2_bg_image.webp',
  '/unit3_bg_image.webp',
  '/unit4_bg_image.webp',
  '/unit5_bg_image.webp'
];

// Install Event
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[Service Worker] Pre-caching core assets...');
      return cache.addAll(PRECACHE_ASSETS);
    }).then(() => self.skipWaiting())
  );
});

// Activate Event - Clean up stale caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            console.log('[Service Worker] Removing old cache:', cache);
            return caches.delete(cache);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch Event - Handle network offline modes with cache-first and stale-while-revalidate fallback strategies
self.addEventListener('fetch', (event) => {
  const requestUrl = new URL(event.request.url);

  // Skip non-GET requests
  if (event.request.method !== 'GET') {
    return;
  }

  // Bypass chrome-extension://, websocket, and non-http(s) URLs
  if (requestUrl.protocol !== 'http:' && requestUrl.protocol !== 'https:') {
    return;
  }

  // CRITICAL: Strictly bypass cross-origin requests (e.g. Supabase Auth & REST, CDN assets)
  // Let the browser handle cross-origin network operations natively with complete credentials, auth tokens, and CORS headers.
  if (requestUrl.origin !== self.location.origin) {
    return;
  }

  // Strictly bypass development source files, modules, and bundler assets
  if (
    requestUrl.pathname.includes('/src/') ||
    requestUrl.pathname.includes('/node_modules/') ||
    requestUrl.pathname.includes('/@vite/') ||
    requestUrl.pathname.includes('/@react-refresh') ||
    requestUrl.searchParams.has('v') ||
    requestUrl.searchParams.has('import')
  ) {
    return;
  }

  // Handle API routes with network-first falling back to cache
  if (requestUrl.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(event.request)
        .then((networkResponse) => {
          // Cache successful GET API responses
          if (networkResponse && networkResponse.status === 200) {
            const responseCopy = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, responseCopy);
            });
          }
          return networkResponse;
        })
        .catch(() => {
          console.log('[Service Worker] API request failed. Checking cache for offline fallback:', requestUrl.pathname);
          return caches.match(event.request).then((cachedResponse) => {
            if (cachedResponse) {
              return cachedResponse;
            }
            // Return custom friendly offline API error
            return new Response(
              JSON.stringify({ 
                error: 'Intermittent internet connection detected.', 
                offline: true,
                message: 'Curriculum content loaded offline from local storage fallback.' 
              }),
              { 
                status: 200, 
                headers: { 'Content-Type': 'application/json' } 
              }
            );
          });
        })
    );
    return;
  }

  // For static assets, web assets, and media files, use stale-while-revalidate or cache-first
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        // Fetch in the background to update the cache
        fetch(event.request).then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, networkResponse);
            });
          }
        }).catch(() => {
          // Ignore network errors during silent background updates
        });
        return cachedResponse;
      }

      // Fall back to network
      return fetch(event.request).then((networkResponse) => {
        if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
          return networkResponse;
        }

        const responseCopy = networkResponse.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, responseCopy);
        });

        return networkResponse;
      }).catch(() => {
        // If it's a page navigation request, return index.html fallback
        if (event.request.mode === 'navigate') {
          return caches.match('/');
        }
      });
    })
  );
});
