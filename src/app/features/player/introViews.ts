/**
 * How many times this person has seen each exercise's explanation — the server's count, with a
 * copy on the device.
 *
 * The count lives on the server (`exercise_intro_views`, 0048) so a person who met a movement on
 * their phone is not given the full explanation again on their laptop. The copy here, under
 * `forma.introViews`, is for the two moments the server cannot be waited on:
 *
 * - **Starting a workout.** The tier each exercise opens with is decided as the session starts
 *   (`withIntros` below, `introTiersFor` in the engine) and a slow network must never hold the
 *   start button — so the server gets {@link INTRO_VIEWS_WAIT_MS} and after that the copy answers.
 * - **Counting a view.** Leaving an explanation bumps the copy at once and tells the server in the
 *   background; a view counted offline is not lost to this device even if the call fails.
 *
 * The two are merged by the larger count per exercise. A count only ever goes up, so the larger
 * one is the more recent — the server's after a view on another device, this device's after a
 * view the server did not hear about.
 *
 * Every storage access is wrapped: private mode or a full quota leaves a device without a copy,
 * which only means the server is the whole answer.
 */
import { listMyIntroViews, markIntroSeen } from '@/lib/api/introViews';
import { introTiersFor } from '@/lib/training/intro';
import type { PrescribedWorkout } from '@/lib/training/types';

export const INTRO_VIEWS_KEY = 'forma.introViews';

/** How long a start waits for the server's counts before the device's copy decides. */
export const INTRO_VIEWS_WAIT_MS = 1500;

type Views = Record<string, number>;

function clean(value: unknown): Views {
  const out: Views = {};
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return out;
  for (const [id, n] of Object.entries(value as Record<string, unknown>)) {
    if (typeof n === 'number' && Number.isFinite(n) && n > 0) out[id] = Math.floor(n);
  }
  return out;
}

/** The device's copy; empty when there is none or it cannot be read. */
export function readIntroViewsMirror(): Views {
  try {
    if (typeof localStorage === 'undefined') return {};
    const raw = localStorage.getItem(INTRO_VIEWS_KEY);
    return raw ? clean(JSON.parse(raw)) : {};
  } catch {
    return {};
  }
}

function writeMirror(views: Views): void {
  try {
    if (typeof localStorage === 'undefined') return;
    localStorage.setItem(INTRO_VIEWS_KEY, JSON.stringify(views));
  } catch {
    /* Private mode or a full quota: the server still has the count. */
  }
}

/** The larger of the two counts for every exercise either side knows. */
export function mergeIntroViews(a: Views, b: Views): Views {
  const out: Views = { ...a };
  for (const [id, n] of Object.entries(b)) out[id] = Math.max(out[id] ?? 0, n);
  return out;
}

/**
 * The server's counts merged into the device's copy, and the copy updated to match. On any
 * failure of the server — offline, signed out, a demo without the table — the copy alone.
 */
export async function loadIntroViews(): Promise<Views> {
  const mirror = readIntroViewsMirror();
  try {
    const server = clean(await listMyIntroViews());
    const merged = mergeIntroViews(mirror, server);
    writeMirror(merged);
    return merged;
  } catch {
    return mirror;
  }
}

/** One more view of this exercise's explanation: counted here now, on the server when it can. */
export function bumpIntroViews(exerciseId: string): void {
  const mirror = readIntroViewsMirror();
  writeMirror({ ...mirror, [exerciseId]: (mirror[exerciseId] ?? 0) + 1 });
  void markIntroSeen(exerciseId).catch(() => undefined);
}

/**
 * The prescription with the explanations it opens with written onto it (`intros`), for a start
 * site to pass to both `startSession` and `begin` — so the stored session carries the same map
 * the player builds its steps from.
 *
 * Bounded: the server is given {@link INTRO_VIEWS_WAIT_MS} and then the device's copy answers.
 * Never rejects; a failure of any kind starts the workout with whatever is known.
 */
export async function withIntros(
  prescribed: PrescribedWorkout,
  waitMs: number = INTRO_VIEWS_WAIT_MS,
): Promise<PrescribedWorkout> {
  let views: Views;
  try {
    let timer: ReturnType<typeof setTimeout> | undefined;
    const timeout = new Promise<Views>((resolve) => {
      timer = setTimeout(() => resolve(readIntroViewsMirror()), waitMs);
    });
    views = await Promise.race([loadIntroViews(), timeout]);
    clearTimeout(timer);
  } catch {
    views = readIntroViewsMirror();
  }
  try {
    return { ...prescribed, intros: introTiersFor(prescribed, views) };
  } catch {
    return prescribed;
  }
}
