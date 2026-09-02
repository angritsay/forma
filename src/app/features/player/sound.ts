/**
 * Audio cues for the player (WebAudio, no assets): 3-2-1 ticks, step transitions, round marks.
 * The mute switch is persisted in localStorage under `forma.sound`. The AudioContext is created
 * lazily inside a user gesture (`unlockAudio`) because browsers block autoplay otherwise.
 */
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

export const SOUND_STORAGE_KEY = 'forma.sound';

export type Cue = 'tick' | 'go' | 'round' | 'end';

interface SoundState {
  muted: boolean;
  setMuted: (muted: boolean) => void;
  toggleMuted: () => void;
}

export const useSoundStore = create<SoundState>()(
  persist(
    (set) => ({
      muted: false,
      setMuted: (muted) => set({ muted }),
      toggleMuted: () => set((s) => ({ muted: !s.muted })),
    }),
    {
      name: SOUND_STORAGE_KEY,
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({ muted: s.muted }),
    },
  ),
);

type AudioContextCtor = typeof AudioContext;

let context: AudioContext | null = null;
let unavailable = false;

function getContext(): AudioContext | null {
  if (context) return context;
  if (unavailable || typeof window === 'undefined') return null;
  const w = window as typeof window & { webkitAudioContext?: AudioContextCtor };
  const Ctor = w.AudioContext ?? w.webkitAudioContext;
  if (!Ctor) {
    unavailable = true;
    return null;
  }
  try {
    context = new Ctor();
  } catch {
    unavailable = true;
    return null;
  }
  return context;
}

function resume(c: AudioContext): void {
  if (c.state === 'suspended') void c.resume().catch(() => undefined);
}

/** Create / resume the audio context. Call from a pointer or key handler. */
export function unlockAudio(): void {
  if (useSoundStore.getState().muted) return;
  const c = getContext();
  if (c) resume(c);
}

const CUES: Record<Cue, readonly { hz: number; ms: number }[]> = {
  tick: [{ hz: 660, ms: 90 }],
  go: [{ hz: 880, ms: 120 }],
  round: [
    { hz: 784, ms: 80 },
    { hz: 988, ms: 120 },
  ],
  end: [
    { hz: 880, ms: 120 },
    { hz: 1175, ms: 240 },
  ],
};

/** Play a cue unless muted or audio is unavailable. Never throws. */
export function playCue(cue: Cue): void {
  if (useSoundStore.getState().muted) return;
  const c = getContext();
  if (!c) return;
  resume(c);
  try {
    let at = c.currentTime + 0.01;
    for (const note of CUES[cue]) {
      const osc = c.createOscillator();
      const gain = c.createGain();
      const dur = note.ms / 1000;
      osc.type = 'sine';
      osc.frequency.value = note.hz;
      gain.gain.setValueAtTime(0.0001, at);
      gain.gain.exponentialRampToValueAtTime(0.25, at + 0.012);
      gain.gain.exponentialRampToValueAtTime(0.0001, at + dur);
      osc.connect(gain).connect(c.destination);
      osc.start(at);
      osc.stop(at + dur + 0.02);
      at += dur + 0.04;
    }
  } catch {
    /* A closed context or an odd browser: silence is fine. */
  }
}

export interface Sound {
  muted: boolean;
  toggle: () => void;
  beep: (cue: Cue) => void;
  unlock: () => void;
}

export function useSound(): Sound {
  const muted = useSoundStore((s) => s.muted);
  const toggleMuted = useSoundStore((s) => s.toggleMuted);
  return {
    muted,
    toggle: () => {
      toggleMuted();
      unlockAudio();
    },
    beep: playCue,
    unlock: unlockAudio,
  };
}
