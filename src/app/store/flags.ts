/**
 * The signed-in person's feature flags (0049, `src/lib/flags.ts`).
 *
 * Loaded by the session store next to the profile and entitlements, re-read with them on a
 * return to the foreground, and cleared when the session ends. A flag is off until the answer
 * arrives and off when the request fails: a flag hides something new, and a network blip must
 * never show it to somebody it was not switched on for — nor throw on a screen that asks.
 */
import { create } from 'zustand';
import { listMyFlags } from '@/lib/api/flags';
import type { Flag } from '@/lib/flags';

export interface FlagsState {
  /** The flags that are on; empty until loaded. */
  flags: readonly string[];
  loaded: boolean;
  /** Read the flags again. Never rejects: a failure leaves every flag off. */
  load: () => Promise<void>;
  clear: () => void;
}

/** Bumped by `clear()`, so a load that started before a sign-out does not write back after it. */
let epoch = 0;

export const useFlags = create<FlagsState>((set, get) => ({
  flags: [],
  loaded: false,
  load: async () => {
    const startedAt = epoch;
    let flags: readonly string[];
    try {
      flags = await listMyFlags();
    } catch {
      // Never loaded: everything stays off. Loaded before: a failed re-read keeps what was
      // known, the way the session keeps its entitlements, so a blip does not blink a card away.
      flags = get().loaded ? get().flags : [];
    }
    if (startedAt !== epoch) return;
    set({ flags, loaded: true });
  },
  clear: () => {
    epoch += 1;
    set({ flags: [], loaded: false });
  },
}));

/** Whether this flag is on for the signed-in person. False until loaded and on any error. */
export function useFlag(flag: Flag): boolean {
  return useFlags((s) => s.flags.includes(flag));
}
