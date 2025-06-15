self.addEventListener("install", event => {
  event.waitUntil(
    caches.open("news-cache").then(cache => cache.addAll(["index.html", "main.js", "style.css"]))
  );
});

self.addEventListener("fetch", event => {
  event.respondWith(
    caches.match(event.request).then(response => response || fetch(event.request))
  );
});