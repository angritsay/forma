/**
 * Dates ↔ club days, for the admin.
 *
 * The table stores a task and a proof by `day_index` — day 1 is `starts_on` — and that is how the
 * code thinks. The owner does not: she thinks «вчера», «в пятницу», «до 30-го». These helpers turn
 * one into the other so every picker in the admin can offer a date and store a day.
 */
import { addDays } from '@/lib/util/dates';
import { weekOf } from '@/lib/marathon/score';

/** The date a club day falls on. Day 1 is `startsOn`. */
export function dateOfDay(startsOn: string, dayIndex: number): string {
  return addDays(startsOn, dayIndex - 1);
}

/** Which club day a date is, or 0 when it is outside the run. */
export function dayOfDate(startsOn: string, days: number, iso: string): number {
  const ms = Date.parse(`${iso}T00:00:00Z`) - Date.parse(`${startsOn}T00:00:00Z`);
  if (!Number.isFinite(ms)) return 0;
  const n = Math.round(ms / 86_400_000) + 1;
  return n >= 1 && n <= days ? n : 0;
}

/**
 * The days offered as chips in the proofs filter: today and the thirteen before it, newest first,
 * never before day 1 and never past the last day. Empty before the club has started.
 */
export function recentDays(today: number, days: number, count = 14): number[] {
  const last = Math.min(today, days);
  const out: number[] = [];
  for (let d = last; d >= 1 && out.length < count; d -= 1) out.push(d);
  return out;
}

/**
 * «Повторять до» as a date → the last day to copy the task to, or null when it would not repeat.
 *
 * A date on or before the task's own day is no repeat at all; a date past the end of the round is
 * the last day (the round is where the repeat stops, not an error to show).
 */
export function repeatUntilDay(
  startsOn: string,
  lastDay: number,
  fromDay: number,
  iso: string,
): number | null {
  if (!iso) return null;
  const ms = Date.parse(`${iso}T00:00:00Z`) - Date.parse(`${startsOn}T00:00:00Z`);
  if (!Number.isFinite(ms)) return null;
  const n = Math.min(Math.round(ms / 86_400_000) + 1, lastDay);
  return n > fromDay ? n : null;
}

/** The week the board opens on: the one running today, or the last one once the round is over. */
export function boardWeek(today: number, days: number): number {
  const lastWeek = Math.max(weekOf(days), 1);
  return Math.min(Math.max(weekOf(today), 1), lastWeek);
}

/** Every week of the round there is a board for so far, newest first. */
export function boardWeeks(today: number, days: number): number[] {
  const current = boardWeek(today, days);
  return Array.from({ length: current }, (_, i) => current - i);
}

/**
 * What pressing a row on the board does: announce that entry, or — pressed on the entry already
 * announced — withdraw the announcement.
 */
export function nextWinner(current: string | null | undefined, pressed: string): string | null {
  return current === pressed ? null : pressed;
}
