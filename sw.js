// AGENT (Autonomous Generative Engine for Networking and Tools) — service worker (network-first, mismo patrón que el resto de PanaMentorLabs)
const CACHE_NAME = "agent-cache-v6";
const APP_SHELL = ["./index.html", "./manifest.json", "./icon-192.png", "./icon-512.png", "./icon-maskable-512.png"];

self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(APP_SHELL)).catch(()=>{})
  );
  self.skipWaiting();
});

self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", event => {
  const req = event.request;
  const url = new URL(req.url);

  // Solo manejamos GET del mismo origen. Todo lo demás (Groq, DeepSeek, AI Horde, CDNs) va directo a la red.
  if (req.method !== "GET" || url.origin !== self.location.origin) return;

  // Network-first con fallback a caché si no hay red.
  event.respondWith(
    fetch(req)
      .then(res => {
        const resClone = res.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(req, resClone)).catch(()=>{});
        return res;
      })
      .catch(() => caches.match(req))
  );
});
