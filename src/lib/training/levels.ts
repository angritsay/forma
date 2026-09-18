/**
 * Athlete levels (cumulative points) and achievements.
 * Rules: docs/TRAINING_SCIENCE.md §9.
 */
import { LEVEL_THRESHOLDS } from './constants';
import { ACHIEVEMENT_COPY, LEVEL_TITLES, type AchievementId } from './messages';
import type { Achievement, AchievementStatus, LevelInfo, UserStats } from './types';
import { clamp, num } from './util';

export function levelForPoints(points: number): LevelInfo {
  const pts = Math.max(0, num(points));
  let idx = 0;
  for (let i = 0; i < LEVEL_THRESHOLDS.length; i++) {
    if (pts >= (LEVEL_THRESHOLDS[i] ?? Number.POSITIVE_INFINITY)) idx = i;
  }
  const minPoints = LEVEL_THRESHOLDS[idx] ?? 0;
  const next = LEVEL_THRESHOLDS[idx + 1];
  const nextAt = next === undefined ? null : next;
  const progress = nextAt === null ? 1 : clamp((pts - minPoints) / (nextAt - minPoints), 0, 1);
  const title = LEVEL_TITLES[idx] ?? LEVEL_TITLES[LEVEL_TITLES.length - 1]!;
  return { level: idx + 1, title, minPoints, nextAt, progress };
}

function ratio(value: number, goal: number): number {
  return clamp(num(value) / goal, 0, 1);
}

function define(
  id: AchievementId,
  icon: string,
  unlocked: (s: UserStats) => boolean,
  progress: (s: UserStats) => number,
): Achievement {
  const copy = ACHIEVEMENT_COPY[id];
  return { id, title: copy.title, description: copy.description, icon, unlocked, progress };
}

export const ACHIEVEMENTS: readonly Achievement[] = [
  define(
    'first_workout',
    '🏁',
    (s) => num(s.workouts) >= 1,
    (s) => ratio(s.workouts, 1),
  ),
  define(
    'workouts_5',
    '🔥',
    (s) => num(s.workouts) >= 5,
    (s) => ratio(s.workouts, 5),
  ),
  define(
    'workouts_25',
    '💪',
    (s) => num(s.workouts) >= 25,
    (s) => ratio(s.workouts, 25),
  ),
  define(
    'workouts_100',
    '💯',
    (s) => num(s.workouts) >= 100,
    (s) => ratio(s.workouts, 100),
  ),
  /*
   * These three replaced `streak_3`, `streak_7` and `streak_30`, which asked for three, seven and
   * thirty consecutive days. Sergey's course trains five days a week, so the seven-day one was
   * unreachable by anybody following it and the thirty-day one was unreachable by anybody at all.
   *
   * What is asked for instead is the same virtue without the calendar arithmetic: one more step on
   * the count, one week where you got three in, and a habit that has outlived two months. None of
   * them can be taken away by a rest day, and none of them resets.
   */
  define(
    'workouts_10',
    '⚡',
    (s) => num(s.workouts) >= 10,
    (s) => ratio(s.workouts, 10),
  ),
  define(
    'week_three',
    '📅',
    (s) => num(s.bestWeek) >= 3,
    (s) => ratio(s.bestWeek, 3),
  ),
  define(
    'weeks_8',
    '🗓️',
    (s) => num(s.activeWeeks) >= 8,
    (s) => ratio(s.activeWeeks, 8),
  ),
  // `steps_10_days` («Десять дней по 7 000 шагов», 🚶) stood here. It went with the step feature:
  // an achievement for a figure nothing can measure any more. Twelve remain.
  define(
    'first_benchmark',
    '📏',
    (s) => num(s.benchmarksDone) >= 1,
    (s) => ratio(s.benchmarksDone, 1),
  ),
  define(
    'course_completed',
    '🎓',
    (s) => num(s.coursesCompleted) >= 1,
    (s) => ratio(s.coursesCompleted, 1),
  ),
  define(
    'points_1000',
    '🥉',
    (s) => num(s.points) >= 1000,
    (s) => ratio(s.points, 1000),
  ),
  define(
    'points_10000',
    '🥇',
    (s) => num(s.points) >= 10000,
    (s) => ratio(s.points, 10000),
  ),
  define(
    'minutes_600',
    '⏱️',
    (s) => num(s.totalMinutes) >= 600,
    (s) => ratio(s.totalMinutes, 600),
  ),
];

/** Evaluate every achievement against the stats (serializable, in catalogue order). */
export function evaluateAchievements(stats: UserStats): AchievementStatus[] {
  return ACHIEVEMENTS.map((a) => {
    const unlocked = a.unlocked(stats);
    const progress = unlocked ? 1 : clamp(a.progress ? a.progress(stats) : 0, 0, 1);
    return {
      id: a.id,
      title: a.title,
      description: a.description,
      icon: a.icon,
      unlocked,
      progress,
    };
  });
}
