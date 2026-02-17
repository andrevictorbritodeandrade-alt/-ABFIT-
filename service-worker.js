
const CACHE_NAME = 'abfit-elite-v3';
const OFFLINE_URL = '/index.html';

// Assets fundamentais para o shell do app carregar offline
const ASSETS_TO_CACHE = [
  OFFLINE_URL,
  '/manifest.json'
];

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      // Tenta cachear, mas não falha se algum asset externo falhar
      return cache.addAll(ASSETS_TO_CACHE).catch(err => console.warn('Cache warning:', err));
    })
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  // Ignora requisições não-GET ou esquemas estranhos (chrome-extension, etc)
  if (event.request.method !== 'GET' || !event.request.url.startsWith('http')) return;

  // ESTRATÉGIA PARA NAVEGAÇÃO (HTML): Network First, Fallback to Cache
  // Garante que se o usuário der refresh sem internet, o app carrega.
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .catch(() => {
          return caches.match(OFFLINE_URL);
        })
    );
    return;
  }

  // ESTRATÉGIA PARA ASSETS (JS, CSS, IMAGENS): Stale-While-Revalidate
  // Retorna cache rápido, mas atualiza em background para a próxima vez.
  event.respondWith(
    caches.open(CACHE_NAME).then((cache) => {
      return caches.match(event.request).then((response) => {
        const fetchPromise = fetch(event.request).then((networkResponse) => {
          // Só cacheia se a resposta for válida
          if (networkResponse && networkResponse.status === 200 && networkResponse.type === 'basic') {
             cache.put(event.request, networkResponse.clone());
          }
          return networkResponse;
        }).catch(() => {
           // Falha silenciosa no fetch de background
        });

        return response || fetchPromise;
      });
    })
  );
});
