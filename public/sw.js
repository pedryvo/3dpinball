const CACHE_NAME = '3dpinball-cache-v3';

const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/assets/OUTPOST.PAL',
  '/assets/OUTPOSTJ.BMP',
  '/assets/CP.PAL',
  '/assets/CPJ.BMP',
  '/assets/MINE.PAL',
  '/assets/MINEJ.BMP',
  '/assets/BALLS.BMP',
  '/assets/TEXT.RES',
  '/assets/CREDITS.RES',
  '/sfx/FLIPPER.WAV',
  '/sfx/KACHUNK1.WAV',
  '/sfx/KACHUNK2.WAV',
  '/sfx/KACHUNK3.WAV',
  '/sfx/KACHUNK4.WAV',
  '/sfx/ZAP1.WAV',
  '/sfx/ZAP2.WAV',
  '/sfx/SCORE1.WAV',
  '/sfx/SCORE10.WAV',
  '/sfx/FANFARE1.WAV',
  '/sfx/FANFARE2.WAV',
  '/sfx/VICTORY1.WAV',
  '/sfx/LOSE1.WAV',
  '/sfx/ROLL1.WAV',
  '/sfx/WHOOSH1.WAV'
];

self.addEventListener('install', (e) => {
  self.skipWaiting();
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS).catch(() => {});
    })
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((k) => {
          if (k !== CACHE_NAME) return caches.delete(k);
        })
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  // Network-First for document navigation and JS bundles so updates are immediate
  if (e.request.mode === 'navigate' || e.request.url.includes('/index') || e.request.destination === 'document') {
    e.respondWith(
      fetch(e.request)
        .then((resp) => {
          if (resp && resp.status === 200) {
            const clone = resp.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(e.request, clone));
          }
          return resp;
        })
        .catch(() => caches.match(e.request))
    );
    return;
  }

  // Cache-First for static assets (palettes, bitmaps, WAVs)
  e.respondWith(
    caches.match(e.request).then((cached) => {
      if (cached) return cached;
      return fetch(e.request).then((resp) => {
        if (!resp || resp.status !== 200 || resp.type !== 'basic') {
          return resp;
        }
        const toCache = resp.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(e.request, toCache);
        });
        return resp;
      }).catch(() => cached);
    })
  );
});
