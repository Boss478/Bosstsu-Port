type OscType = "square" | "triangle" | "sawtooth" | "sine";

type SfxNote = [string, number, OscType];

const SFX: Record<string, { notes: SfxNote[]; volume: number }> = {
  click: { notes: [["C5", 0.05, "square"]], volume: 0.3 },
  correct: { notes: [["C5", 0.1, "square"], ["E5", 0.1, "square"], ["G5", 0.15, "square"]], volume: 0.4 },
  wrong: { notes: [["E4", 0.15, "sawtooth"], ["C4", 0.2, "sawtooth"]], volume: 0.3 },
  snap: { notes: [["D5", 0.05, "triangle"]], volume: 0.35 },
  overload: { notes: [["A4", 0.1, "sawtooth"], ["A4", 0.1, "sawtooth"], ["A4", 0.1, "sawtooth"]], volume: 0.5 },
  boot: { notes: [["C4", 0.2, "square"], ["E4", 0.15, "square"], ["G4", 0.1, "square"], ["C5", 0.3, "square"]], volume: 0.4 },
  card: { notes: [["C5", 0.08, "triangle"], ["E5", 0.08, "triangle"], ["G5", 0.08, "triangle"], ["C6", 0.2, "triangle"]], volume: 0.4 },
  victory: { notes: [["C5", 0.15, "square"], ["D5", 0.15, "square"], ["E5", 0.15, "square"], ["F5", 0.15, "square"], ["G5", 0.15, "square"], ["A5", 0.15, "square"], ["C6", 0.4, "square"]], volume: 0.5 },
};

const NOTES: Record<string, number> = {
  C4: 261.63, D4: 293.66, E4: 329.63, F4: 349.23, G4: 392.00, A4: 440.00, B4: 493.88,
  C5: 523.25, D5: 587.33, E5: 659.25, F5: 698.46, G5: 783.99, A5: 880.00, B5: 987.77,
  C6: 1046.50,
};

const TRACKS: Record<string, { notes: [string, number][]; bpm: number }> = {
  menu: {
    bpm: 120,
    notes: [
      ["C4", 0.5], ["E4", 0.5], ["G4", 0.5], ["C5", 0.5],
      ["G4", 0.5], ["E4", 0.5], ["D4", 0.5], ["F4", 0.5],
      ["A4", 0.5], ["C5", 0.5], ["A4", 0.5], ["F4", 0.5],
      ["E4", 0.5], ["G4", 0.5], ["C5", 0.5], ["C5", 0.5],
    ],
  },
  hardware: {
    bpm: 100,
    notes: [
      ["C4", 0.5], ["F4", 0.5], ["A4", 0.5], ["F4", 0.5],
      ["C4", 0.5], ["F4", 0.5], ["A4", 0.5], ["G4", 0.5],
      ["E4", 0.5], ["G4", 0.5], ["B4", 0.5], ["G4", 0.5],
    ],
  },
  software: {
    bpm: 90,
    notes: [
      ["D4", 0.5], ["F4", 0.5], ["A4", 0.5], ["F4", 0.5],
      ["D4", 0.5], ["F4", 0.5], ["A4", 0.5], ["G4", 0.5],
      ["E4", 0.5], ["G4", 0.5], ["B4", 0.5], ["C5", 0.5],
    ],
  },
  workflow: {
    bpm: 130,
    notes: [
      ["C4", 0.25], ["E4", 0.25], ["G4", 0.25], ["C5", 0.25],
      ["E5", 0.25], ["D5", 0.25], ["C5", 0.25], ["B4", 0.25],
      ["C5", 0.25], ["C5", 0.5], ["C5", 0.25], ["C5", 0.25],
    ],
  },
  build: {
    bpm: 110,
    notes: [
      ["F4", 0.5], ["A4", 0.5], ["C5", 0.5], ["F5", 0.5],
      ["E5", 0.25], ["D5", 0.25], ["C5", 0.5], ["A4", 0.5],
    ],
  },
  diagnosis: {
    bpm: 80,
    notes: [
      ["A3", 0.5], ["C4", 0.5], ["A3", 0.5], ["E4", 0.5],
      ["D4", 0.25], ["C4", 0.25], ["A3", 0.5], ["E4", 0.5],
    ],
  },
  victory: {
    bpm: 140,
    notes: [
      ["C5", 0.25], ["D5", 0.25], ["E5", 0.25], ["F5", 0.25],
      ["G5", 0.25], ["A5", 0.25], ["C6", 0.5], ["C6", 0.5],
      ["C6", 0.25], ["B5", 0.25], ["A5", 0.25], ["G5", 0.25],
      ["F5", 0.25], ["E5", 0.25], ["C5", 1.0], ["C5", 1.0],
    ],
  },
};

class AudioEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private currentTrack: string | null = null;
  private scheduledNodes: OscillatorNode[] = [];
  private timeoutIds: ReturnType<typeof setTimeout>[] = [];
  private _muted = false;
  private _volume = 0.7;

  init(): void {
    if (this.ctx) return;
    this.ctx = new AudioContext();
    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.value = this._muted ? 0 : this._volume;
    this.masterGain.connect(this.ctx.destination);
  }

  get muted(): boolean {
    return this._muted;
  }

  setMuted(muted: boolean): void {
    this._muted = muted;
    if (this.masterGain) {
      this.masterGain.gain.value = muted ? 0 : this._volume;
    }
    if (muted) this.stopMusic();
  }

  setVolume(vol: number): void {
    this._volume = vol;
    if (this.masterGain && !this._muted) {
      this.masterGain.gain.value = vol;
    }
  }

  private getCtx(): AudioContext | null {
    if (!this.ctx) return null;
    if (this.ctx.state === "suspended") {
      this.ctx.resume();
    }
    return this.ctx;
  }

  private playNote(
    freq: number,
    duration: number,
    type: OscType,
    startTime: number,
    vol: number,
  ): void {
    const ctx = this.getCtx();
    if (!ctx || !this.masterGain) return;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(vol, startTime);
    gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);
    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(startTime);
    osc.stop(startTime + duration + 0.05);
    this.scheduledNodes.push(osc);
  }

  playSfx(name: string): void {
    const sfx = SFX[name as keyof typeof SFX];
    if (!sfx) return;
    const ctx = this.getCtx();
    if (!ctx) return;
    const now = ctx.currentTime;
    sfx.notes.forEach(([note, dur, type], i) => {
      const offset = sfx.notes.slice(0, i).reduce((sum, [, d]) => sum + d, 0);
      const freq = NOTES[note];
      if (freq) this.playNote(freq, dur, type, now + offset, sfx.volume);
    });
  }

  playMusic(trackId: string): void {
    this.stopMusic();
    if (this._muted) return;
    const track = TRACKS[trackId];
    if (!track) return;
    this.currentTrack = trackId;
    const ctx = this.getCtx();
    if (!ctx) return;

    const beatDuration = 60 / track.bpm;
    const loopDuration = track.notes.reduce((sum, [, dur]) => sum + dur * beatDuration, 0);

    const scheduleLoop = () => {
      if (this.currentTrack !== trackId) return;
      const now = ctx.currentTime;
      let offset = 0;
      for (const [note, dur] of track.notes) {
        const freq = NOTES[note];
        if (freq) {
          this.playNote(freq, dur * beatDuration, "square", now + offset, 0.15);
        }
        offset += dur * beatDuration;
      }
      const tid = setTimeout(scheduleLoop, (loopDuration - 0.01) * 1000);
      this.timeoutIds.push(tid);
    };

    scheduleLoop();
  }

  stopMusic(): void {
    this.currentTrack = null;
    for (const tid of this.timeoutIds) clearTimeout(tid);
    this.timeoutIds = [];
    for (const osc of this.scheduledNodes) {
      try { osc.stop(); } catch { }
    }
    this.scheduledNodes = [];
  }

  dispose(): void {
    this.stopMusic();
    if (this.ctx) {
      this.ctx.close();
      this.ctx = null;
    }
  }
}

export const audioEngine = new AudioEngine();
