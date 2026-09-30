/**
 * «Проверяем оплату» after the till — the course and club half of what `PaymentChecking` does for
 * a booking (0056).
 *
 * Coming back from the payment page used to look exactly like not having paid: the same price,
 * the same button. The webhook takes a few seconds to a couple of minutes, and in that gap people
 * paid twice. So once the till has been opened, the screen asks for the person's access every
 * {@link PENDING_POLL_MS} for {@link PENDING_WINDOW_MS}, says it is checking, and only then says
 * the money has not arrived — with the claim by order number and a message to us as the way on.
 *
 * Two parts, both without React so they run in a test:
 *
 * * **The marker** — that the till was opened for this product, and when. Kept in `localStorage`
 *   because on the open web the till replaces the page, and the way back is a fresh load. A
 *   per-viewer convenience only: without storage the check simply starts from the button, as it
 *   would in Telegram, where the till opens in another browser and the app never unloads.
 * * **The watch** — the poll itself: a window that restarts whenever the person comes back to the
 *   app (a payment page takes as long as it takes), one request at a time, and an end.
 */

/** How often access is asked for while checking. */
export const PENDING_POLL_MS = 5_000;
/** How long one check lasts before it says the payment has not arrived. */
export const PENDING_WINDOW_MS = 3 * 60_000;
/** A marker older than this is forgotten: nobody is still waiting on a payment from yesterday. */
export const PENDING_MARKER_TTL_MS = 2 * 60 * 60_000;

const MARKER_PREFIX = 'forma.payPending.';

export type PendingPhase = 'idle' | 'checking' | 'unconfirmed';

type StorageLike = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>;

function storage(): StorageLike | null {
  try {
    return typeof localStorage === 'undefined' ? null : localStorage;
  } catch {
    return null;
  }
}

/** The product a marker is for: `course:<id>` or `club`. */
export type PendingKey = `course:${string}` | 'club';

/** When the till was opened for this product, or null (never, forgotten, or no storage). */
export function readPendingMarker(
  key: PendingKey,
  now: number = Date.now(),
  store: StorageLike | null = storage(),
): number | null {
  if (!store) return null;
  try {
    const at = Number(store.getItem(MARKER_PREFIX + key));
    if (!Number.isFinite(at) || at <= 0 || now - at > PENDING_MARKER_TTL_MS || at > now + 60_000) {
      return null;
    }
    return at;
  } catch {
    return null;
  }
}

export function writePendingMarker(
  key: PendingKey,
  now: number = Date.now(),
  store: StorageLike | null = storage(),
): void {
  try {
    store?.setItem(MARKER_PREFIX + key, String(now));
  } catch {
    /* Private mode: the check still runs for as long as the screen stays open. */
  }
}

export function clearPendingMarker(key: PendingKey, store: StorageLike | null = storage()): void {
  try {
    store?.removeItem(MARKER_PREFIX + key);
  } catch {
    /* Nothing to clear. */
  }
}

export interface PendingWatchOptions {
  /** Re-reads access; resolves true once the product is owned. A rejection is simply asked again. */
  refresh: () => Promise<boolean>;
  onPhase: (phase: PendingPhase) => void;
  /** Called once when access appears. */
  onOwned: () => void;
  now?: () => number;
  setInterval?: (fn: () => void, ms: number) => unknown;
  clearInterval?: (id: unknown) => void;
}

export interface PendingWatch {
  /** Start (or restart) a check window: after opening the till, or on coming back to the app. */
  start: () => void;
  /** Restart only if a check is already showing — what a return to the app does. */
  resume: () => void;
  /** «Я не платил(а)», the owned product, or an unmount: stop, and show nothing. */
  stop: () => void;
  phase: () => PendingPhase;
}

export function createPendingWatch(options: PendingWatchOptions): PendingWatch {
  const now = options.now ?? Date.now;
  const every = options.setInterval ?? ((fn, ms) => globalThis.setInterval(fn, ms));
  const cancel =
    options.clearInterval ??
    ((id) => globalThis.clearInterval(id as ReturnType<typeof globalThis.setInterval>));
  let phase: PendingPhase = 'idle';
  let windowStart = 0;
  let timer: unknown = null;
  // Bumped by every stop/start, so an answer to an old request cannot revive a stopped watch.
  let generation = 0;
  // The generation whose request is in flight: one at a time, and a restart may ask at once.
  let asking = -1;

  const set = (next: PendingPhase) => {
    if (next === phase) return;
    phase = next;
    options.onPhase(next);
  };

  const halt = () => {
    if (timer !== null) cancel(timer);
    timer = null;
  };

  const tick = () => {
    if (phase !== 'checking') return;
    if (now() - windowStart >= PENDING_WINDOW_MS) {
      halt();
      set('unconfirmed');
      return;
    }
    if (asking === generation) return;
    const mine = generation;
    asking = mine;
    options
      .refresh()
      .then((owned) => {
        if (mine !== generation || !owned) return;
        generation += 1;
        halt();
        set('idle');
        options.onOwned();
      })
      .catch(() => {
        /* Asked again on the next tick. */
      })
      .finally(() => {
        if (asking === mine) asking = -1;
      });
  };

  const start = () => {
    generation += 1;
    halt();
    windowStart = now();
    set('checking');
    tick();
    timer = every(tick, PENDING_POLL_MS);
  };

  return {
    start,
    resume: () => {
      if (phase !== 'idle') start();
    },
    stop: () => {
      generation += 1;
      halt();
      set('idle');
    },
    phase: () => phase,
  };
}
