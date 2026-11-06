/* Static shell only: participant input/output is never received, stored or cached. */
const CACHE = 'icare-static-v0.1.0';
const STATIC = ['./','./index.html','./styles.css','./app.mjs','./engine.mjs','./icon.svg','./manifest.webmanifest'];
self.addEventListener('install',event=>event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(STATIC)).then(()=>self.skipWaiting())));
self.addEventListener('activate',event=>event.waitUntil(Promise.all([
  caches.keys().then(keys=>Promise.all(keys.filter(k=>k.startsWith('icare-static-')&&k!==CACHE).map(k=>caches.delete(k)))),
  self.clients.claim()
])));
self.addEventListener('fetch',event=>{
  if(event.request.method!=='GET')return;
  const url=new URL(event.request.url);
  if(url.origin!==self.location.origin)return;
  const scopePath=new URL(self.registration.scope).pathname;
  if(!url.pathname.startsWith(scopePath))return;
  const path=url.pathname.slice(scopePath.length);
  const normalised='./'+(path||'');
  if(!STATIC.includes(normalised))return;
  event.respondWith(caches.match(event.request).then(cached=>cached||fetch(event.request)));
});
