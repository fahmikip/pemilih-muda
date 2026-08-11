const fs=require('fs'),path=require('path'),assert=require('assert');
const root=path.resolve(__dirname,'..');
const htmlFiles=fs.readdirSync(root).filter(file=>file.endsWith('.html'));
for(const file of htmlFiles){
  const html=fs.readFileSync(path.join(root,file),'utf8');
  assert.match(html,/<html lang="id">/,`${file}: bahasa dokumen belum ditetapkan`);
  assert.match(html,/<title>[^<]+ — Pemilih Muda<\/title>|<title>Pemilih Muda — [^<]+<\/title>/,`${file}: judul halaman tidak konsisten`);
  assert.match(html,/rel="icon" href="icons\/icon-192\.png"/,`${file}: favicon belum tersedia`);
  assert.match(html,/rel="apple-touch-icon" href="icons\/apple-touch-icon\.png"/,`${file}: apple-touch-icon belum tersedia`);
  for(const href of html.matchAll(/href="([^"#]+)(?:#[^"]*)?"/g)){
    const target=href[1];
    if(/^(?:https?:|mailto:|tel:|\.\/|#)/.test(target))continue;
    const local=target.split('?')[0];
    assert(fs.existsSync(path.join(root,local)),`${file}: tautan lokal tidak ditemukan: ${local}`);
  }
}
const participantFiles=['index.html','app.html','leaderboard.html','profile.html','quiz.html','rules.html','js/app.js','js/profile.js','js/leaderboard.js','js/quiz.js'];
const participantCopy=participantFiles.map(file=>fs.readFileSync(path.join(root,file),'utf8')).join('\n');
assert(!/\b(?:Demo|Dummy|Lorem ipsum)\b/i.test(participantCopy),'copy peserta masih memuat data nonproduksi');
assert(!/\bPoint\b/.test(participantCopy),'istilah Point belum diubah menjadi Poin');
assert(!/(?:validasi server|dihitung server|dari ledger|dapat diaudit|deployment API)/i.test(participantCopy),'copy teknis masih tampil kepada peserta');
const utils=fs.readFileSync(path.join(root,'js/utils.js'),'utf8');
assert.match(utils,/isProductionContent/,'penyaring konten nonproduksi belum tersedia');
for(const file of ['js/app.js','js/profile.js','js/leaderboard.js','js/materials.js','js/quiz.js'])assert.match(fs.readFileSync(path.join(root,file),'utf8'),/isProductionContent/,`${file}: data nonproduksi belum disaring`);
const landing=fs.readFileSync(path.join(root,'index.html'),'utf8');
for(const marker of ['Beranda','Alur Layanan','Leaderboard','Tentang','Masuk','Daftar','Install App','Privasi','Aturan Program'])assert(landing.includes(marker),`CTA/tautan landing hilang: ${marker}`);
assert.match(landing,/href="https:\/\/github\.com\/fahmikip"[^>]*>fahmikip<\/a>/,'copyright GitHub belum tersedia');
assert.match(landing,/class="mobile-nav-cta" href="login\.html">Masuk/);
assert.match(landing,/class="mobile-nav-cta" href="register\.html">Daftar/);
const base=fs.readFileSync(path.join(root,'css/base.css'),'utf8'),responsive=fs.readFileSync(path.join(root,'css/responsive.css'),'utf8');
assert.match(base,/overflow-x:clip/,'proteksi horizontal overflow hilang');
assert.match(base,/:focus-visible/,'focus keyboard global hilang');
assert.match(responsive,/max-width:760px/,'aturan mobile hilang');
assert.match(responsive,/100dvh/,'menu mobile belum dibatasi viewport');
const install=fs.readFileSync(path.join(root,'js/install.js'),'utf8');
assert.match(install,/registration\.waiting/,'update PWA yang sudah menunggu tidak dideteksi');
assert.match(install,/updateOffered/,'notifikasi update belum dilindungi dari pengulangan');
assert.match(install,/controllerchange[\s\S]*pwa-toast/,'notifikasi update tidak dibersihkan setelah aktivasi');
const config=fs.readFileSync(path.join(root,'js/config.js'),'utf8'),worker=fs.readFileSync(path.join(root,'service-worker.js'),'utf8');
assert.match(config,/APP_VERSION:"1\.0\.0"/);
assert.match(worker,/VERSION='1\.0\.0'/);
console.log(`Final UI audit passed for ${htmlFiles.length} pages.`);
