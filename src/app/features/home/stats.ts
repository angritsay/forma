/**
 * Pure aggregations over workout sessions for the home screen: day activity and all-time points.
 * Dates are local YYYY-MM-DD strings.
 *
 * This module used to take a second argument everywhere — the map of `daily_logs`, one row per day
 * with the steps typed in for it. Steps are gone (a Mini App cannot read a phone's step counter),
 * and with them the `stepsWeek()` series, the step half of every total and the `DailyLogMap` type
 * that half a dozen callers passed around. Sessions are the only input now.
 */
import type { WorkoutSessionRow } from '@/lib/api/types';
import type { DayActivity } from '@/lib/training/types';

export function isCompletedSession(s: WorkoutSessionRow): boolean {
  return s.completedAt !== null;
}

/** Completed sessions as the engine's per-day activity list. */
export function buildDayActivity(sessions: readonly WorkoutSessionRow[]): DayActivity[] {
  const byDate = new Map<string, DayActivity>();
  for (const s of sessions) {
    if (!isCompletedSession(s)) continue;
    byDate.set(s.localDate, { date: s.localDate, workoutDone: true });
  }
  return [...byDate.values()].sort((a, b) => a.date.localeCompare(b.date));
}

/** Points from the loaded sessions (fallback when the totals RPC is unavailable). */
export function totalPoints(sessions: readonly WorkoutSessionRow[]): number {
  let total = 0;
  for (const s of sessions) if (isCompletedSession(s)) total += s.points;
  return total;
}
