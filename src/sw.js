// Service worker: makes the app open with no internet. Built by vite.config.ts, which fills in FILES.
// Firestore data is cached separately by Firebase (see firebase.ts).
const FILES = __FILES__;
const CACHE = `ecr-${__BUILD__}`;

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(['/', ...FILES.map((f) => `/${f}`)])).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url);
  // Only our own files; Firebase's sign-in pages (/__/) and APIs go straight to the network.
  if (e.request.method !== 'GET' || url.origin !== location.origin || url.pathname.startsWith('/__/')) return;
  if (e.request.mode === 'navigate') {
    // Pages: try the network for the newest version, fall back to the cached app shell offline.
    e.respondWith(fetch(e.request).catch(() => caches.match('/', { ignoreVary: true })));
    return;
  }
  // ignoreVary: module scripts send an Origin header the precache request didn't, so a Vary header would miss.
  e.respondWith(caches.match(e.request, { ignoreVary: true }).then((hit) => hit ?? fetch(e.request)));
});
