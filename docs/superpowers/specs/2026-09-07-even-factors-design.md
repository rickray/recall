# Even Factors Game Design Specification

## Overview
Even Factors is a calm, focused arithmetic drill for adults on Recall (https://rickray.github.io/recall/). Players solve random multiplication problems where both factors are 1- or 2-digit positive integers that end in an even digit (0, 2, 4, 6, or 8). There are no timers or harsh fail states.

## Target Audience & Aesthetics
- Adults looking for calm arithmetic training.
- Clean, minimal dark UI matching `style.css` design system:
  - Background: `--bg-primary` (#0d1117), `--bg-surface` (#161b22)
  - Accent: `--accent-emerald` (#34d399) / `--accent-emerald-dim` (rgba(52, 211, 153, 0.12))
  - Text: `--text-primary` (#f0f6fc), `--text-secondary` (#8b949e), `--text-muted` (#6e7681)
  - Fonts: System font stack + monospace for numbers
  - Mobile-first, one-handed touch targets (≥ 48px min-height/width).
- No external libraries, no frameworks, no ads, no analytics, no IAP, pure static HTML/CSS/JS.

## Rules & Mathematical Specification
1. **Factor Generation**:
   - Every factor $n$ is an integer in the range $1 \le n \le 99$.
   - The last digit of $n$ ($n \pmod{10}$) must be in $\{0, 2, 4, 6, 8\}$.
   - 1-digit candidates: $\{2, 4, 6, 8\}$ (note: 0 is excluded since factors are non-zero positive multipliers in natural multiplication drill, 1-99 range).
   - 2-digit candidates: tens digit $\in \{1, \ldots, 9\}$, units digit $\in \{0, 2, 4, 6, 8\}$, i.e., $10, 12, 14, 16, 18, 20, \ldots, 98$. (Total 45 two-digit candidates).
   - Total valid candidates = 4 + 45 = 49 numbers.
   - **Single-Digit Constraint (Required)**: EVERY problem has at least one factor that is a single digit $\in \{2, 4, 6, 8\}$. The other factor is 1 or 2 digits ending in an even digit (0, 2, 4, 6, 8). Both factors are never simultaneously two-digit.
   - Modes:
     - **Mixed**: At least one factor is single-digit (2, 4, 6, 8), other factor sampled from all valid even-ending numbers (1- or 2-digit).
     - **1-Digit × 1-Digit**: Both factors from $\{2, 4, 6, 8\}$.
     - **1-Digit × 2-Digit**: One factor from $\{2, 4, 6, 8\}$, other from $\{10, 12, \ldots, 98\}$.
2. **Product**:
   - $P = a \times b$.
3. **Calm Drill Flow**:
   - **Correct Answer**: Shows success message/feedback ("Correct! 24 × 50 = 1200"), increments solved count and streak, plays gentle success tone, and transitions to the next problem automatically after a short delay (or immediately on Next).
   - **Wrong Answer**: Shows gentle error message ("Not quite, try again"), plays soft error tone, clears/focuses input so player can retry immediately, or tap "Skip" to see the solution and move to the next problem.
   - **Skip**: Reveals the correct product gently ("24 × 50 = 1200") and provides "Next Problem" button or advances calmly.
4. **Stats & Persistence**:
   - Tracks `Solved`, `Current Streak`, and `Best Streak` using `localStorage` keys (`recall_evenfactors_streak_best`, `recall_evenfactors_solved_total`).
5. **Controls & One-Handed Layout**:
   - Problem display: Large formatted equation, e.g., `<span class="factor">24</span> × <span class="factor">50</span> = <span class="answer-box">?</span>`.
   - On-screen numeric keypad (1-9, 0, Backspace/Clear, Submit/Check) optimized for one-handed thumb use, with button touch targets ≥ 48px.
   - Standard keyboard input support (number keys 0-9, Enter to submit, Backspace/Delete, Space for Next/Skip).
   - Navigation: Back to Recall Hub link (`../`), Audio toggle button with Web Audio synthesizer (same architecture as Sequence / N-back / Spatial Grid).
