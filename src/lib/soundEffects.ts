// src/lib/soundEffects.ts
const SOUND_PREF_KEY = "habit_pulse_sound_enabled";

let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!audioCtx) {
    const AudioCtx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext?: typeof AudioContext })
        .webkitAudioContext;
    if (AudioCtx) {
      audioCtx = new AudioCtx();
    }
  }
  if (audioCtx && audioCtx.state === "suspended") {
    audioCtx.resume().catch(() => {});
  }
  return audioCtx;
}

export function isSoundEnabled(): boolean {
  if (typeof window === "undefined") return true;
  const stored = localStorage.getItem(SOUND_PREF_KEY);
  return stored === null ? true : stored === "true";
}

export function setSoundEnabled(enabled: boolean): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(SOUND_PREF_KEY, String(enabled));
}

function playTone(
  freq: number,
  startOffsetSec: number,
  durationSec: number,
  type: OscillatorType = "sine",
  peakGain = 0.14
): void {
  if (!isSoundEnabled()) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime + startOffsetSec;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = type;
  osc.frequency.setValueAtTime(freq, now);

  // Smooth attack & exponential decay (eliminates audio clicks)
  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.linearRampToValueAtTime(peakGain, now + 0.015);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + durationSec);

  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.start(now);
  osc.stop(now + durationSec + 0.02);
}

export const soundFX = {
  /** Crisp ascending chime when a new habit is created */
  addHabit() {
    playTone(523.25, 0, 0.14, "triangle", 0.14); // C5
    playTone(783.99, 0.08, 0.22, "sine", 0.16); // G5
  },

  /** Tactile satisfying pop-ding on habit check-in */
  checkHabit() {
    playTone(659.25, 0, 0.12, "sine", 0.16); // E5
    playTone(987.77, 0.06, 0.24, "triangle", 0.14); // B5
  },

  /** Subtle soft descending tone on delete */
  deleteHabit() {
    playTone(440, 0, 0.12, "sine", 0.12); // A4
    playTone(329.63, 0.07, 0.18, "sine", 0.1); // E4
  },

  /** Celebratory arpeggio fanfare when a milestone badge unlocks */
  achievementUnlock() {
    playTone(523.25, 0, 0.18, "triangle", 0.16); // C5
    playTone(659.25, 0.08, 0.18, "triangle", 0.16); // E5
    playTone(783.99, 0.16, 0.2, "triangle", 0.18); // G5
    playTone(1046.5, 0.25, 0.45, "sine", 0.2); // C6
  },
};