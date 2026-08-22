(() => {
  // --- Audio System ---
  class SoundManager {
    constructor() {
      this.ctx = null;
      this.enabled = localStorage.getItem('recall_sound_enabled') !== 'false';
      this.frequencies = [329.63, 392.00, 440.00, 523.25]; // E4, G4, A4, C5
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

    playTone(padIndex, duration = 0.25) {
      if (!this.enabled) return;
      this.init();
      if (!this.ctx) return;

      try {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(this.frequencies[padIndex] || 440, this.ctx.currentTime);

        const now = this.ctx.currentTime;
        gain.gain.setValueAtTime(0.001, now);
        gain.gain.exponentialRampToValueAtTime(0.2, now + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(now);
        osc.stop(now + duration);
      } catch (e) {
        // Audio error fallback
      }
    }

    playSuccess() {
      if (!this.enabled) return;
      this.init();
      if (!this.ctx) return;

      try {
        const notes = [523.25, 659.25, 783.99]; // C5, E5, G5
        notes.forEach((freq, idx) => {
          const osc = this.ctx.createOscillator();
          const gain = this.ctx.createGain();
          const startTime = this.ctx.currentTime + idx * 0.08;

          osc.type = 'triangle';
          osc.frequency.setValueAtTime(freq, startTime);

          gain.gain.setValueAtTime(0.001, startTime);
          gain.gain.exponentialRampToValueAtTime(0.15, startTime + 0.02);
          gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.18);

          osc.connect(gain);
          gain.connect(this.ctx.destination);

          osc.start(startTime);
          osc.stop(startTime + 0.2);
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
        osc.frequency.setValueAtTime(140, now);
        osc.frequency.linearRampToValueAtTime(90, now + 0.3);

        gain.gain.setValueAtTime(0.001, now);
        gain.gain.exponentialRampToValueAtTime(0.2, now + 0.03);
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
  const currentLengthEl = document.getElementById('current-length');
  const bestLengthEl = document.getElementById('best-length');
  const statusBanner = document.getElementById('status-banner');
  const pads = document.querySelectorAll('.pad');
  const actionArea = document.getElementById('action-area');
  const startBtn = document.getElementById('start-btn');
  const summaryCard = document.getElementById('summary-card');
  const summaryScoreEl = document.getElementById('summary-score');
  const summaryBestEl = document.getElementById('summary-best');
  const restartBtn = document.getElementById('restart-btn');

  // State
  let sequence = [];
  let playerStep = 0;
  let isPlayingSequence = false;
  let isGameActive = false;
  let bestLength = parseInt(localStorage.getItem('recall_sequence_best') || '0', 10);

  // Initialize UI
  bestLengthEl.textContent = bestLength;
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

  function setPadsDisabled(disabled) {
    pads.forEach(pad => {
      if (disabled) {
        pad.classList.add('disabled');
      } else {
        pad.classList.remove('disabled');
      }
    });
  }

  function activatePad(index, duration = 300) {
    const pad = pads[index];
    if (!pad) return;

    pad.classList.add('active');
    sound.playTone(index, duration / 1000);

    setTimeout(() => {
      pad.classList.remove('active');
    }, duration);
  }

  function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async function playSequence() {
    isPlayingSequence = true;
    setPadsDisabled(true);
    setStatus('Watch sequence...', 'highlight');

    await sleep(400);

    const stepSpeed = Math.max(220, 500 - sequence.length * 15);
    const gapSpeed = Math.max(120, 250 - sequence.length * 8);

    for (let i = 0; i < sequence.length; i++) {
      if (!isGameActive) return;
      const padIdx = sequence[i];
      activatePad(padIdx, stepSpeed);
      await sleep(stepSpeed + gapSpeed);
    }

    if (!isGameActive) return;

    isPlayingSequence = false;
    setPadsDisabled(false);
    playerStep = 0;
    setStatus(`Your turn (1 of ${sequence.length})`);
  }

  function startGame() {
    sound.init();
    isGameActive = true;
    sequence = [Math.floor(Math.random() * 4)];
    playerStep = 0;
    currentLengthEl.textContent = sequence.length;

    actionArea.style.display = 'none';
    summaryCard.style.display = 'none';

    playSequence();
  }

  async function handlePadPress(padIndex) {
    if (!isGameActive || isPlayingSequence) return;

    // Trigger visual and audio feedback
    activatePad(padIndex, 200);

    // Verify step
    if (padIndex === sequence[playerStep]) {
      playerStep++;

      if (playerStep === sequence.length) {
        // Sequence completed successfully
        setPadsDisabled(true);
        setStatus('Sequence matched!', 'success');
        sound.playSuccess();

        // Update score
        const completedLength = sequence.length;
        if (completedLength > bestLength) {
          bestLength = completedLength;
          localStorage.setItem('recall_sequence_best', bestLength);
          bestLengthEl.textContent = bestLength;
        }

        await sleep(700);

        if (!isGameActive) return;

        // Next level
        sequence.push(Math.floor(Math.random() * 4));
        currentLengthEl.textContent = sequence.length;
        playSequence();
      } else {
        setStatus(`Your turn (${playerStep + 1} of ${sequence.length})`);
      }
    } else {
      // Mistake / Game Over
      isGameActive = false;
      setPadsDisabled(true);
      sound.playError();
      setStatus('Incorrect sequence', 'error');

      const reachedLength = sequence.length;
      summaryScoreEl.textContent = reachedLength;
      summaryBestEl.textContent = bestLength;

      await sleep(600);

      summaryCard.style.display = 'block';
    }
  }

  // Pad touch/click listeners
  pads.forEach(pad => {
    const padIdx = parseInt(pad.dataset.pad, 10);
    pad.addEventListener('click', (e) => {
      e.preventDefault();
      handlePadPress(padIdx);
    });
  });

  // Buttons
  startBtn.addEventListener('click', startGame);
  restartBtn.addEventListener('click', startGame);
})();
