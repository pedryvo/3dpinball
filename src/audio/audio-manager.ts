/**
 * Web Audio API Manager for 3-D Ultra Pinball
 * Handles authentic PCM sound effects (WAV) and procedural FM retro space soundtrack synthesizer.
 */

export class AudioManager {
  private ctx: AudioContext | null = null;
  private sfxBuffers = new Map<string, AudioBuffer>();
  private sfxEnabled = true;
  private musicEnabled = true;
  private masterVolume = 0.8;
  private sfxVolume = 0.9;
  private musicVolume = 0.45;
  private isSynthesizingMusic = false;
  private musicInterval: number | null = null;
  private musicNodes: AudioNode[] = [];

  // Fallback mappings for sound names referenced in physics engine to extracted audio files
  private soundAliases: Record<string, string> = {
    'SPRING1.WAV': 'KACHUNK4.WAV',
    'GATE1.WAV': 'DOOR1.WAV',
    'LOCK1.WAV': 'KACHUNK3.WAV',
    'DRAIN1.WAV': 'PENALTY1.WAV',
    'RUBBER1.WAV': 'ROLL1.WAV',
    'LOSE2.WAV': 'LOSE1.WAV',
    'OOPS2.WAV': 'OOPS1.WAV',
    'TILT1.WAV': 'OOPS1.WAV',
  };

  constructor() {
    // AudioContext will be initialized on the first user interaction to comply with autoplay policy
  }

  public ensureContext(): AudioContext {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  public async preloadSounds(): Promise<void> {
    const sfxList = [
      'CRYSTAL1.WAV', 'DEMAT1.WAV', 'DOOR1.WAV', 'ELEC1.WAV', 'ELEC2.WAV',
      'EXPLO1.WAV', 'EXPLO2.WAV', 'FANFARE1.WAV', 'FANFARE2.WAV', 'FIRE1.WAV',
      'FLIPPER.WAV', 'HYDRLC1.WAV', 'KACHUNK1.WAV', 'KACHUNK2.WAV', 'KACHUNK3.WAV',
      'KACHUNK4.WAV', 'LOSE1.WAV', 'MOTOR1.WAV', 'OOPS1.WAV', 'PENALTY1.WAV',
      'REMAT1.WAV', 'ROCKET1.WAV', 'ROLL1.WAV', 'SCORE1.WAV', 'SCORE2.WAV',
      'SCORE3.WAV', 'SCORE4.WAV', 'SCORE5.WAV', 'SCORE10.WAV', 'VICTORY1.WAV',
      'WHOOSH1.WAV', 'WHOOSH2.WAV', 'ZAP1.WAV', 'ZAP2.WAV', 'ZAP3.WAV', 'ZAP4.WAV',
    ];

    await Promise.all(
      sfxList.map(async (filename) => {
        try {
          const resp = await fetch(`/sfx/${filename}`);
          if (!resp.ok) return;
          const arrayBuffer = await resp.arrayBuffer();
          const ctx = this.ensureContext();
          const audioBuffer = await ctx.decodeAudioData(arrayBuffer);
          this.sfxBuffers.set(filename, audioBuffer);
        } catch {
          // Ignore individual fetch failure during offline or test mode
        }
      })
    );
  }

  public playSound(soundName: string, panX = 246): void {
    if (!this.sfxEnabled) return;
    const ctx = this.ensureContext();
    if (!ctx) return;

    const resolved = this.soundAliases[soundName] ?? soundName;
    const buffer = this.sfxBuffers.get(resolved);

    if (buffer) {
      const source = ctx.createBufferSource();
      source.buffer = buffer;

      const gain = ctx.createGain();
      gain.gain.value = this.masterVolume * this.sfxVolume;

      // Stereo panning from table x (0..480)
      const panner = ctx.createStereoPanner ? ctx.createStereoPanner() : null;
      if (panner) {
        const clampedX = Math.max(0, Math.min(480, panX));
        panner.pan.value = (clampedX / 240) - 1.0;
        source.connect(gain);
        gain.connect(panner);
        panner.connect(ctx.destination);
      } else {
        source.connect(gain);
        gain.connect(ctx.destination);
      }

      source.start();
    } else {
      // Procedural synthesizer fallback for sounds not loaded
      this.playSynthSfxFallback(soundName, panX);
    }
  }

  /**
   * High-fidelity synthesizer fallback if WAV files are still loading or network is offline
   */
  private playSynthSfxFallback(type: string, panX: number): void {
    const ctx = this.ensureContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const panner = ctx.createStereoPanner ? ctx.createStereoPanner() : null;

    if (panner) {
      const clampedX = Math.max(0, Math.min(480, panX));
      panner.pan.value = (clampedX / 240) - 1.0;
      osc.connect(gain);
      gain.connect(panner);
      panner.connect(ctx.destination);
    } else {
      osc.connect(gain);
      gain.connect(ctx.destination);
    }

    if (type.includes('FLIPPER')) {
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(120, now);
      osc.frequency.exponentialRampToValueAtTime(40, now + 0.05);
      gain.gain.setValueAtTime(0.25, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
      osc.start(now);
      osc.stop(now + 0.05);
    } else if (type.includes('ZAP') || type.includes('ELEC')) {
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(880, now);
      osc.frequency.exponentialRampToValueAtTime(140, now + 0.12);
      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
      osc.start(now);
      osc.stop(now + 0.12);
    } else if (type.includes('SCORE') || type.includes('CRYSTAL')) {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(1046.5, now);
      osc.frequency.setValueAtTime(1318.5, now + 0.06);
      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.16);
      osc.start(now);
      osc.stop(now + 0.16);
    } else {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(320, now);
      osc.frequency.exponentialRampToValueAtTime(90, now + 0.09);
      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.09);
      osc.start(now);
      osc.stop(now + 0.09);
    }
  }

  /**
   * Procedural FM/MIDI retro space synthesizer soundtrack
   * Produces an authentic 1995 DOS/Win32 space outpost ambient groove.
   */
  public startMusic(): void {
    if (!this.musicEnabled || this.isSynthesizingMusic) return;
    const ctx = this.ensureContext();
    if (!ctx) return;

    this.isSynthesizingMusic = true;
    let step = 0;

    // Chord progression in D minor space scale: Dm -> Bb -> Gm -> A
    const bassNotes = [73.42, 58.27, 49.00, 55.00]; // D2, Bb1, G1, A1
    const leadScale = [293.66, 329.63, 349.23, 392.00, 440.00, 523.25, 587.33]; // D4, E4, F4, G4, A4, C5, D5

    const tick = () => {
      if (!this.isSynthesizingMusic || !this.musicEnabled) return;
      const now = ctx.currentTime;

      // Bass synth note every 4 beats
      if (step % 4 === 0) {
        const chordIdx = Math.floor(step / 16) % bassNotes.length;
        const bassFreq = bassNotes[chordIdx];

        const bassOsc = ctx.createOscillator();
        const bassGain = ctx.createGain();
        const filter = ctx.createBiquadFilter();

        bassOsc.type = 'sawtooth';
        bassOsc.frequency.setValueAtTime(bassFreq, now);

        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(350, now);
        filter.frequency.exponentialRampToValueAtTime(120, now + 0.35);

        bassGain.gain.setValueAtTime(this.musicVolume * 0.28, now);
        bassGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.38);

        bassOsc.connect(filter);
        filter.connect(bassGain);
        bassGain.connect(ctx.destination);

        bassOsc.start(now);
        bassOsc.stop(now + 0.4);
      }

      // Arpeggio synth lead note
      if (step % 2 === 0) {
        const noteIdx = (step * 3) % leadScale.length;
        const leadFreq = leadScale[noteIdx];

        const leadOsc = ctx.createOscillator();
        const leadGain = ctx.createGain();
        const leadFilter = ctx.createBiquadFilter();

        leadOsc.type = 'triangle';
        leadOsc.frequency.setValueAtTime(leadFreq, now);

        leadFilter.type = 'bandpass';
        leadFilter.frequency.setValueAtTime(800 + (step % 8) * 120, now);
        leadFilter.Q.value = 3.0;

        leadGain.gain.setValueAtTime(this.musicVolume * 0.16, now);
        leadGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.18);

        leadOsc.connect(leadFilter);
        leadFilter.connect(leadGain);
        leadGain.connect(ctx.destination);

        leadOsc.start(now);
        leadOsc.stop(now + 0.2);
      }

      step++;
    };

    // 125 BPM 16th-note clock (~120ms interval)
    this.musicInterval = window.setInterval(tick, 120);
  }

  public stopMusic(): void {
    this.isSynthesizingMusic = false;
    if (this.musicInterval !== null) {
      clearInterval(this.musicInterval);
      this.musicInterval = null;
    }
  }

  public toggleSfx(enabled?: boolean): boolean {
    this.sfxEnabled = enabled !== undefined ? enabled : !this.sfxEnabled;
    return this.sfxEnabled;
  }

  public toggleMusic(enabled?: boolean): boolean {
    this.musicEnabled = enabled !== undefined ? enabled : !this.musicEnabled;
    if (this.musicEnabled) {
      this.startMusic();
    } else {
      this.stopMusic();
    }
    return this.musicEnabled;
  }

  public isSfxOn(): boolean {
    return this.sfxEnabled;
  }

  public isMusicOn(): boolean {
    return this.musicEnabled;
  }

  public setMasterVolume(vol: number): void {
    this.masterVolume = Math.max(0, Math.min(1, vol));
  }
}
