/* Hawaii Trip Planner - offline service worker (standalone host).
   Caches the app shell so the plan, picks and bookings open with no connection.
   Live map tiles and typed-place lookups still need the internet. */
var CACHE = "htp-offline-v5";
var CORE = ["./", "index.html", "manifest.json", "icon.svg"];
self.addEventListener("install", function (e) {
  e.waitUntil(caches.open(CACHE).then(function (c) { return Promise.allSettled(CORE.map(function (u) { return c.add(u); })); }).then(function () { return self.skipWaiting(); }));
});
self.addEventListener("activate", function (e) {
  e.waitUntil(caches.keys().then(function (keys) { return Promise.all(keys.map(function (k) { return k === CACHE ? null : caches.delete(k); })); }).then(function () { return self.clients.claim(); }));
});
self.addEventListener("fetch", function (e) {
  var req = e.request;
  if (req.method !== "GET") return;
  if (req.mode === "navigate") {
    e.respondWith(fetch(req).then(function (res) { var copy = res.clone(); caches.open(CACHE).then(function (c) { c.put("index.html", copy); }); return res; }).catch(function () { return caches.match("index.html"); }));
    return;
  }
  e.respondWith(caches.match(req, { ignoreSearch: true }).then(function (hit) {
    var net = fetch(req).then(function (res) {
      if (res && res.ok && new URL(req.url).origin === self.location.origin) { var copy = res.clone(); caches.open(CACHE).then(function (c) { c.put(req, copy); }); }
      return res;
    }).catch(function () { return hit; });
    return hit || net;
  }));
});
