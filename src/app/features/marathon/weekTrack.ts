/**
 * The week as seven tiles under the club's HUD (`WeekTrack.tsx`): Monday to Sunday of the week
 * `today` falls in, each tile in one of five states.
 *
 * Owner, on the shipped week screen: «много текстов, нет элемента игры». The header it replaces
 * said «День 7 · неделя 1 из 522» — a sentence about a count nobody acts on. Seven tiles say
 * where the week stands without a word: filled for a day the task went in, hollow for today,
 * dimmed for a day that went by without one, a hairline for what is still ahead.
 *
 * Pure, so the states are decided in node. Dates are compared as the same `YYYY-MM-DD` strings
 * `my_club_days()` returns, stepped from `today` at local noon so a DST change cannot skip a day
 * (the same arithmetic as the streak's own week in `ClubStreak`).
 */

export type TrackState = 'done' | 'today' | 'today-done' | 'missed' | 'future';

export interface TrackTile {
  /** The tile's date, `YYYY-MM-DD`. */
  iso: string;
  /** 0 = the first day of the week (Monday by default) … 6. */
  index: number;
  /** The two-letter weekday under the tile, from `labels`. */
  label: string;
  state: TrackState;
}

export interface WeekTrackInput {
  /** Days with a proof in, `YYYY-MM-DD`, any order. Null while they load: every tile is `future`
   *  except today, which is at least `today`. */
  days: readonly string[] | null;
  today: string;
  weekStart?: 'monday' | 'sunday';
  /** Seven labels from the first day of the week. Defaults to the Russian two-letter set. */
  labels?: readonly string[];
}

export const WEEKDAY_LABELS_RU = ['пн', 'вт', 'ср', 'чт', 'пт', 'сб', 'вс'] as const;

/** `YYYY-MM-DD` at local noon. */
function noonOf(iso: string): Date {
  const [y, m, d] = iso.split('-').map(Number) as [number, number, number];
  return new Date(y, m - 1, d, 12);
}

function isoOf(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function weekTrack({
  days,
  today,
  weekStart = 'monday',
  labels = WEEKDAY_LABELS_RU,
}: WeekTrackInput): TrackTile[] {
  const done = new Set(days ?? []);
  const now = noonOf(today);
  // `getDay()` is 0 = Sunday; the track starts on Monday unless told otherwise.
  const dow = now.getDay();
  const back = weekStart === 'monday' ? (dow + 6) % 7 : dow;
  const out: TrackTile[] = [];
  for (let i = 0; i < 7; i += 1) {
    const date = new Date(now.getFullYear(), now.getMonth(), now.getDate() - back + i, 12);
    const iso = isoOf(date);
    const isDone = done.has(iso);
    const state: TrackState =
      iso === today
        ? isDone
          ? 'today-done'
          : 'today'
        : iso < today
          ? isDone
            ? 'done'
            : 'missed'
          : 'future';
    out.push({ iso, index: i, label: labels[i] ?? '', state });
  }
  return out;
}
