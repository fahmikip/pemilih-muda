const fs=require('fs'),assert=require('assert');
const manifest=JSON.parse(fs.readFileSync('manifest.webmanifest','utf8')),sw=fs.readFileSync('service-worker.js','utf8'),install=fs.readFileSync('js/install.js','utf8'),quiz=fs.readFileSync('js/quiz.js','utf8');
assert.equal(manifest.start_url,'/pemilih-muda/');assert.equal(manifest.scope,'/pemilih-muda/');assert.equal(manifest.display,'standalone');
for(const size of [72,96,128,144,152,180,192,384,512])assert(fs.existsSync(`icons/icon-${size}.png`),`icon ${size} hilang`);
for(const size of [192,512])assert(fs.existsSync(`icons/maskable-${size}.png`),`maskable ${size} hilang`);
for(const icon of manifest.icons){const data=fs.readFileSync(icon.src);assert.equal(data.toString('ascii',1,4),'PNG');const expected=Number(icon.sizes.split('x')[0]);assert.equal(data.readUInt32BE(16),expected);assert.equal(data.readUInt32BE(20),expected)}
assert.match(sw,/url\.origin!==self\.location\.origin/);assert.match(sw,/request\.method!==['"]GET['"]/);assert.doesNotMatch(sw,/script\.google\.com/);assert.doesNotMatch(sw,/getProfile|submitQuiz|adminGet/);
assert.match(install,/beforeinstallprompt/);assert.match(install,/appinstalled/);assert.match(install,/display-mode: standalone/);assert.match(install,/SKIP_WAITING/);assert.match(install,/pemilih_muda_quiz_active/);
assert.match(quiz,/Jawaban tersimpan sementara di perangkat/);assert.match(quiz,/localStorage\.removeItem\(draftKey\(\)\)/);
for(const page of ['index.html','login.html','register.html','app.html','quiz.html','leaderboard.html','profile.html','admin.html']){const html=fs.readFileSync(page,'utf8');assert.match(html,/manifest\.webmanifest/,`${page} tanpa manifest`);assert.match(html,/apple-touch-icon/,`${page} tanpa apple icon`);assert.match(html,/js\/install\.js/,`${page} tanpa install lifecycle`)}
console.log('PWA production contract tests passed.');
