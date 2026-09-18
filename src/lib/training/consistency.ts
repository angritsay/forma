/**
 * How much training has actually happened — counted, not chained.
 *
 * **This file replaces the streak, and the reason is the plan.** A streak counts consecutive
 * calendar days and breaks on the first gap. Sergey's course is twenty workouts over four weeks,
 * five days on and two off, and every real week has at least one more day where nothing is
 * scheduled. So the honest streak for someone following the plan exactly is *two*, and the number
 * on their home screen resets every weekend for doing precisely what they were told. The owner put
 * it plainly: «человеку не надо каждый день так заниматься, поэтому давай просто добавим
 * что-нибудь типа счетчик тренировок».
 *
 * What is here instead measures the same thing a streak was trying to — did you keep coming back —
 * without demanding that the answer be "every single day":
 *
 *   • `total` is the count. It only ever goes up. A week off costs nothing.
 *   • `thisWeek` is how many since Monday, which is the figure a three-a-week plan is actually read
 *     against.
 *   • `bestWeek` and `activeWeeks` are what the achievements hang on: one good week, and a habit
 *     that has lasted, neither of which a rest day can take away.
 *
 * Dates are local YYYY-MM-DD strings and "today" is passed in; nothing here reads the clock.
 */
import { weekStart } from '@/lib/util/dates';
import type { DayActivity, TrainingCount } from './types';

/** A day counts when a workout was finished on it. */
export function isActiveDay(day: DayActivity): boolean {
  return day.workoutDone === true;
}

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

/**
 * Count the training.
 *
 * Input may be unsorted, sparse and contain duplicates — a date appearing twice is one day, the
 * same rule the streak used, because the unit is "a day you trained" and not "a session row".
 * Future dates are ignored, so a clock skewed forward cannot invent a workout.
 *
 * `total` is therefore days trained rather than sessions completed. Two workouts in one evening is
 * one day here, and is two on the reports tab, which counts sessions. That is not a disagreement to
 * fix: this figure is about how often you show up.
 */
export function countTraining(days: readonly DayActivity[], todayIso: string): TrainingCount {
  const active = new Set<string>();
  for (const d of days) {
    if (!DATE_RE.test(d.date) || d.date > todayIso) continue;
    if (isActiveDay(d)) active.add(d.date);
  }

  const monday = weekStart(todayIso);
  let thisWeek = 0;
  /** Monday of each week that has at least one day in it → how many days that week holds. */
  const byWeek = new Map<string, number>();
  for (const date of active) {
    if (date >= monday) thisWeek++;
    const start = weekStart(date);
    byWeek.set(start, (byWeek.get(start) ?? 0) + 1);
  }

  let bestWeek = 0;
  for (const n of byWeek.values()) if (n > bestWeek) bestWeek = n;

  const sorted = [...active].sort();
  const lastActiveDate = sorted.length ? sorted[sorted.length - 1] : undefined;

  return {
    total: active.size,
    thisWeek,
    bestWeek,
    activeWeeks: byWeek.size,
    todayDone: active.has(todayIso),
    ...(lastActiveDate !== undefined ? { lastActiveDate } : {}),
  };
}
