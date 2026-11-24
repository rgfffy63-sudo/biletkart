// Сервис-воркер: приложение открывается без интернета (повторение и статистика работают офлайн).
const CACHE = "biletkart-pages-v1";
const SHELL = ["./", "index.html", "config.js", "manifest.webmanifest", "icon-192.png", "icon-512.png"];
self.addEventListener("install", e => { e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting())); });
self.addEventListener("activate", e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener("fetch", e => {
  const req = e.request; if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin === location.origin && url.pathname.startsWith("/api/")) return; // запросы к серверу — только по сети
  if (req.mode === "navigate" || url.pathname.endsWith(".html") || url.pathname.endsWith("config.js")) {
    // страница: сначала сеть (чтобы получать обновления), без сети — из кэша
    e.respondWith(fetch(req).then(r => { const cp = r.clone(); caches.open(CACHE).then(c => c.put(req, cp)); return r; }).catch(() => caches.match(req).then(r => r || caches.match("index.html"))));
    return;
  }
  // библиотеки, шрифты, иконки: из кэша, а в фоне обновляем
  e.respondWith(caches.match(req).then(hit => {
    const net = fetch(req).then(r => { if (r.ok || r.type === "opaque") { const cp = r.clone(); caches.open(CACHE).then(c => c.put(req, cp)); } return r; }).catch(() => hit);
    return hit || net;
  }));
});
