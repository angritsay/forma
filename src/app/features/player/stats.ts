/**
 * Athlete stats for `evaluateAchievements`, computed straight from the API so the summary screen
 * does not depend on another area's cache. Called before and after saving a session; the
 * difference in unlocked achievements is what the athlete just earned.
 */
import { COURSE_BY_ID } from '@/content/registry';
import { listBenchmarks } from '@/lib/api/benchmarks';
import { listCourseStates } from '@/lib/api/courseState';
import { listDailyLogs } from '@/lib/api/dailyLogs';
import { listSessionsBetween } from '@/lib/api/sessions';
import { getMyTotals } from '@/lib/api/stats';
import { STEPS_GOAL } from '@/lib/training/constants';
import { computeStreak } from '@/lib/training/streak';
import type { DayActivity, UserStats } from '@/lib/training/types';
import { addDays, toLocalDateIso } from '@/lib/util/dates';

/** Streak / steps history window (days). Longer streaks are already reflected in `longest`. */
const HISTORY_DAYS = 120;

export async function loadUserStats(today: string = toLocalDateIso()): Promise<UserStats> {
  const from = addDays(today, -HISTORY_DAYS);
  const [totals, benchmarks, sessions, logs, states] = await Promise.all([
    getMyTotals(),
    listBenchmarks(),
    listSessionsBetween(from, today),
    listDailyLogs(from, today),
    listCourseStates(),
  ]);

  const days = new Map<string, DayActivity>();
  const day = (date: string): DayActivity => {
    let d = days.get(date);
    if (!d) {
      d = { date, workoutDone: false, steps: 0 };
      days.set(date, d);
    }
    return d;
  };
  for (const s of sessions) if (s.completedAt) day(s.localDate).workoutDone = true;
  for (const l of logs) day(l.localDate).steps = Math.max(day(l.localDate).steps, l.steps);

  const streak = computeStreak([...days.values()], today);
  const coursesCompleted = states.filter((st) => {
    const course = COURSE_BY_ID.get(st.courseId);
    if (!course) return false;
    const done = new Set(st.completedNodeIds);
    return course.nodes
      .filter((n) => n.kind === 'workout' || n.kind === 'test' || n.kind === 'benchmark')
      .every((n) => done.has(n.id));
  }).length;

  return {
    workouts: totals.workouts,
    points: totals.points,
    streakCurrent: streak.current,
    streakLongest: streak.longest,
    stepsDaysAtGoal: logs.filter((l) => l.steps >= STEPS_GOAL).length,
    benchmarksDone: benchmarks.reduce((n, s) => n + s.history.length, 0),
    coursesCompleted,
    totalMinutes: totals.minutes,
  };
}
