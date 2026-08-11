const VERSION='2.3.1',BASE='/pemilih-muda/',SHELL=`pemilih-muda-shell-${VERSION}`;
const APP_SHELL=['','index.html','offline.html','manifest.webmanifest','css/variables.css','css/base.css','css/components.css','css/landing.css','css/student.css','css/responsive.css','js/config.js','js/utils.js','js/api.js','js/auth.js','js/app.js','js/install.js','js/bottom-nav.js','icons/icon-192.png','icons/icon-512.png','icons/apple-touch-icon.png'].map(path=>BASE+path);
self.addEventListener('install',event=>event.waitUntil(caches.open(SHELL).then(cache=>cache.addAll(APP_SHELL))));
self.addEventListener('activate',event=>event.waitUntil(Promise.all([caches.keys().then(keys=>Promise.all(keys.filter(key=>key.startsWith('pemilih-muda-')&&key!==SHELL).map(key=>caches.delete(key)))),self.clients.claim()])));
self.addEventListener('message',event=>{if(event.data?.type==='SKIP_WAITING')self.skipWaiting()});
self.addEventListener('fetch',event=>{
  const request=event.request;if(request.method!=='GET')return;
  const url=new URL(request.url);
  // GAS and every cross-origin request are strictly network-only. No API response enters Cache Storage.
  if(url.origin!==self.location.origin)return;
  if(!url.pathname.startsWith(BASE))return;
  if(request.mode==='navigate'){event.respondWith(fetch(request).catch(()=>caches.match(BASE+'offline.html')));return}
  if(!['style','script','image','font','manifest'].includes(request.destination))return;
  event.respondWith(caches.match(request).then(cached=>cached||fetch(request).then(response=>{if(response.ok){const copy=response.clone();caches.open(SHELL).then(cache=>cache.put(request,copy))}return response})));
});
