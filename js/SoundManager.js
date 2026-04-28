class SoundManager {
  constructor() {
    this.enabled = true;
    this.musicEnabled = true;
    this.sfxEnabled = true;
    this._bgmRunning = false;
    this._bgmLoopTimeout = null;
    this._bgmStep = 0;

    try {
      this.ctx = new (window.AudioContext || window.webkitAudioContext)();
    } catch (e) {
      this.enabled = false;
      return;
    }

    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.value = 0.65;
    this.masterGain.connect(this.ctx.destination);

    this.sfxGain = this.ctx.createGain();
    this.sfxGain.gain.value = 1.0;
    this.sfxGain.connect(this.masterGain);

    this.bgmGain = this.ctx.createGain();
    this.bgmGain.gain.value = 0.22;
    this.bgmGain.connect(this.masterGain);
  }

  resume() {
    if (this.ctx && this.ctx.state === 'suspended') this.ctx.resume();
  }

  // ─── SFX ────────────────────────────────────────────────────────────

  playShoot(isPlayer = true) {
    if (!this.enabled) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const g   = this.ctx.createGain();
    osc.connect(g); g.connect(this.sfxGain);
    if (isPlayer) {
      osc.type = 'square';
      osc.frequency.setValueAtTime(900, now);
      osc.frequency.exponentialRampToValueAtTime(180, now + 0.07);
      g.gain.setValueAtTime(0.22, now);
      g.gain.exponentialRampToValueAtTime(0.001, now + 0.07);
      osc.start(now); osc.stop(now + 0.07);
    } else {
      osc.type = 'square';
      osc.frequency.setValueAtTime(380, now);
      osc.frequency.exponentialRampToValueAtTime(90, now + 0.09);
      g.gain.setValueAtTime(0.12, now);
      g.gain.exponentialRampToValueAtTime(0.001, now + 0.09);
      osc.start(now); osc.stop(now + 0.09);
    }
  }

  playExplosion(big = false) {
    if (!this.enabled) return;
    const now = this.ctx.currentTime;
    const dur = big ? 0.65 : 0.38;

    // White-noise burst
    const bufSize = Math.floor(this.ctx.sampleRate * dur);
    const buf = this.ctx.createBuffer(1, bufSize, this.ctx.sampleRate);
    const d   = buf.getChannelData(0);
    for (let i = 0; i < bufSize; i++) d[i] = Math.random() * 2 - 1;

    const src    = this.ctx.createBufferSource();
    const filter = this.ctx.createBiquadFilter();
    const ng     = this.ctx.createGain();
    src.buffer = buf;
    filter.type = 'lowpass';
    filter.frequency.value = big ? 700 : 1100;
    src.connect(filter); filter.connect(ng); ng.connect(this.sfxGain);
    ng.gain.setValueAtTime(big ? 0.85 : 0.45, now);
    ng.gain.exponentialRampToValueAtTime(0.001, now + dur);
    src.start(now);

    // Low thump for big explosion
    if (big) {
      const thump  = this.ctx.createOscillator();
      const tgain  = this.ctx.createGain();
      thump.connect(tgain); tgain.connect(this.sfxGain);
      thump.type = 'sine';
      thump.frequency.setValueAtTime(90, now);
      thump.frequency.exponentialRampToValueAtTime(18, now + 0.5);
      tgain.gain.setValueAtTime(0.7, now);
      tgain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
      thump.start(now); thump.stop(now + 0.5);
    }
  }

  playPowerUp(type) {
    if (!this.enabled) return;
    const now = this.ctx.currentTime;
    const configs = [
      { notes: [659, 784, 1047],        waveType: 'sine',     label:'speed'  },
      { notes: [523, 659, 784, 1047],   waveType: 'triangle', label:'shield' },
      { notes: [220, 110, 440, 880, 55],waveType: 'sawtooth', label:'bomb'   },
    ];
    const { notes, waveType } = configs[type] || configs[0];
    notes.forEach((freq, i) => {
      const osc = this.ctx.createOscillator();
      const g   = this.ctx.createGain();
      osc.connect(g); g.connect(this.sfxGain);
      osc.type = waveType;
      osc.frequency.value = freq;
      const t = now + i * 0.09;
      g.gain.setValueAtTime(0.28, t);
      g.gain.exponentialRampToValueAtTime(0.001, t + 0.14);
      osc.start(t); osc.stop(t + 0.15);
    });
  }

  playLevelClear() {
    if (!this.enabled) return;
    const notes = [523, 659, 784, 1047, 784, 659, 1047, 1319];
    const durs  = [0.1, 0.1, 0.1,  0.2, 0.1, 0.1,  0.2,  0.45];
    let t = this.ctx.currentTime + 0.15;
    notes.forEach((freq, i) => {
      const osc = this.ctx.createOscillator();
      const g   = this.ctx.createGain();
      osc.connect(g); g.connect(this.sfxGain);
      osc.type = 'square';
      osc.frequency.value = freq;
      g.gain.setValueAtTime(0.3, t);
      g.gain.exponentialRampToValueAtTime(0.001, t + durs[i]);
      osc.start(t); osc.stop(t + durs[i] + 0.02);
      t += durs[i] + 0.025;
    });
  }

  playGameOver() {
    if (!this.enabled) return;
    const notes = [392, 349, 330, 220, 262];
    const durs  = [0.2, 0.2, 0.2, 0.4, 0.5];
    let t = this.ctx.currentTime + 0.15;
    notes.forEach((freq, i) => {
      const osc = this.ctx.createOscillator();
      const g   = this.ctx.createGain();
      osc.connect(g); g.connect(this.sfxGain);
      osc.type = 'sawtooth';
      osc.frequency.value = freq;
      g.gain.setValueAtTime(0.3, t);
      g.gain.exponentialRampToValueAtTime(0.001, t + durs[i]);
      osc.start(t); osc.stop(t + durs[i] + 0.02);
      t += durs[i] + 0.03;
    });
  }

  // ─── BGM ────────────────────────────────────────────────────────────

  startBGM() {
    if (!this.enabled || !this.musicEnabled || this._bgmRunning) return;
    this._bgmRunning = true;
    this._loopMelody();
  }

  stopBGM() {
    this._bgmRunning = false;
    if (this._bgmLoopTimeout) { clearTimeout(this._bgmLoopTimeout); this._bgmLoopTimeout = null; }
  }

  toggleMusic() {
    this.musicEnabled = !this.musicEnabled;
    if (this.musicEnabled) {
      this.bgmGain.gain.setTargetAtTime(0.22, this.ctx.currentTime, 0.3);
      this.startBGM();
    } else {
      this.stopBGM();
      this.bgmGain.gain.setTargetAtTime(0, this.ctx.currentTime, 0.3);
    }
    return this.musicEnabled;
  }

  toggleSFX() {
    this.sfxEnabled = !this.sfxEnabled;
    this.sfxGain.gain.setTargetAtTime(this.sfxEnabled ? 1.0 : 0, this.ctx.currentTime, 0.1);
    return this.sfxEnabled;
  }

  _loopMelody() {
    if (!this._bgmRunning) return;

    const BPM  = 128;
    const STEP = (60 / BPM) / 4; // 16th note in seconds

    // Chiptune battle theme (freq, 16th-note-steps)
    const melody = [
      // A section — march
      [330,2],[0,1],[392,1],[440,2],[0,1],[392,1],[330,1],
      [330,1],[262,1],[0,1],[294,2],[0,1],[247,1],[0,2],
      [262,2],[0,1],[330,1],[392,2],[0,1],[440,1],[392,1],
      [330,2],[294,1],[0,1],[262,4],[0,4],
      // B section — tension
      [440,2],[0,1],[494,1],[523,2],[0,1],[494,1],[440,1],
      [440,1],[392,1],[0,1],[349,2],[0,1],[330,1],[0,2],
      [294,2],[0,1],[349,1],[392,2],[0,1],[440,1],[392,1],
      [349,2],[330,1],[0,1],[294,2],[262,2],[0,4],
      // C section — drive
      [523,1],[0,1],[494,1],[0,1],[440,1],[0,1],[392,1],[0,1],
      [440,1],[0,1],[494,1],[0,1],[523,2],[0,2],[523,2],[0,2],
      [392,1],[0,1],[440,1],[0,1],[494,1],[0,1],[523,1],[0,1],
      [494,2],[440,2],[392,4],[0,4],
    ];

    const startTime = this.ctx.currentTime + 0.05;
    let t = startTime;

    melody.forEach(([freq, steps]) => {
      const dur = steps * STEP;
      if (freq > 0) this._bgmNote(freq, dur, t);
      t += dur;
    });

    const totalDur = melody.reduce((s, [, steps]) => s + steps, 0) * STEP;
    this._bgmLoopTimeout = setTimeout(() => this._loopMelody(), (totalDur - 0.08) * 1000);
  }

  _bgmNote(freq, dur, startAt) {
    // Lead
    const osc  = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.connect(gain); gain.connect(this.bgmGain);
    osc.type = 'square';
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0, startAt);
    gain.gain.linearRampToValueAtTime(0.45, startAt + 0.01);
    gain.gain.setValueAtTime(0.38, startAt + dur * 0.75);
    gain.gain.linearRampToValueAtTime(0, startAt + dur * 0.92);
    osc.start(startAt); osc.stop(startAt + dur);

    // Bass (octave below, pulse)
    const bass  = this.ctx.createOscillator();
    const bgain = this.ctx.createGain();
    bass.connect(bgain); bgain.connect(this.bgmGain);
    bass.type = 'sawtooth';
    bass.frequency.value = freq / 2;
    bgain.gain.setValueAtTime(0, startAt);
    bgain.gain.linearRampToValueAtTime(0.25, startAt + 0.01);
    bgain.gain.linearRampToValueAtTime(0, startAt + dur * 0.5);
    bass.start(startAt); bass.stop(startAt + dur * 0.55);
  }
}

const Sound = new SoundManager();
