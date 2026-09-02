/**
 * Streaks and step points. Dates are local YYYY-MM-DD strings; "today" is passed in.
 * Rules: docs/TRAINING_SCIENCE.md §8.
 */
import { addDays, daysBetween } from '@/lib/util/dates';
import {
  STEPS_GOAL,
  STEPS_POINTS_AT_GOAL,
  STEPS_POINTS_MAX,
  STEPS_POINTS_PER_EXTRA_1000,
} from './constants';
import type { DayActivity, StreakInfo } from './types';
import { num } from './util';

/** A day is active when a workout was completed or the steps goal was reached. */
export function isActiveDay(day: DayActivity): boolean {
  return day.workoutDone === true || num(day.steps) >= num(day.stepsGoal, STEPS_GOAL);
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

/** 0 below the goal, 30 at the goal, +5 per full extra 1 000 steps, capped at 60. */
export function stepsPoints(steps: number, goal: number = STEPS_GOAL): number {
  const s = Math.max(0, num(steps));
  const g = num(goal, STEPS_GOAL) > 0 ? num(goal, STEPS_GOAL) : STEPS_GOAL;
  if (s < g) return 0;
  const extra = Math.floor((s - g) / 1000);
  return Math.min(STEPS_POINTS_MAX, STEPS_POINTS_AT_GOAL + extra * STEPS_POINTS_PER_EXTRA_1000);
}
