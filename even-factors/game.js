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

    playKey() {
      if (!this.enabled) return;
      this.init();
      if (!this.ctx) return;

      try {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        const now = this.ctx.currentTime;

        osc.type = 'sine';
        osc.frequency.setValueAtTime(440, now);

        gain.gain.setValueAtTime(0.001, now);
        gain.gain.exponentialRampToValueAtTime(0.08, now + 0.01);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(now);
        osc.stop(now + 0.05);
      } catch (e) {}
    }

    playSuccess() {
      if (!this.enabled) return;
      this.init();
      if (!this.ctx) return;

      try {
        const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
        notes.forEach((freq, idx) => {
          const osc = this.ctx.createOscillator();
          const gain = this.ctx.createGain();
          const startTime = this.ctx.currentTime + idx * 0.06;

          osc.type = 'triangle';
          osc.frequency.setValueAtTime(freq, startTime);

          gain.gain.setValueAtTime(0.001, startTime);
          gain.gain.exponentialRampToValueAtTime(0.12, startTime + 0.015);
          gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.15);

          osc.connect(gain);
          gain.connect(this.ctx.destination);

          osc.start(startTime);
          osc.stop(startTime + 0.16);
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
        osc.frequency.setValueAtTime(200, now);
        osc.frequency.linearRampToValueAtTime(140, now + 0.2);

        gain.gain.setValueAtTime(0.001, now);
        gain.gain.exponentialRampToValueAtTime(0.12, now + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(now);
        osc.stop(now + 0.25);
      } catch (e) {}
    }
  }

  // --- Factor Generator ---
  function getValidEvenFactors() {
    const factors = [];
    for (let i = 1; i <= 99; i++) {
      const lastDigit = i % 10;
      if ([0, 2, 4, 6, 8].includes(lastDigit)) {
        factors.push(i);
      }
    }
    return factors;
  }

  const allFactors = getValidEvenFactors();
  const singleDigitFactors = allFactors.filter(n => n < 10); // [2, 4, 6, 8]
  const doubleDigitFactors = allFactors.filter(n => n >= 10); // [10, 12, ... 98]

  function generateProblem(mode = 'mixed') {
    let a, b;
    if (mode === '1x2') {
      const pickFirstSingle = Math.random() < 0.5;
      if (pickFirstSingle) {
        a = singleDigitFactors[Math.floor(Math.random() * singleDigitFactors.length)];
        b = doubleDigitFactors[Math.floor(Math.random() * doubleDigitFactors.length)];
      } else {
        a = doubleDigitFactors[Math.floor(Math.random() * doubleDigitFactors.length)];
        b = singleDigitFactors[Math.floor(Math.random() * singleDigitFactors.length)];
      }
    } else if (mode === '2-digit') {
      a = doubleDigitFactors[Math.floor(Math.random() * doubleDigitFactors.length)];
      b = doubleDigitFactors[Math.floor(Math.random() * doubleDigitFactors.length)];
    } else {
      // Mixed: balanced sampling so single digits are reasonably common
      const pickSingleA = Math.random() < 0.35;
      const pickSingleB = Math.random() < 0.35;
      a = pickSingleA
        ? singleDigitFactors[Math.floor(Math.random() * singleDigitFactors.length)]
        : doubleDigitFactors[Math.floor(Math.random() * doubleDigitFactors.length)];
      b = pickSingleB
        ? singleDigitFactors[Math.floor(Math.random() * singleDigitFactors.length)]
        : doubleDigitFactors[Math.floor(Math.random() * doubleDigitFactors.length)];
    }

    return {
      a,
      b,
      product: a * b
    };
  }

  // --- Game Engine ---
  const sound = new SoundManager();

  // Elements
  const soundToggleBtn = document.getElementById('sound-toggle');
  const soundIconOn = document.getElementById('sound-icon-on');
  const soundIconOff = document.getElementById('sound-icon-off');
  const btnModeMixed = document.getElementById('btn-mode-mixed');
  const btnMode1x2 = document.getElementById('btn-mode-1x2');
  const btnMode2digit = document.getElementById('btn-mode-2digit');
  const solvedCountEl = document.getElementById('solved-count');
  const currentStreakEl = document.getElementById('current-streak');
  const bestStreakEl = document.getElementById('best-streak');
  const statusBanner = document.getElementById('status-banner');
  const problemCard = document.getElementById('problem-card');
  const factorAEl = document.getElementById('factor-a');
  const factorBEl = document.getElementById('factor-b');
  const answerDisplay = document.getElementById('answer-display');
  const numpadKeys = document.querySelectorAll('.numpad-key');
  const btnSkip = document.getElementById('btn-skip');
  const btnCheck = document.getElementById('btn-check');

  // State
  let currentMode = 'mixed';
  let currentProblem = null;
  let currentInput = '';
  let solvedTotal = parseInt(localStorage.getItem('recall_evenfactors_solved_total') || '0', 10);
  let currentStreak = 0;
  let bestStreak = parseInt(localStorage.getItem('recall_evenfactors_streak_best') || '0', 10);
  let isShowingSolution = false;
  let transitionTimeout = null;

  // Initialize UI
  solvedCountEl.textContent = solvedTotal;
  currentStreakEl.textContent = currentStreak;
  bestStreakEl.textContent = bestStreak;
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

  function renderInput() {
    if (currentInput === '') {
      answerDisplay.innerHTML = '<span class="answer-placeholder">?</span>';
    } else {
      answerDisplay.textContent = currentInput;
    }
  }

  function updateModeButtons() {
    const buttons = [btnModeMixed, btnMode1x2, btnMode2digit];
    buttons.forEach(btn => {
      const mode = btn.dataset.mode;
      const isActive = mode === currentMode;
      btn.classList.toggle('active', isActive);
      btn.setAttribute('aria-selected', isActive ? 'true' : 'false');
    });
  }

  function setMode(mode) {
    if (currentMode === mode) return;
    currentMode = mode;
    updateModeButtons();
    nextProblem();
  }

  btnModeMixed.addEventListener('click', () => setMode('mixed'));
  btnMode1x2.addEventListener('click', () => setMode('1x2'));
  btnMode2digit.addEventListener('click', () => setMode('2-digit'));

  function nextProblem() {
    if (transitionTimeout) {
      clearTimeout(transitionTimeout);
      transitionTimeout = null;
    }

    isShowingSolution = false;
    currentInput = '';
    renderInput();
    problemCard.classList.remove('flash-success', 'flash-error');

    currentProblem = generateProblem(currentMode);
    factorAEl.textContent = currentProblem.a;
    factorBEl.textContent = currentProblem.b;

    btnCheck.textContent = 'Check Answer';
    btnCheck.className = 'btn btn-emerald';
    btnSkip.textContent = 'Skip';
    btnSkip.disabled = false;
    setNumpadDisabled(false);

    setStatus('Enter the product and tap Check');
  }

  function setNumpadDisabled(disabled) {
    numpadKeys.forEach(key => {
      key.disabled = disabled;
    });
  }

  function handleDigitInput(digit) {
    if (isShowingSolution) {
      nextProblem();
      return;
    }

    if (currentInput.length >= 6) return;
    if (currentInput === '0' && digit === '0') return;
    if (currentInput === '0' && digit !== '0') {
      currentInput = digit;
    } else {
      currentInput += digit;
    }
    sound.playKey();
    renderInput();
  }

  function handleBackspace() {
    if (isShowingSolution) return;
    if (currentInput.length > 0) {
      currentInput = currentInput.slice(0, -1);
      sound.playKey();
      renderInput();
    }
  }

  function handleClear() {
    if (isShowingSolution) return;
    if (currentInput.length > 0) {
      currentInput = '';
      sound.playKey();
      renderInput();
    }
  }

  function handleCheck() {
    if (isShowingSolution) {
      nextProblem();
      return;
    }

    if (!currentInput) {
      setStatus('Please enter an answer first', 'highlight-amber');
      return;
    }

    const playerAnswer = parseInt(currentInput, 10);
    const correctAnswer = currentProblem.product;

    if (playerAnswer === correctAnswer) {
      // Correct!
      sound.playSuccess();
      solvedTotal++;
      currentStreak++;
      if (currentStreak > bestStreak) {
        bestStreak = currentStreak;
        localStorage.setItem('recall_evenfactors_streak_best', bestStreak);
        bestStreakEl.textContent = bestStreak;
      }
      localStorage.setItem('recall_evenfactors_solved_total', solvedTotal);
      solvedCountEl.textContent = solvedTotal;
      currentStreakEl.textContent = currentStreak;

      problemCard.classList.add('flash-success');
      setStatus(`Correct! ${currentProblem.a} × ${currentProblem.b} = ${correctAnswer}`, 'success');

      setNumpadDisabled(true);
      btnSkip.disabled = true;
      btnCheck.textContent = 'Next →';

      transitionTimeout = setTimeout(() => {
        nextProblem();
      }, 1200);
    } else {
      // Wrong answer - calm retry
      sound.playError();
      currentStreak = 0;
      currentStreakEl.textContent = currentStreak;

      problemCard.classList.add('flash-error');
      setTimeout(() => {
        problemCard.classList.remove('flash-error');
      }, 500);

      setStatus('Not quite. Try again or tap Skip.', 'error');
      currentInput = '';
      renderInput();
    }
  }

  function handleSkip() {
    if (isShowingSolution) {
      nextProblem();
      return;
    }

    if (transitionTimeout) {
      clearTimeout(transitionTimeout);
      transitionTimeout = null;
    }

    isShowingSolution = true;
    currentStreak = 0;
    currentStreakEl.textContent = currentStreak;

    currentInput = String(currentProblem.product);
    renderInput();
    sound.playError();

    setStatus(`Solution: ${currentProblem.a} × ${currentProblem.b} = ${currentProblem.product}`, 'highlight-amber');
    setNumpadDisabled(true);
    btnCheck.textContent = 'Next Problem →';
    btnSkip.textContent = 'Next';
  }

  // Keypad Event Listeners
  numpadKeys.forEach(key => {
    key.addEventListener('click', (e) => {
      e.preventDefault();
      sound.init();
      const digit = key.dataset.key;
      const action = key.dataset.action;

      if (digit !== undefined) {
        handleDigitInput(digit);
      } else if (action === 'backspace') {
        handleBackspace();
      } else if (action === 'clear') {
        handleClear();
      }
    });
  });

  btnCheck.addEventListener('click', () => {
    sound.init();
    handleCheck();
  });

  btnSkip.addEventListener('click', () => {
    sound.init();
    handleSkip();
  });

  // Physical Keyboard Support
  window.addEventListener('keydown', (e) => {
    sound.init();
    if (e.key >= '0' && e.key <= '9') {
      e.preventDefault();
      handleDigitInput(e.key);
    } else if (e.key === 'Backspace') {
      e.preventDefault();
      handleBackspace();
    } else if (e.key === 'Delete' || e.key === 'c' || e.key === 'C' || e.key === 'Escape') {
      e.preventDefault();
      handleClear();
    } else if (e.key === 'Enter') {
      e.preventDefault();
      handleCheck();
    } else if (e.key === ' ' || e.key === 's' || e.key === 'S') {
      if (isShowingSolution) {
        e.preventDefault();
        nextProblem();
      }
    }
  });

  // Start initial problem
  nextProblem();
})();
