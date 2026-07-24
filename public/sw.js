// Minimal service worker – gør appen installerbar (PWA) på fx en iPhone.
//
// Bevidst valg: vi cacher KUN statiske, offentlige assets (manifest, ikoner).
// Vi cacher ikke HTML-sider eller API-svar, fordi kalenderdata skal være
// friske, og fordi sider som "/" og "/admin" kræver login – de skal aldrig
// caches og genvises til en anden bruger på samme enhed.
const CACHE_NAME = 'mallorca-static-v1';
const STATIC_ASSETS = ['/manifest.json', '/icons/icon-192.png', '/icons/icon-512.png'];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS)),
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  if (event.request.method !== 'GET' || !STATIC_ASSETS.includes(url.pathname)) {
    return; // lad browseren håndtere alt andet normalt (ingen caching)
  }

  event.respondWith(
    caches.match(event.request).then((cached) => cached ?? fetch(event.request)),
  );
});
