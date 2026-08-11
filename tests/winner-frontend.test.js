const assert=require('assert');const fs=require('fs');
const admin=fs.readFileSync('js/admin.js','utf8'),html=fs.readFileSync('admin.html','utf8'),profile=fs.readFileSync('js/profile.js','utf8'),rules=fs.readFileSync('rules.html','utf8');
['adminPrepareSeasonFinalization','adminDisqualifyCandidate','adminFinalizeWinner','adminVerifyWinner','adminUpdateRewardStatus','adminPublishWinner'].forEach(action=>assert.match(admin,new RegExp(action)));
assert.match(html,/id="admin-view"/);assert.match(admin,/Pengelolaan Pemenang/);assert.match(admin,/Pratinjau/);assert.match(admin,/Publikasikan/);assert.match(profile,/getPublishedWinner/);assert.match(rules,/hasil seri/i);assert.match(rules,/diskualifikasi/i);
console.log('Phase 8 winner frontend contract tests passed.');
