/**
 * Pure aggregations over sessions and daily logs for the home screen: streak input, ISO-week
 * stats, the 7-day steps series and all-time points. Dates are local YYYY-MM-DD strings.
 */
import type { DailyLogRow, WorkoutSessionRow } from '@/lib/api/types';
import type { DayActivity } from '@/lib/training/types';
import { addDays, weekStart } from '@/lib/util/dates';

export interface WeekStats {
  /** Monday of the ISO week (inclusive). */
  from: string;
  /** Today (inclusive). */
  to: string;
  workouts: number;
  minutes: number;
  calories: number;
  /** Workout points + steps points. */
  points: number;
  workoutPoints: number;
  stepsPoints: number;
  steps: number;
}

export interface StepsDay {
  date: string;
  steps: number;
  today: boolean;
  /** After today: nothing can be logged yet. */
  future: boolean;
}

export type DailyLogMap = Readonly<Record<string, DailyLogRow>>;

export function isCompletedSession(s: WorkoutSessionRow): boolean {
  return s.completedAt !== null;
}

/** Merge completed sessions and step logs into the engine's per-day activity list. */
export function buildDayActivity(
  sessions: readonly WorkoutSessionRow[],
  logs: DailyLogMap,
): DayActivity[] {
  const byDate = new Map<string, DayActivity>();
  for (const s of sessions) {
    if (!isCompletedSession(s)) continue;
    const day = byDate.get(s.localDate) ?? { date: s.localDate, workoutDone: false, steps: 0 };
    day.workoutDone = true;
    byDate.set(s.localDate, day);
  }
  for (const log of Object.values(logs)) {
    const day = byDate.get(log.localDate) ?? {
      date: log.localDate,
      workoutDone: false,
      steps: 0,
    };
    day.steps = Math.max(day.steps, log.steps);
    byDate.set(log.localDate, day);
  }
  return [...byDate.values()].sort((a, b) => a.date.localeCompare(b.date));
}

/** Totals for the current ISO week (Monday → today). */
export function weekStats(
  sessions: readonly WorkoutSessionRow[],
  logs: DailyLogMap,
  todayIso: string,
): WeekStats {
  const from = weekStart(todayIso);
  const to = todayIso;
  const inWeek = (date: string) => date >= from && date <= to;
  let workouts = 0;
  let seconds = 0;
  let calories = 0;
  let workoutPoints = 0;
  for (const s of sessions) {
    if (!isCompletedSession(s) || !inWeek(s.localDate)) continue;
    workouts += 1;
    seconds += s.durationSec ?? 0;
    calories += s.calories ?? 0;
    workoutPoints += s.points;
  }
  let steps = 0;
  let stepsPoints = 0;
  for (const log of Object.values(logs)) {
    if (!inWeek(log.localDate)) continue;
    steps += log.steps;
    stepsPoints += log.points;
  }
  return {
    from,
    to,
    workouts,
    minutes: Math.round(seconds / 60),
    calories,
    points: workoutPoints + stepsPoints,
    workoutPoints,
    stepsPoints,
    steps,
  };
}

/** Monday → Sunday of the current ISO week with the logged steps (0 when nothing logged). */
export function stepsWeek(logs: DailyLogMap, todayIso: string): StepsDay[] {
  const from = weekStart(todayIso);
  const out: StepsDay[] = [];
  for (let i = 0; i < 7; i++) {
    const date = addDays(from, i);
    out.push({
      date,
      steps: logs[date]?.steps ?? 0,
      today: date === todayIso,
      future: date > todayIso,
    });
  }
  return out;
}

/** Points from the loaded sessions and logs (fallback when the totals RPC is unavailable). */
export function totalPoints(
  sessions: readonly WorkoutSessionRow[],
  logs: DailyLogMap,
): number {
  let total = 0;
  for (const s of sessions) if (isCompletedSession(s)) total += s.points;
  for (const log of Object.values(logs)) total += log.points;
  return total;
}
