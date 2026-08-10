const assert=require('assert');const fs=require('fs');
const source=fs.readFileSync('js/leaderboard.js','utf8'),profile=fs.readFileSync('js/profile.js','utf8'),html=fs.readFileSync('leaderboard.html','utf8'),dashboard=fs.readFileSync('app.html','utf8');
assert.match(source,/getLeaderboardSeasons/);assert.match(source,/getLeaderboard/);assert.match(source,/getSchoolLeaderboard/);assert.match(source,/getMyRank/);assert.equal(source.includes('innerHTML'),false);
assert.match(source,/await loadMyRank/);assert.match(source,/data\.seasonPoint/);assert.match(source,/data\.totalParticipants/);
assert.match(profile,/getMyRank/);assert.match(profile,/data-my-rank/);assert.match(dashboard,/data-ranking-card/);assert.match(dashboard,/LIHAT LEADERBOARD/);
assert.match(html,/data-podium/);assert.match(html,/data-my-rank-card/);assert.match(html,/data-season-filter/);assert.match(html,/data-board-tab="school"/);
console.log('Phase 7 leaderboard frontend contract tests passed.');
