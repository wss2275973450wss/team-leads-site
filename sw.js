/* 团队线索站 Service Worker：缓存首页，断网时打开缓存页。
   部署：必须和 index.html 放在同一目录一起上传（GitHub Pages 同目录），只传 index.html 不生效。
   跨域请求（Supabase 等）不缓存、不拦截。导航请求走网络优先、失败回缓存，避免锁死旧版。 */
var CACHE = "team-leads-v1";
var CORE = ["./", "./index.html"];
self.addEventListener("install", function(e){
  e.waitUntil(caches.open(CACHE).then(function(c){ return c.addAll(CORE); }).then(function(){ return self.skipWaiting(); }));
});
self.addEventListener("activate", function(e){
  e.waitUntil(caches.keys().then(function(ks){
    return Promise.all(ks.filter(function(k){ return k !== CACHE; }).map(function(k){ return caches.delete(k); }));
  }).then(function(){ return self.clients.claim(); }));
});
self.addEventListener("fetch", function(e){
  if(e.request.method !== "GET") return;
  var url = new URL(e.request.url);
  if(url.origin !== self.location.origin) return;
  if(e.request.mode === "navigate"){
    e.respondWith(fetch(e.request).then(function(r){
      var c = r.clone();
      caches.open(CACHE).then(function(cc){ cc.put("./index.html", c); });
      return r;
    }).catch(function(){ return caches.match("./index.html"); }));
    return;
  }
  e.respondWith(caches.match(e.request).then(function(hit){ return hit || fetch(e.request); }));
});
