const CACHE_NAME = 'tactlink-pwa-cache-v1';

// Daftar asset yang ingin di-cache (opsional)
const urlsToCache = [
  '/',
  '/logo/LOGO TACTLINK.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        return cache.addAll(urlsToCache);
      })
  );
});

self.addEventListener('fetch', (event) => {
  // Untuk aplikasi absensi, kita ingin selalu fetch dari network karena datanya real-time (jadwal, scan).
  // Jika gagal, baru coba ambil dari cache.
  event.respondWith(
    fetch(event.request).catch(() => {
      return caches.match(event.request);
    })
  );
});

self.addEventListener('activate', (event) => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});
