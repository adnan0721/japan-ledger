// 離線快取：同網域檔案「網路優先、3 秒逾時改用快取」，確保連線時一定拿到最新版。
var CACHE = "jpl-v26";
var ASSETS = ["./", "./index.html", "./manifest.webmanifest", "./icon.svg", "./icon-192.png", "./icon-512.png", "./apple-touch-icon.png"];
self.addEventListener("install", function (e) {
  e.waitUntil(caches.open(CACHE).then(function (c) {
    return c.addAll(ASSETS.map(function (u) { return new Request(u, { cache: "reload" }); }));
  }).then(function () { return self.skipWaiting(); }));
});
self.addEventListener("activate", function (e) {
  e.waitUntil(caches.keys().then(function (ks) {
    return Promise.all(ks.filter(function (k) { return k !== CACHE; }).map(function (k) { return caches.delete(k); }));
  }).then(function () { return self.clients.claim(); }));
});
self.addEventListener("fetch", function (e) {
  var r = e.request;
  if (r.method !== "GET" || new URL(r.url).origin !== location.origin) return;
  var net = fetch(r, { cache: "no-cache" }).then(function (res) {
    if (res && res.ok) { var cp = res.clone(); caches.open(CACHE).then(function (c) { c.put(r, cp); }); }
    return res;
  });
  var timeout = new Promise(function (_, rej) { setTimeout(rej, 3000); });
  e.respondWith(Promise.race([net, timeout]).catch(function () {
    return caches.match(r, { ignoreSearch: true }).then(function (hit) { return hit || net.catch(function () { return caches.match("./index.html"); }); });
  }));
});
