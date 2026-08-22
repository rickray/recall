(() => {
  // --- Audio System ---
  class SoundManager {
    constructor() {
      this.ctx = null;
      this.enabled = localStorage.getItem('recall_sound_enabled') !== 'false';
    }

    init() {
      if (!this.ctx) {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        if (AudioCtx) {
          this.ctx = new AudioCtx();
        }
      }
      if (this.ctx && this.ctx.state === 'suspended') {
        this.ctx.resume();
      }
    }

    toggle() {
      this.enabled = !this.enabled;
      localStorage.setItem('recall_sound_enabled', this.enabled);
      return this.enabled;
    }

    playFlash() {
      if (!this.enabled) return;
      this.init();
      if (!this.ctx) return;

      try {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        const now = this.ctx.currentTime;

        osc.type = 'sine';
        osc.frequency.setValueAtTime(392, now); // G4

        gain.gain.setValueAtTime(0.001, now);
        gain.gain.exponentialRampToValueAtTime(0.15, now + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(now);
        osc.stop(now + 0.25);
      } catch (e) {}
    }

    playTap(pitch = 520) {
      if (!this.enabled) return;
      this.init();
      if (!this.ctx) return;

      try {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        const now = this.ctx.currentTime;

        osc.type = 'sine';
        osc.frequency.setValueAtTime(pitch, now);

        gain.gain.setValueAtTime(0.001, now);
        gain.gain.exponentialRampToValueAtTime(0.1, now + 0.01);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(now);
        osc.stop(now + 0.08);
      } catch (e) {}
    }

    playSuccess() {
      if (!this.enabled) return;
      this.init();
      if (!this.ctx) return;

      try {
        const notes = [440, 554.37, 659.25, 880];
        notes.forEach((freq, idx) => {
          const osc = this.ctx.createOscillator();
          const gain = this.ctx.createGain();
          const startTime = this.ctx.currentTime + idx * 0.07;

          osc.type = 'triangle';
          osc.frequency.setValueAtTime(freq, startTime);

          gain.gain.setValueAtTime(0.001, startTime);
          gain.gain.exponentialRampToValueAtTime(0.12, startTime + 0.02);
          gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.2);

          osc.connect(gain);
          gain.connect(this.ctx.destination);

          osc.start(startTime);
          osc.stop(startTime + 0.22);
        });
      } catch (e) {}
    }

    playError() {
      if (!this.enabled) return;
      this.init();
      if (!this.ctx) return;

      try {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        const now = this.ctx.currentTime;

        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(150, now);
        osc.frequency.linearRampToValueAtTime(100, now + 0.3);

        gain.gain.setValueAtTime(0.001, now);
        gain.gain.exponentialRampToValueAtTime(0.18, now + 0.03);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(now);
        osc.stop(now + 0.35);
      } catch (e) {}
    }
  }

  // --- Game Engine ---
  const sound = new SoundManager();

  // Elements
  const soundToggleBtn = document.getElementById('sound-toggle');
  const soundIconOn = document.getElementById('sound-icon-on');
  const soundIconOff = document.getElementById('sound-icon-off');
  const currentCellsEl = document.getElementById('current-cells');
  const bestCellsEl = document.getElementById('best-cells');
  const statusBanner = document.getElementById('status-banner');
  const cells = document.querySelectorAll('.grid-cell');
  const actionArea = document.getElementById('action-area');
  const startBtn = document.getElementById('start-btn');
  const summaryCard = document.getElementById('summary-card');
  const summaryScoreEl = document.getElementById('summary-score');
  const summaryBestEl = document.getElementById('summary-best');
  const restartBtn = document.getElementById('restart-btn');

  // State
  let currentLength = 3;
  let targetCells = new Set();
  let selectedCells = new Set();
  let isFlashing = false;
  let isGameActive = false;
  let bestLength = parseInt(localStorage.getItem('recall_grid_best') || '0', 10);

  // Initialize UI
  bestCellsEl.textContent = bestLength;
  updateSoundIcon();

  function updateSoundIcon() {
    if (sound.enabled) {
      soundToggleBtn.classList.add('active');
      soundIconOn.style.display = 'block';
      soundIconOff.style.display = 'none';
      soundToggleBtn.setAttribute('aria-label', 'Mute audio');
    } else {
      soundToggleBtn.classList.remove('active');
      soundIconOn.style.display = 'none';
      soundIconOff.style.display = 'block';
      soundToggleBtn.setAttribute('aria-label', 'Enable audio');
    }
  }

  soundToggleBtn.addEventListener('click', () => {
    sound.toggle();
    updateSoundIcon();
  });

  function setStatus(text, type = '') {
    statusBanner.textContent = text;
    statusBanner.className = 'status-banner';
    if (type) {
      statusBanner.classList.add(type);
    }
  }

  function setCellsDisabled(disabled) {
    cells.forEach(cell => {
      if (disabled) {
        cell.classList.add('disabled');
      } else {
        cell.classList.remove('disabled');
      }
    });
  }

  function clearCellClasses() {
    cells.forEach(cell => {
      cell.classList.remove('flash', 'selected', 'correct', 'wrong', 'missed');
    });
  }

  function generateTargetPattern(count) {
    const indices = [];
    while (indices.length < count) {
      const r = Math.floor(Math.random() * 16);
      if (!indices.includes(r)) {
        indices.push(r);
      }
    }
    return new Set(indices);
  }

  function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async function playRound() {
    isFlashing = true;
    selectedCells.clear();
    clearCellClasses();
    setCellsDisabled(true);

    targetCells = generateTargetPattern(currentLength);
    currentCellsEl.textContent = currentLength;

    setStatus(`Memorize pattern (${currentLength} cells)...`, 'highlight-amber');
    await sleep(400);

    // Flash target cells
    targetCells.forEach(idx => {
      cells[idx].classList.add('flash');
    });
    sound.playFlash();

    const flashDuration = Math.min(1800, 750 + currentLength * 120);
    await sleep(flashDuration);

    if (!isGameActive) return;

    // Unflash
    clearCellClasses();
    isFlashing = false;
    setCellsDisabled(false);
    setStatus(`Tap ${currentLength} cells (0/${currentLength} selected)`);
  }

  function startGame() {
    sound.init();
    isGameActive = true;
    currentLength = 3;
    currentCellsEl.textContent = currentLength;

    actionArea.style.display = 'none';
    summaryCard.style.display = 'none';

    playRound();
  }

  async function handleCellClick(cellIdx) {
    if (!isGameActive || isFlashing) return;

    const cell = cells[cellIdx];

    if (selectedCells.has(cellIdx)) {
      // Unselect
      selectedCells.delete(cellIdx);
      cell.classList.remove('selected');
      sound.playTap(400);
    } else {
      // Select
      if (selectedCells.size >= currentLength) return;
      selectedCells.add(cellIdx);
      cell.classList.add('selected');
      sound.playTap(520 + selectedCells.size * 30);
    }

    setStatus(`Tap ${currentLength} cells (${selectedCells.size}/${currentLength} selected)`);

    // Check if target count reached
    if (selectedCells.size === currentLength) {
      await evaluatePattern();
    }
  }

  async function evaluatePattern() {
    setCellsDisabled(true);

    let isMatch = true;
    selectedCells.forEach(idx => {
      if (!targetCells.has(idx)) {
        isMatch = false;
      }
    });

    if (isMatch) {
      // Success!
      selectedCells.forEach(idx => {
        cells[idx].classList.remove('selected');
        cells[idx].classList.add('correct');
      });
      sound.playSuccess();
      setStatus('Pattern Matched!', 'success');

      if (currentLength > bestLength) {
        bestLength = currentLength;
        localStorage.setItem('recall_grid_best', bestLength);
        bestCellsEl.textContent = bestLength;
      }

      await sleep(850);

      if (!isGameActive) return;

      currentLength++;
      currentCellsEl.textContent = currentLength;
      playRound();
    } else {
      // Mistake / Game Over
      isGameActive = false;
      sound.playError();
      setStatus('Incorrect pattern', 'error');

      // Highlight results: correct, wrong, missed
      selectedCells.forEach(idx => {
        cells[idx].classList.remove('selected');
        if (targetCells.has(idx)) {
          cells[idx].classList.add('correct');
        } else {
          cells[idx].classList.add('wrong');
        }
      });

      targetCells.forEach(idx => {
        if (!selectedCells.has(idx)) {
          cells[idx].classList.add('missed');
        }
      });

      const reachedScore = currentLength;
      summaryScoreEl.textContent = reachedScore;
      summaryBestEl.textContent = bestLength;

      await sleep(800);

      summaryCard.style.display = 'block';
    }
  }

  // Cell listeners
  cells.forEach(cell => {
    const idx = parseInt(cell.dataset.index, 10);
    cell.addEventListener('click', (e) => {
      e.preventDefault();
      handleCellClick(idx);
    });
  });

  // Buttons
  startBtn.addEventListener('click', startGame);
  restartBtn.addEventListener('click', startGame);
})();
