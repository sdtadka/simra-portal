const CACHE_NAME = 'simra-app-v2';
const ASSETS = [
  './', './index.html', './admin.html', './super_admin.html', './imam.html',
  './member.html', './user.html', './api.js', './receipt.js', './manifest.json',
  './icon-192.png', './icon-512.png'
];

self.addEventListener('install', (e) => {
  self.skipWaiting();
  e.waitUntil(caches.open(CACHE_NAME).then((c) => c.addAll(ASSETS)));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url);
  /* Apps Script API (POST) aur dusre domain kabhi cache nahi */
  if (e.request.method !== 'GET' || url.origin !== self.location.origin) return;
  /* Network pehle, offline ho to cache: app shell hamesha khulega */
  e.respondWith(
    fetch(e.request).then((res) => {
      if (res && res.ok) { const copy = res.clone(); caches.open(CACHE_NAME).then((c) => c.put(e.request, copy)); }
      return res;
    }).catch(() => caches.match(e.request).then((m) => m || caches.match('./index.html')))
  );
});
