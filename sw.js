// Offline support: precache everything, serve from cache, refresh the cache in the background.
// Bump VERSION whenever files change so installed copies pick up the update.
const VERSION = 'axolotl-v1';
const ASSETS = [
  './',
  'index.html',
  'styles.css',
  'manifest.webmanifest',
  'js/main.js',
  'js/game.js',
  'js/ui.js',
  'js/input.js',
  'js/audio.js',
  'js/world.js',
  'js/levels.js',
  'js/draw.js',
  'js/art.js',
  'js/scene.js',
  'js/entities.js',
  'js/boss.js',
  'js/particles.js',
  'icons/icon-192.png',
  'icons/icon-512.png',
  'icons/maskable-512.png',
  'icons/apple-touch-icon.png',
];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(VERSION).then((c) => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== VERSION).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== self.location.origin) return;
  e.respondWith(
    caches.open(VERSION).then(async (cache) => {
      const cached = await cache.match(req, { ignoreSearch: true });
      const network = fetch(req)
        .then((res) => { if (res.ok) cache.put(req, res.clone()); return res; })
        .catch(() => cached);
      if (cached) { e.waitUntil(network); return cached; }
      return network;
    }),
  );
});
