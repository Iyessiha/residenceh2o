// Service Worker minimal — rend l'app installable (PWA)
const CACHE = 'h2o-manager-v1'

self.addEventListener('install', () => self.skipWaiting())
self.addEventListener('activate', (e) => e.waitUntil(clients.claim()))

self.addEventListener('fetch', (e) => {
  // On laisse passer toutes les requêtes réseau normalement
  // (pas de cache agressif pour éviter de servir des données obsolètes)
  if (e.request.method !== 'GET') return
  e.respondWith(
    fetch(e.request).catch(() => caches.match(e.request))
  )
})
