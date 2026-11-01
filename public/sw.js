// Nihongo Now service worker — caches the app shell so it opens instantly and works offline.
const VERSION = 'nn-v2';
const BASE = new URL('./', self.location).pathname;   // works at "/" or under a sub-path
const SHELL = ['', 'index.html', 'manifest.webmanifest', 'icons/icon-192.png', 'icons/icon-512.png', 'icons/apple-touch-icon.png'].map(p => BASE + p);

self.addEventListener('install', e => {
  e.waitUntil(caches.open(VERSION).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== VERSION).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);
  if (e.request.method !== 'GET') return;
  // Never cache translation calls or anything off-origin
  if (url.origin !== location.origin || !url.pathname.startsWith(BASE) || url.pathname.startsWith(BASE + 'api/')) return;
  // Shell: network first (so updates land), cache fallback (so offline works)
  e.respondWith(
    fetch(e.request).then(res => {
      if (res.ok) { const copy = res.clone(); caches.open(VERSION).then(c => c.put(e.request, copy)); }
      return res;
    }).catch(() => caches.match(e.request).then(r => r || caches.match(BASE)))
  );
});
