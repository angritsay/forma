/**
 * Pure helpers for the Steps screen: input parsing, quick-add, the 14-day history rows and the
 * streak feedback shown after a save. Dates are local YYYY-MM-DD strings; "today" is passed in.
 */
import { MAX_STEPS } from '@/lib/api/dailyLogs';
import { STEPS_GOAL } from '@/lib/training/constants';
import type { StreakInfo } from '@/lib/training/types';
import { addDays } from '@/lib/util/dates';
import type { DailyLogMap } from '@/app/features/home/stats';

export const QUICK_ADD_STEPS: readonly number[] = [1000, 2500, 5000];
export const STEPS_HISTORY_DAYS = 14;
export { MAX_STEPS };

export function clampSteps(n: number): number {
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.min(MAX_STEPS, Math.floor(n)));
}

/**
 * Digits typed into the steps field → integer steps. Spaces and thousands separators are
 * ignored; an empty field is `null`; anything else non-numeric is `null` too.
 */
export function parseSteps(text: string): number | null {
  const clean = text.replace(/[\s.,]/g, '');
  if (clean === '') return null;
  if (!/^\d+$/.test(clean)) return null;
  return clampSteps(Number(clean));
}

export function addSteps(current: number, delta: number): number {
  return clampSteps(current + delta);
}

export interface HistoryDay {
  date: string;
  steps: number;
  points: number;
  logged: boolean;
}

/** The `days` days before today, newest first (today has its own editor). */
export function historyDays(
  logs: DailyLogMap,
  todayIso: string,
  days = STEPS_HISTORY_DAYS,
): HistoryDay[] {
  const out: HistoryDay[] = [];
  for (let i = 1; i <= days; i++) {
    const date = addDays(todayIso, -i);
    const log = logs[date];
    out.push({ date, steps: log?.steps ?? 0, points: log?.points ?? 0, logged: log !== undefined });
  }
  return out;
}

export type StreakFeedback = 'kept' | 'started' | 'below_goal' | 'updated';

/**
 * What to tell the athlete after saving today's steps: the streak was kept (or started) when
 * today just became an active day; below the goal the day does not count yet.
 */
export function streakFeedback(before: StreakInfo, after: StreakInfo): StreakFeedback {
  if (after.todayDone && !before.todayDone) return before.current > 0 ? 'kept' : 'started';
  if (!after.todayDone) return 'below_goal';
  return 'updated';
}

/** Steps still missing to reach the goal (0 at or above it). */
export function stepsToGoal(steps: number, goal = STEPS_GOAL): number {
  return Math.max(0, goal - steps);
}
