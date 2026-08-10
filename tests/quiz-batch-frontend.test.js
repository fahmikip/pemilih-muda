const assert=require('assert');const fs=require('fs');
const source=fs.readFileSync('js/quiz.js','utf8'),html=fs.readFileSync('quiz.html','utf8');
const apiActions=[...source.matchAll(/apiPost\("([^"]+)"/g)].map(match=>match[1]);
assert.deepEqual([...new Set(apiActions)].sort(),['startQuiz','submitQuiz']);
assert.equal(apiActions.filter(action=>action==='startQuiz').length,1);assert.equal(apiActions.filter(action=>action==='submitQuiz').length,1);
assert.equal(source.includes('submitAnswer'),false);assert.equal(source.includes('getCurrentQuestion'),false);
assert.match(source,/quiz_draft_/);assert.match(source,/quizSessionId,answers,currentIndex/);assert.equal(/CorrectAnswer|correctAnswer/.test(source.split('function renderResult')[0]),false);
assert.match(html,/data-previous/);assert.match(html,/data-next/);assert.match(html,/data-question-navigator/);assert.match(html,/data-submit-quiz/);assert.match(html,/data-confirm-dialog/);
console.log('Phase 6 frontend local-navigation contract tests passed.');
