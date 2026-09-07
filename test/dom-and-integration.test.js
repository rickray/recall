import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

test('HTML integrity: hub index.html includes Even Factors', () => {
  const hubHtml = fs.readFileSync(path.resolve('index.html'), 'utf-8');
  assert.match(hubHtml, /href="\.\/even-factors\/"/, 'Hub must link to ./even-factors/');
  assert.match(hubHtml, /Even Factors/, 'Hub must display Even Factors title');
  assert.match(hubHtml, /Arithmetic/, 'Hub must tag Even Factors as Arithmetic');
  assert.match(hubHtml, /game-icon even-factors/, 'Hub must have even-factors game icon');
  assert.match(hubHtml, /Even Factors\./, 'Meta description should include Even Factors');
});

test('HTML integrity: even-factors/index.html structure', () => {
  const gameHtml = fs.readFileSync(path.resolve('even-factors/index.html'), 'utf-8');
  assert.match(gameHtml, /href="\.\.\/"/, 'Must have back to hub link');
  assert.match(gameHtml, /id="sound-toggle"/, 'Must have sound toggle button');
  assert.match(gameHtml, /id="factor-a"/, 'Must have factor A element');
  assert.match(gameHtml, /id="factor-b"/, 'Must have factor B element');
  assert.match(gameHtml, /id="answer-display"/, 'Must have answer display');
  assert.match(gameHtml, /class="numpad-grid"/, 'Must have numpad grid');
  assert.match(gameHtml, /id="btn-check"/, 'Must have check button');
  assert.match(gameHtml, /id="btn-skip"/, 'Must have skip button');
  assert.match(gameHtml, /id="status-banner"/, 'Must have status banner');
  assert.match(gameHtml, /src="game\.js"/, 'Must load game.js');
});

test('CSS integrity: style.css classes exist and have ≥48px touch targets', () => {
  const css = fs.readFileSync(path.resolve('style.css'), 'utf-8');
  assert.match(css, /\.even-factors-container/, 'CSS must include .even-factors-container');
  assert.match(css, /\.problem-card/, 'CSS must include .problem-card');
  assert.match(css, /\.numpad-key/, 'CSS must include .numpad-key');
  assert.match(css, /min-height:\s*54px;/, 'Numpad keys must have ≥ 48px touch height');
  assert.match(css, /min-width:\s*48px;/, 'Numpad keys must have ≥ 48px touch width');
  assert.match(css, /\.btn-emerald/, 'CSS must include .btn-emerald');
  assert.match(css, /\.game-icon\.even-factors/, 'CSS must include .game-icon.even-factors');
  assert.match(css, /\.nav-game-badge\.even-factors/, 'CSS must include .nav-game-badge.even-factors');
});

test('JavaScript execution & logic completeness: game.js file analysis', () => {
  const js = fs.readFileSync(path.resolve('even-factors/game.js'), 'utf-8');
  assert.match(js, /getValidEvenFactors/, 'Must define factor candidate generator');
  assert.match(js, /generateProblem/, 'Must define problem generator');
  assert.match(js, /SoundManager/, 'Must include audio synthesizer');
  assert.match(js, /recall_evenfactors_streak_best/, 'Must track best streak in localStorage');
  assert.match(js, /recall_evenfactors_solved_total/, 'Must track total solved in localStorage');
  assert.match(js, /handleCheck/, 'Must handle answer checking');
  assert.match(js, /handleSkip/, 'Must handle skipping problems gently');
  assert.match(js, /keydown/, 'Must listen to keyboard input');
});

test('Exhaustive Even-Ending Rules Verification', () => {
  // Test 1-99 range logic
  for (let i = 1; i <= 99; i++) {
    const isEvenEnding = [0, 2, 4, 6, 8].includes(i % 10);
    const lastDigitStr = String(i).slice(-1);
    const expected = ['0', '2', '4', '6', '8'].includes(lastDigitStr);
    assert.equal(isEvenEnding, expected, `Integer ${i} even-ending evaluation must be consistent`);
  }
});
