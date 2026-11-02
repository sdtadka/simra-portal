const CACHE_NAME = 'simra-app-v2';
const APP_SHELL = [
  './',
  './index.html',
  './api.js',
  './receipt.js'
];
const DATA_CACHE = 'simra-data-v2';

self.addEventListener('install', (e) => {
  self.skipWaiting();
  e.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(APP_SHELL)));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then(keys => Promise.all(
      keys.map(key => {
        if (key !== CACHE_NAME && key !== DATA_CACHE) return caches.delete(key);
      })
    ))
  );
  self.clients.claim();
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;

  // For Google Apps Script API (POST) — no SW caching (handled by frontend).
  const url = req.url || '';
  if (url.indexOf('script.google.com') >= 0) return;

  // Static asset: cache-first
  e.respondWith(
    caches.match(req).then(hit => hit || fetch(req).then(res => {
      const copy = res.clone();
      caches.open(CACHE_NAME).then(c => c.put(req, copy));
      return res;
    }).catch(() => caches.match(req)))
  );
});
