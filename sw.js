// Service Worker for TodayInClass PWA

const CACHE_NAME = 'todayinclass-cache-v1';
const urlsToCache = [
    '/',
    '/index.html',
    '/styles.css',
    '/app.js',
    '/auth.js',
    '/firebase-config.js',
    '/manifest.json',
    '/assets/logo.png'
];

// Install event - cache resources
self.addEventListener('install', event => {
    self.skipWaiting();
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                console.log('SW: Pre-caching assets');
                return cache.addAll(urlsToCache);
            })
    );
});

// Fetch event - Cache First strategy (Maximum efficiency)
self.addEventListener('fetch', event => {
    if (event.request.method !== 'GET') return;

    // Skip caching for Firebase Auth/Firestore calls
    if (event.request.url.includes('googleapis.com') || event.request.url.includes('firebase')) {
        return;
    }

    event.respondWith(
        caches.match(event.request)
            .then(response => {
                // Return cache hit if found
                if (response) {
                    return response;
                }

                // Otherwise fetch from network
                return fetch(event.request).then(networkResponse => {
                    // Update cache for future requests
                    if (networkResponse && networkResponse.status === 200) {
                        const responseToCache = networkResponse.clone();
                        caches.open(CACHE_NAME).then(cache => {
                            cache.put(event.request, responseToCache);
                        });
                    }
                    return networkResponse;
                });
            })
    );
});

// Activate event - clean up old caches
self.addEventListener('activate', event => {
    event.waitUntil(
        Promise.all([
            caches.keys().then(cacheNames => {
                return Promise.all(
                    cacheNames.map(cacheName => {
                        if (cacheName !== CACHE_NAME) {
                            console.log('SW: Deleting old cache:', cacheName);
                            return caches.delete(cacheName);
                        }
                    })
                );
            }),
            self.clients.claim()
        ])
    );
});
