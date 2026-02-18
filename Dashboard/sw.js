const CACHE_NAME = 'copypoz-v1';
const urlsToCache = [
  'index.php',
  'dashboard.php',
  'logout.php',
  'assets/style.css',
  'https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css',
  'https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js',
  'https://cdn.jsdelivr.net/npm/axios/dist/axios.min.js'
];

// Service Worker kurulumu
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        return cache.addAll(urlsToCache).catch(err => {
          console.log('Cache addAll error:', err);
        });
      })
  );
  self.skipWaiting();
});

// Service Worker aktivasyonu
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Fetch event - Network first, fallback to cache
self.addEventListener('fetch', event => {
  // Chrome extension isteklerini yoksay
  if (event.request.url.startsWith('chrome-extension://')) {
    return;
  }

  // API çağrıları için network first
  if (event.request.url.includes('/api/')) {
    event.respondWith(
      fetch(event.request)
        .then(response => {
          if (response.ok) {
            return response;
          }
          return caches.match(event.request);
        })
        .catch(() => {
          return caches.match(event.request);
        })
    );
  } else {
    // Diğer kaynaklar için cache first
    event.respondWith(
      caches.match(event.request)
        .then(response => {
          if (response) {
            return response;
          }
          // Redirect mode 'manual' kullanarak tarayıcının yönlendirmeyi yönetmesine izin ver
          return fetch(event.request.url, {
              method: event.request.method,
              headers: event.request.headers,
              mode: 'cors', // Navigation requests usually need 'same-origin' or 'navigate', but 'cors' is safe for fetch
              credentials: event.request.credentials,
              redirect: 'manual' 
          })
            .then(response => {
              // Opaque redirect (302) veya Redirected durumlarını kontrol et
              if (response.type === 'opaqueredirect' || response.redirected) {
                  return response;
              }
              
              if (!response || response.status !== 200 || response.type === 'error') {
                return response;
              }
              
              const responseToCache = response.clone();
              caches.open(CACHE_NAME)
                .then(cache => {
                  // Desteklenmeyen şemaları (chrome-extension vb.) kontrol et
                  if(!event.request.url.startsWith('http')) return;
                  cache.put(event.request, responseToCache);
                });
              return response;
            })
            .catch(() => {
              return caches.match('/index.php');
            });
        })
    );
  }
});
