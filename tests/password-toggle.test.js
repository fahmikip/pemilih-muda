const fs=require('fs'),assert=require('assert');
const html=fs.readFileSync('login.html','utf8'),js=fs.readFileSync('js/auth.js','utf8'),css=fs.readFileSync('css/student.css','utf8');
assert.match(html,/data-password-toggle/);assert.match(html,/aria-controls="login-password"/);assert.match(html,/aria-pressed="false"/);
assert.match(html,/class="eye-open"/);assert.match(html,/class="eye-closed"/);assert(!/[👁🙈]/u.test(html),'ikon tidak boleh emoji');
assert.match(js,/input\.type=show\?'text':'password'/);assert.match(js,/Sembunyikan password/);assert.match(js,/Tampilkan password/);
assert(css.includes('.password-toggle')&&css.includes('width:44px;height:44px'),'tap target toggle harus 44px');
console.log('Password visibility toggle tests passed.');
