// Estrategia: stale-while-revalidate.
// Sirve cache instantáneo y, en paralelo, refresca desde red.
// Heredado de Doomsday-repo: evita el ritual del bump de cache cada deploy.
const CACHE = 'memoria-v2-codice';
const PRECACHE = [
  './',
  './index.html',
  './manifest.webmanifest',
  './icons/icon-180.png',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './fonts/fraunces.woff2',
  './fonts/inter.woff2',
];

self.addEventListener('install', (e) => {
  // {cache: 'reload'} salta el HTTP cache del navegador al popular el SW cache.
  e.waitUntil(
    caches.open(CACHE).then((c) =>
      c.addAll(PRECACHE.map((url) => new Request(url, { cache: 'reload' })))
        .catch(() => {}) // tolerar iconos ausentes durante desarrollo
    )
  );
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return;
  e.respondWith(
    caches.open(CACHE).then((cache) =>
      cache.match(e.request).then((cached) => {
        const networkFetch = fetch(e.request)
          .then((res) => {
            if (res && res.status === 200 && res.type === 'basic') {
              cache.put(e.request, res.clone());
            }
            return res;
          })
          .catch(() => cached);
        if (cached) {
          e.waitUntil(networkFetch);
          return cached;
        }
        return networkFetch;
      })
    )
  );
});
