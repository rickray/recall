# Even Factors Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement the "Even Factors" arithmetic multiplication game in `even-factors/`, integrate it into `index.html` hub and `style.css`, and ensure all constraints (even-ending factors, one-handed touch layout, dark theme, no frameworks) are fulfilled with full verification.

**Architecture:** Vanilla HTML5 + CSS + ES6 JavaScript. Clean separation of factor generator and game logic for testability with Node.js built-in test runner.

**Tech Stack:** Static HTML/CSS/JS, Web Audio API, Web Storage API (localStorage), Node.js `node:test` for unit tests.

## Global Constraints
- Target directory: `/even-factors/` (`index.html`, `game.js`).
- Hub card on `index.html` linking to `./even-factors/` with tag "Arithmetic" and accent color emerald (`--accent-emerald`).
- Meta description on `index.html` updated to include Even Factors.
- Styling in `style.css` matching existing dark theme tokens (`--bg-primary: #0d1117`, `--accent-emerald: #34d399`, etc.).
- Mobile-first, tap targets ≥ 48px, one-handed thumb pad.
- Factors: 1–2 digit integers (1–99), BOTH must end in 0, 2, 4, 6, or 8.
- No timers, calm drill, gentle retry or skip.

---

### Task 1: Factor Generator & Game Logic Unit Tests
- Create `test/even-factors.test.js` to test candidate generation, factor validation, multiplication verification, state management, and edge cases using Node's `node:test` and `node:assert`.

### Task 2: CSS Styles for Even Factors
- Add `.even-factors-container`, `.problem-card`, `.problem-equation`, `.answer-display`, `.numpad-grid`, `.numpad-key`, `.action-row`, and accent badge styling `.nav-game-badge.even-factors`, `.game-icon.even-factors` into `style.css`.

### Task 3: HTML Markup for Even Factors Page
- Create `even-factors/index.html` following the structure of `sequence/index.html`, `n-back/index.html`, and `grid/index.html`.

### Task 4: JavaScript Game Implementation
- Create `even-factors/game.js` implementing the sound manager, factor generator, keypad handlers, keyboard handlers, streak/best tracking in `localStorage`, calm feedback banners, and skip/retry mechanisms.

### Task 5: Hub & README Integration
- Update `index.html` with the new game card, emerald icon badge, "Arithmetic" tag, and updated meta description.
- Update `README.md` to list Even Factors under Games.

### Task 6: Verification & Test Execution
- Run `node --test test/even-factors.test.js`.
- Test DOM integration, check all touch target sizes and CSS rules.
