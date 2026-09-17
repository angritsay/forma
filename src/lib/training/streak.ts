/**
 * Streaks. Dates are local YYYY-MM-DD strings; "today" is passed in.
 * Rules: docs/TRAINING_SCIENCE.md §8.
 *
 * This file also held `stepsPoints()` — 30 points at a 7 000-step day, +5 per extra thousand. It
 * is gone with the step feature, and so is the second half of the streak rule: a day used to count
 * when a workout was finished **or** the step goal was reached. Only training keeps a streak now.
 */
import { addDays, daysBetween } from '@/lib/util/dates';
import type { DayActivity, StreakInfo } from './types';

/** A day is active when a workout was completed. */
export function isActiveDay(day: DayActivity): boolean {
  return day.workoutDone === true;
}

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

/**
 * Current and longest streaks. Input may be unsorted, sparse and contain duplicates
 * (duplicates are merged with OR). Today does not break the streak until it ends: when nothing
 * is logged today the streak is counted from yesterday and flagged `atRisk`.
 */
export function computeStreak(days: readonly DayActivity[], todayIso: string): StreakInfo {
  const active = new Set<string>();
  for (const d of days) {
    if (!DATE_RE.test(d.date) || d.date > todayIso) continue;
    if (isActiveDay(d)) active.add(d.date);
  }

  const todayDone = active.has(todayIso);
  let current = 0;
  let cursor = todayDone ? todayIso : addDays(todayIso, -1);
  while (active.has(cursor)) {
    current++;
    cursor = addDays(cursor, -1);
  }

  const sorted = [...active].sort();
  let longest = 0;
  let run = 0;
  let prev: string | undefined;
  for (const date of sorted) {
    run = prev !== undefined && daysBetween(prev, date) === 1 ? run + 1 : 1;
    if (run > longest) longest = run;
    prev = date;
  }
  longest = Math.max(longest, current);

  const lastActiveDate = sorted.length ? sorted[sorted.length - 1] : undefined;
  return {
    current,
    longest,
    todayDone,
    atRisk: !todayDone && current > 0,
    ...(lastActiveDate !== undefined ? { lastActiveDate } : {}),
  };
}
