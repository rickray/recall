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

    playStimulus() {
      if (!this.enabled) return;
      this.init();
      if (!this.ctx) return;

      try {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        const now = this.ctx.currentTime;

        osc.type = 'sine';
        osc.frequency.setValueAtTime(480, now);

        gain.gain.setValueAtTime(0.001, now);
        gain.gain.exponentialRampToValueAtTime(0.12, now + 0.015);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(now);
        osc.stop(now + 0.12);
      } catch (e) {}
    }

    playClick() {
      if (!this.enabled) return;
      this.init();
      if (!this.ctx) return;

      try {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        const now = this.ctx.currentTime;

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(600, now);

        gain.gain.setValueAtTime(0.001, now);
        gain.gain.exponentialRampToValueAtTime(0.1, now + 0.01);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(now);
        osc.stop(now + 0.06);
      } catch (e) {}
    }

    playComplete() {
      if (!this.enabled) return;
      this.init();
      if (!this.ctx) return;

      try {
        const notes = [440, 554.37, 659.25, 880];
        notes.forEach((freq, idx) => {
          const osc = this.ctx.createOscillator();
          const gain = this.ctx.createGain();
          const startTime = this.ctx.currentTime + idx * 0.07;

          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, startTime);

          gain.gain.setValueAtTime(0.001, startTime);
          gain.gain.exponentialRampToValueAtTime(0.12, startTime + 0.02);
          gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.18);

          osc.connect(gain);
          gain.connect(this.ctx.destination);

          osc.start(startTime);
          osc.stop(startTime + 0.2);
        });
      } catch (e) {}
    }
  }

  // --- Game Engine ---
  const sound = new SoundManager();

  // Elements
  const soundToggleBtn = document.getElementById('sound-toggle');
  const soundIconOn = document.getElementById('sound-icon-on');
  const soundIconOff = document.getElementById('sound-icon-off');
  const btnN1 = document.getElementById('btn-n1');
  const btnN2 = document.getElementById('btn-n2');
  const currentTrialEl = document.getElementById('current-trial');
  const hitsCountEl = document.getElementById('hits-count');
  const faCountEl = document.getElementById('fa-count');
  const bestAccuracyEl = document.getElementById('best-accuracy');
  const progressBar = document.getElementById('progress-bar');
  const statusBanner = document.getElementById('status-banner');
  const cells = document.querySelectorAll('.nback-cell');
  const btnMatch = document.getElementById('btn-match');
  const btnNoMatch = document.getElementById('btn-nomatch');
  const matchHint = document.getElementById('match-hint');
  const actionArea = document.getElementById('action-area');
  const startBtn = document.getElementById('start-btn');
  const summaryCard = document.getElementById('summary-card');
  const summaryAccuracyEl = document.getElementById('summary-accuracy');
  const summaryHitsEl = document.getElementById('summary-hits');
  const summaryFaEl = document.getElementById('summary-fa');
  const summaryCrEl = document.getElementById('summary-cr');
  const restartBtn = document.getElementById('restart-btn');
  const rulesExplanation = document.getElementById('rules-explanation');

  // State
  let N = 1;
  let totalTrials = 21; // 20 + N
  let trials = [];
  let currentTrialIdx = -1;
  let isRoundActive = false;
  let hasRespondedThisTrial = false;
  let trialResponses = []; // true if match, false if nomatch, null if no response
  let trialTimer = null;

  // Best scores
  function getBestScoreKey() {
    return `recall_nback_n${N}_best`;
  }

  function loadBestScore() {
    const saved = localStorage.getItem(getBestScoreKey());
    if (saved !== null) {
      bestAccuracyEl.textContent = `${saved}%`;
    } else {
      bestAccuracyEl.textContent = '--';
    }
  }

  // Sound UI
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

  // Level Selection
  function setN(newN) {
    if (isRoundActive) return;
    N = newN;
    totalTrials = 20 + N;

    if (N === 1) {
      btnN1.classList.add('active');
      btnN1.setAttribute('aria-selected', 'true');
      btnN2.classList.remove('active');
      btnN2.setAttribute('aria-selected', 'false');
      matchHint.textContent = 'Same as 1 step back';
      startBtn.textContent = 'Start Round (21 Trials)';
      rulesExplanation.innerHTML = 'A cell lights up each trial. Tap <strong>Match</strong> if the lit cell is in the exact same location as <strong>1 step earlier</strong>. Tap <strong>No Match</strong> if it is different. A standard round consists of 20 test trials.';
    } else {
      btnN2.classList.add('active');
      btnN2.setAttribute('aria-selected', 'true');
      btnN1.classList.remove('active');
      btnN1.setAttribute('aria-selected', 'false');
      matchHint.textContent = 'Same as 2 steps back';
      startBtn.textContent = 'Start Round (22 Trials)';
      rulesExplanation.innerHTML = 'A cell lights up each trial. Tap <strong>Match</strong> if the lit cell is in the exact same location as <strong>2 steps earlier</strong>. Tap <strong>No Match</strong> if it is different. A standard round consists of 20 test trials.';
    }

    loadBestScore();
    resetStats();
  }

  btnN1.addEventListener('click', () => setN(1));
  btnN2.addEventListener('click', () => setN(2));

  function resetStats() {
    currentTrialEl.textContent = `0/${totalTrials}`;
    hitsCountEl.textContent = '0';
    faCountEl.textContent = '0';
    progressBar.style.width = '0%';
    clearBoard();
  }

  function setStatus(text, type = '') {
    statusBanner.textContent = text;
    statusBanner.className = 'status-banner';
    if (type) {
      statusBanner.classList.add(type);
    }
  }

  function clearBoard() {
    cells.forEach(cell => cell.classList.remove('active'));
  }

  // Generate sequence of 20 + N trials with ~30-35% matches
  function generateTrials() {
    const list = [];
    const testTrialCount = 20;
    const targetMatchCount = Math.floor(testTrialCount * 0.33); // ~6-7 matches
    let matchesCreated = 0;

    // Warmup trials (first N)
    for (let i = 0; i < N; i++) {
      list.push(Math.floor(Math.random() * 9));
    }

    // Remaining 20 trials
    for (let i = N; i < 20 + N; i++) {
      const remainingTrials = (20 + N) - i;
      const matchesNeeded = targetMatchCount - matchesCreated;
      const shouldMatch = matchesNeeded > 0 && (Math.random() < (matchesNeeded / remainingTrials) * 1.5 || remainingTrials <= matchesNeeded);

      if (shouldMatch) {
        list.push(list[i - N]);
        matchesCreated++;
      } else {
        let val;
        do {
          val = Math.floor(Math.random() * 9);
        } while (val === list[i - N]);
        list.push(val);
      }
    }

    return list;
  }

  function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async function startRound() {
    sound.init();
    isRoundActive = true;
    trials = generateTrials();
    currentTrialIdx = -1;
    trialResponses = new Array(totalTrials).fill(null);

    btnN1.disabled = true;
    btnN2.disabled = true;
    actionArea.style.display = 'none';
    summaryCard.style.display = 'none';

    resetStats();
    setStatus('Get ready...', 'highlight-purple');

    await sleep(800);
    runNextTrial();
  }

  async function runNextTrial() {
    if (!isRoundActive) return;

    currentTrialIdx++;

    if (currentTrialIdx >= totalTrials) {
      finishRound();
      return;
    }

    hasRespondedThisTrial = false;
    currentTrialEl.textContent = `${currentTrialIdx + 1}/${totalTrials}`;
    progressBar.style.width = `${((currentTrialIdx + 1) / totalTrials) * 100}%`;

    const cellIdx = trials[currentTrialIdx];
    clearBoard();
    cells[cellIdx].classList.add('active');
    sound.playStimulus();

    if (currentTrialIdx < N) {
      // Warmup phase
      setStatus(`Trial ${currentTrialIdx + 1} of ${totalTrials}: Memorize position...`, 'highlight-purple');
      btnMatch.disabled = true;
      btnNoMatch.disabled = true;
    } else {
      // Evaluation phase
      setStatus(`Trial ${currentTrialIdx + 1} of ${totalTrials}: Match or Different?`);
      btnMatch.disabled = false;
      btnNoMatch.disabled = false;
    }

    // Stimulus duration (850ms), then blank gap (650ms), total 1500ms per trial
    const stimulusDuration = 850;
    const intervalDuration = 1500;

    setTimeout(() => {
      clearBoard();
    }, stimulusDuration);

    trialTimer = setTimeout(() => {
      // If user didn't respond in eligible trial, record null
      if (currentTrialIdx >= N && !hasRespondedThisTrial) {
        trialResponses[currentTrialIdx] = null;
      }
      runNextTrial();
    }, intervalDuration);
  }

  function handleResponse(isMatch) {
    if (!isRoundActive || hasRespondedThisTrial || currentTrialIdx < N) return;

    hasRespondedThisTrial = true;
    trialResponses[currentTrialIdx] = isMatch;
    sound.playClick();

    // Visual button feedback
    const activeBtn = isMatch ? btnMatch : btnNoMatch;
    activeBtn.style.transform = 'scale(0.95)';
    setTimeout(() => {
      activeBtn.style.transform = '';
    }, 150);

    // Live update stats
    updateLiveScores();
  }

  function updateLiveScores() {
    let hits = 0;
    let falseAlarms = 0;

    for (let i = N; i <= currentTrialIdx; i++) {
      const resp = trialResponses[i];
      if (resp === null) continue;

      const isTarget = trials[i] === trials[i - N];
      if (resp === true) {
        if (isTarget) {
          hits++;
        } else {
          falseAlarms++;
        }
      }
    }

    hitsCountEl.textContent = hits;
    faCountEl.textContent = falseAlarms;
  }

  function finishRound() {
    isRoundActive = false;
    clearTimeout(trialTimer);
    clearBoard();

    btnMatch.disabled = true;
    btnNoMatch.disabled = true;
    btnN1.disabled = false;
    btnN2.disabled = false;

    // Calculate final metrics over the 20 test trials (indices N to totalTrials - 1)
    let totalTargets = 0;
    let totalNonTargets = 0;
    let hits = 0;
    let falseAlarms = 0;
    let misses = 0;
    let correctRejections = 0;

    for (let i = N; i < totalTrials; i++) {
      const isTarget = trials[i] === trials[i - N];
      const resp = trialResponses[i];

      if (isTarget) {
        totalTargets++;
        if (resp === true) {
          hits++;
        } else {
          misses++;
        }
      } else {
        totalNonTargets++;
        if (resp === true) {
          falseAlarms++;
        } else {
          correctRejections++;
        }
      }
    }

    const totalEvaluated = 20;
    const correctCount = hits + correctRejections;
    const accuracy = Math.round((correctCount / totalEvaluated) * 100);

    // Save best accuracy
    const currentBest = parseInt(localStorage.getItem(getBestScoreKey()) || '-1', 10);
    if (accuracy > currentBest) {
      localStorage.setItem(getBestScoreKey(), accuracy);
    }
    loadBestScore();

    // Sound
    sound.playComplete();

    // Summary Card
    setStatus(`Round Complete! Accuracy: ${accuracy}%`, 'success');
    summaryAccuracyEl.textContent = `${accuracy}%`;
    summaryHitsEl.textContent = `${hits} / ${totalTargets}`;
    summaryFaEl.textContent = `${falseAlarms}`;
    summaryCrEl.textContent = `${correctRejections} / ${totalNonTargets}`;

    summaryCard.style.display = 'block';
  }

  // Event Listeners
  btnMatch.addEventListener('click', () => handleResponse(true));
  btnNoMatch.addEventListener('click', () => handleResponse(false));

  startBtn.addEventListener('click', startRound);
  restartBtn.addEventListener('click', startRound);

  // Keyboard accessibility: Left / M for Match, Right / N for No Match, Space for Start
  window.addEventListener('keydown', (e) => {
    if (!isRoundActive) {
      if (e.code === 'Space' && actionArea.style.display !== 'none') {
        e.preventDefault();
        startRound();
      }
      return;
    }

    if (e.key === 'm' || e.key === 'M' || e.code === 'ArrowLeft') {
      e.preventDefault();
      handleResponse(true);
    } else if (e.key === 'n' || e.key === 'N' || e.code === 'ArrowRight') {
      e.preventDefault();
      handleResponse(false);
    }
  });

  // Init
  loadBestScore();
  updateSoundIcon();
})();
