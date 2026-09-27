/**
 * What the club screen remembers about *this person on this phone* between visits.
 *
 * The owner's brief for the active week is «геймифицировать… регулярная подпитка дофамином…
 * желание зайти и узнать новое задание, поучаствовать, поделиться». Half of that loop is made
 * of moments that must happen exactly once — the sealed card opening on the first look of the
 * day, «↑2» measured against the last visit, the confetti for a milestone or a won week — and
 * none of those moments is a fact the database should hold. They are about attention, not about
 * points, so they live in `localStorage`, namespaced by the signed-in email: two people sharing a
 * tablet get their own seals and their own baselines.
 *
 * ## The shape
 *
 *   - `opened` — task id → the local day it was first opened on. A task id is unique to its day,
 *     so «opened» is per task and per day at once. Entries older than two weeks are pruned on
 *     every write, so the key never grows past a couple of dozen lines.
 *   - `board` — the last seen `{rank, points, week}` per club mode (solo / duo). `boardDelta` in
 *     `standings.ts` compares it with what the table shows now; the week is stored so a Monday
 *     never reads as «↓14» against Sunday's final places.
 *   - `milestones` — streak milestones already celebrated (`clubMilestones.ts`).
 *   - `winnerWeeks` — `marathonId:week` of won weeks already celebrated (`ClubWinner`).
 *
 * ## Why the core is pure
 *
 * Every transition is a function from one memory to the next and is unit-tested in node; the
 * storage wrapper at the bottom is the only part that touches the browser, and it is wrapped in
 * try/catch on both sides because a Telegram WebView in a private session, or one that has run
 * out of quota, throws on `localStorage` — and a game layer must never take the task card down
 * with it. `updateClubMemory` re-reads before it writes, so two components on the same screen
 * (the card remembering an open, the streak remembering a milestone) cannot overwrite each
 * other's fields with a stale copy.
 */
import type { ClubMode } from './clubMode';
import type { BoardSeen } from './standings';

export interface ClubMemory {
  /** Task id → the local `YYYY-MM-DD` it was first opened on. */
  opened: Record<string, string>;
  /** The board as it was when this mode was last on screen. */
  board: Partial<Record<ClubMode, BoardSeen>>;
  /** Streak milestones (3, 7, 14, …) that already had their confetti. */
  milestones: number[];
  /** `marathonId:week` of won weeks that already had theirs. */
  winnerWeeks: string[];
}

/** How long an «opened» mark is kept: the seed and the coach's copies never look back further. */
const KEEP_OPENED_DAYS = 14;

export const EMPTY_CLUB_MEMORY: ClubMemory = Object.freeze({
  opened: {},
  board: {},
  milestones: [],
  winnerWeeks: [],
}) as ClubMemory;

/** The storage key: one per account, lower-cased so the same person never gets two. */
export function memoryKey(email: string): string {
  const who = email.trim().toLowerCase() || 'anonymous';
  return `forma.club.${who}`;
}

/**
 * Whatever was stored, coerced back into the shape above. Tolerant on purpose: a value written
 * by a future version, a hand-edited one, or `null` all come back as a valid memory, with the
 * fields that could be read and defaults for the rest.
 */
export function parseMemory(raw: string | null): ClubMemory {
  if (!raw) return { ...EMPTY_CLUB_MEMORY, opened: {}, board: {}, milestones: [], winnerWeeks: [] };
  let value: unknown;
  try {
    value = JSON.parse(raw);
  } catch {
    value = null;
  }
  const obj = value && typeof value === 'object' ? (value as Record<string, unknown>) : {};
  const opened: Record<string, string> = {};
  if (obj.opened && typeof obj.opened === 'object') {
    for (const [k, v] of Object.entries(obj.opened as Record<string, unknown>)) {
      if (typeof v === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(v)) opened[k] = v;
    }
  }
  const board: ClubMemory['board'] = {};
  if (obj.board && typeof obj.board === 'object') {
    for (const mode of ['solo', 'duo'] as const) {
      const seen = (obj.board as Record<string, unknown>)[mode];
      if (seen && typeof seen === 'object') {
        const s = seen as Record<string, unknown>;
        const rank = typeof s.rank === 'number' ? s.rank : null;
        if (typeof s.points === 'number' && typeof s.week === 'number') {
          board[mode] = { rank, points: s.points, week: s.week };
        }
      }
    }
  }
  const numbers = (x: unknown) =>
    Array.isArray(x) ? x.filter((n): n is number => typeof n === 'number') : [];
  const strings = (x: unknown) =>
    Array.isArray(x) ? x.filter((n): n is string => typeof n === 'string') : [];
  return {
    opened,
    board,
    milestones: numbers(obj.milestones),
    winnerWeeks: strings(obj.winnerWeeks),
  };
}

/** `YYYY-MM-DD` minus `days`, in UTC arithmetic — a lexicographic cut-off for the prune. */
function daysBefore(today: string, days: number): string {
  const [y, m, d] = today.split('-').map(Number) as [number, number, number];
  const dt = new Date(Date.UTC(y, m - 1, d));
  dt.setUTCDate(dt.getUTCDate() - days);
  return dt.toISOString().slice(0, 10);
}

/** The seal broken: remember the task as opened today, and forget opens older than two weeks. */
export function markOpened(m: ClubMemory, taskId: string, today: string): ClubMemory {
  const cutoff = daysBefore(today, KEEP_OPENED_DAYS);
  const opened: Record<string, string> = {};
  for (const [id, day] of Object.entries(m.opened)) if (day >= cutoff) opened[id] = day;
  opened[taskId] = today;
  return { ...m, opened };
}

export function isOpened(m: ClubMemory, taskId: string): boolean {
  return Object.prototype.hasOwnProperty.call(m.opened, taskId);
}

export function rememberBoard(m: ClubMemory, mode: ClubMode, seen: BoardSeen): ClubMemory {
  return { ...m, board: { ...m.board, [mode]: seen } };
}

export function lastBoard(m: ClubMemory, mode: ClubMode): BoardSeen | null {
  return m.board[mode] ?? null;
}

export function hasMilestone(m: ClubMemory, n: number): boolean {
  return m.milestones.includes(n);
}

export function rememberMilestone(m: ClubMemory, n: number): ClubMemory {
  return hasMilestone(m, n) ? m : { ...m, milestones: [...m.milestones, n].sort((a, b) => a - b) };
}

/** The key a won week is remembered under. */
export function winnerKey(marathonId: string, week: number): string {
  return `${marathonId}:${week}`;
}

export function hasWinner(m: ClubMemory, key: string): boolean {
  return m.winnerWeeks.includes(key);
}

export function rememberWinner(m: ClubMemory, key: string): ClubMemory {
  return hasWinner(m, key) ? m : { ...m, winnerWeeks: [...m.winnerWeeks, key] };
}

/* ---------------------------------------------------------------------------------------------
 * The browser side
 * ------------------------------------------------------------------------------------------- */

function storage(): Storage | null {
  try {
    return typeof localStorage === 'undefined' ? null : localStorage;
  } catch {
    // Accessing `localStorage` itself throws in some sandboxed WebViews.
    return null;
  }
}

export function readClubMemory(email: string): ClubMemory {
  try {
    return parseMemory(storage()?.getItem(memoryKey(email)) ?? null);
  } catch {
    return parseMemory(null);
  }
}

export function writeClubMemory(email: string, m: ClubMemory): void {
  try {
    storage()?.setItem(memoryKey(email), JSON.stringify(m));
  } catch {
    /* Out of quota or forbidden: the screen simply forgets, which it was designed to survive. */
  }
}

/**
 * Read, apply, write — against the stored value rather than a copy a component read a minute
 * ago, so concurrent writers on one screen keep each other's fields.
 */
export function updateClubMemory(email: string, fn: (m: ClubMemory) => ClubMemory): ClubMemory {
  const next = fn(readClubMemory(email));
  writeClubMemory(email, next);
  return next;
}
