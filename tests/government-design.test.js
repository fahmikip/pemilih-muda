const fs=require('fs'),assert=require('assert');
const html=fs.readFileSync('index.html','utf8'),landing=fs.readFileSync('css/landing.css','utf8'),variables=fs.readFileSync('css/variables.css','utf8');
for(const marker of ['PORTAL EDUKASI PUBLIK','PROGRAM LITERASI DEMOKRASI','Prinsip layanan','ALUR LAYANAN'])assert(html.includes(marker),`elemen institusional hilang: ${marker}`);
assert(html.includes('AMAN')&&html.includes('NETRAL')&&html.includes('TERUKUR'),'prinsip layanan wajib tampil');
assert(landing.includes('.institution-strip')&&landing.includes('.service-panel')&&landing.includes('.trust-grid'),'layout layanan publik belum lengkap');
assert(html.includes('header-cta mobile-login')&&landing.includes('.header-cta.mobile-login{display:inline-flex'),'tombol login mobile publik wajib terlihat');
assert(variables.includes('--national:#c5222a')&&variables.includes('--primary:#0b356b'),'palet institusional wajib');
assert(!/[âÂÃ]/.test(html),'landing tidak boleh mengandung karakter encoding rusak');
console.log('Government digital service design tests passed.');
