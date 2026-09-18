/**
 * Athlete stats for `evaluateAchievements`, computed straight from the API so the summary screen
 * does not depend on another area's cache. Called before and after saving a session; the
 * difference in unlocked achievements is what the athlete just earned.
 */
import { findCourse } from '@/content/catalogue';
import { listBenchmarks } from '@/lib/api/benchmarks';
import { listCourseStates } from '@/lib/api/courseState';
import { listSessionsBetween } from '@/lib/api/sessions';
import { getMyTotals } from '@/lib/api/stats';
import { countTraining } from '@/lib/training/consistency';
import type { DayActivity, UserStats } from '@/lib/training/types';
import { addDays, toLocalDateIso } from '@/lib/util/dates';

/*
 * How far back the day-by-day history is read, for the two achievements that are about weeks
 * («Хорошая неделя», «Два месяца в деле»). Four months covers the eight weeks the longer one asks
 * for with room to spare; the plain workout count comes from `getMyTotals()` and is not windowed.
 */
const HISTORY_DAYS = 120;

export async function loadUserStats(today: string = toLocalDateIso()): Promise<UserStats> {
  const from = addDays(today, -HISTORY_DAYS);
  const [totals, benchmarks, sessions, states] = await Promise.all([
    getMyTotals(),
    listBenchmarks(),
    listSessionsBetween(from, today),
    listCourseStates(),
  ]);

  const days = new Map<string, DayActivity>();
  const day = (date: string): DayActivity => {
    let d = days.get(date);
    if (!d) {
      d = { date, workoutDone: false };
      days.set(date, d);
    }
    return d;
  };
  for (const s of sessions) if (s.completedAt) day(s.localDate).workoutDone = true;

  const training = countTraining([...days.values()], today);
  const coursesCompleted = states.filter((st) => {
    const course = findCourse(st.courseId);
    if (!course) return false;
    const done = new Set(st.completedNodeIds);
    return course.nodes
      .filter((n) => n.kind === 'workout' || n.kind === 'test' || n.kind === 'benchmark')
      .every((n) => done.has(n.id));
  }).length;

  return {
    workouts: totals.workouts,
    points: totals.points,
    bestWeek: training.bestWeek,
    activeWeeks: training.activeWeeks,
    benchmarksDone: benchmarks.reduce((n, s) => n + s.history.length, 0),
    coursesCompleted,
    totalMinutes: totals.minutes,
  };
}
