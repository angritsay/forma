/**
 * Pure aggregations for the Stats screen: this week's load per day, points per week, the streak
 * calendar, the steps history, personal records and the `UserStats` the achievement engine
 * expects. Everything reads the progress store's rows; dates are local YYYY-MM-DD strings and
 * "today" is passed in so the module stays testable in node.
 */
import { COURSE_BY_ID, COURSES, EXERCISE_BY_ID } from '@/content/registry';
import type { Locale } from '@/content/schema';
import type {
  BenchmarkSeries,
  CourseStateRow,
  MyTotals,
  WorkoutSessionRow,
} from '@/lib/api/types';
import { STEPS_GOAL } from '@/lib/training/constants';
import { computeStreak } from '@/lib/training/streak';
import type { UserStats } from '@/lib/training/types';
import { addDays, daysBetween, weekStart } from '@/lib/util/dates';
import {
  buildDayActivity,
  isCompletedSession,
  totalPoints,
  type DailyLogMap,
} from '@/app/features/home/stats';

export const POINTS_WEEKS = 8;
export const CALENDAR_WEEKS = 5;
export const STEPS_HISTORY_DAYS = 14;

/* ---------------------------------------------------------------------------------------------
 * This week
 * ------------------------------------------------------------------------------------------- */

export interface DayLoad {
  date: string;
  workouts: number;
  minutes: number;
  today: boolean;
  future: boolean;
}

/** Monday → Sunday of the current ISO week: completed workouts and training minutes per day. */
export function weekLoad(sessions: readonly WorkoutSessionRow[], todayIso: string): DayLoad[] {
  const from = weekStart(todayIso);
  const seconds = new Map<string, number>();
  const workouts = new Map<string, number>();
  for (const s of sessions) {
    if (!isCompletedSession(s)) continue;
    seconds.set(s.localDate, (seconds.get(s.localDate) ?? 0) + (s.durationSec ?? 0));
    workouts.set(s.localDate, (workouts.get(s.localDate) ?? 0) + 1);
  }
  const days: DayLoad[] = [];
  for (let i = 0; i < 7; i++) {
    const date = addDays(from, i);
    days.push({
      date,
      workouts: workouts.get(date) ?? 0,
      minutes: Math.round((seconds.get(date) ?? 0) / 60),
      today: date === todayIso,
      future: date > todayIso,
    });
  }
  return days;
}

/* ---------------------------------------------------------------------------------------------
 * Points per week
 * ------------------------------------------------------------------------------------------- */

export interface WeekPoints {
  /** Monday of the week. */
  from: string;
  /** Sunday of the week. */
  to: string;
  /** Workout points + steps points. */
  points: number;
  current: boolean;
}

/** The last `weeks` ISO weeks (oldest first, current week last) with the points earned in each. */
export function pointsByWeek(
  sessions: readonly WorkoutSessionRow[],
  logs: DailyLogMap,
  todayIso: string,
  weeks = POINTS_WEEKS,
): WeekPoints[] {
  const currentFrom = weekStart(todayIso);
  const out: WeekPoints[] = [];
  for (let i = weeks - 1; i >= 0; i--) {
    const from = addDays(currentFrom, -7 * i);
    out.push({ from, to: addDays(from, 6), points: 0, current: i === 0 });
  }
  const first = out[0]?.from ?? currentFrom;
  const bucket = (date: string): WeekPoints | undefined => {
    if (date < first || date > todayIso) return undefined;
    return out[Math.floor(daysBetween(first, date) / 7)];
  };
  for (const s of sessions) {
    if (!isCompletedSession(s)) continue;
    const week = bucket(s.localDate);
    if (week) week.points += s.points;
  }
  for (const log of Object.values(logs)) {
    const week = bucket(log.localDate);
    if (week) week.points += log.points;
  }
  return out;
}

/* ---------------------------------------------------------------------------------------------
 * Streak calendar
 * ------------------------------------------------------------------------------------------- */

export type CalendarKind = 'workout' | 'steps' | 'empty' | 'future';

export interface CalendarCell {
  date: string;
  kind: CalendarKind;
  today: boolean;
  steps: number;
}

export interface CalendarWeek {
  from: string;
  cells: CalendarCell[];
}

/**
 * The last `weeks` ISO weeks as rows of seven cells (oldest week first). A day is a workout day
 * when a session was completed, a steps day when the goal was reached, otherwise empty.
 */
export function streakCalendar(
  sessions: readonly WorkoutSessionRow[],
  logs: DailyLogMap,
  todayIso: string,
  weeks = CALENDAR_WEEKS,
  stepsGoal = STEPS_GOAL,
): CalendarWeek[] {
  const activity = new Map(buildDayActivity(sessions, logs).map((d) => [d.date, d]));
  const currentFrom = weekStart(todayIso);
  const out: CalendarWeek[] = [];
  for (let w = weeks - 1; w >= 0; w--) {
    const from = addDays(currentFrom, -7 * w);
    const cells: CalendarCell[] = [];
    for (let i = 0; i < 7; i++) {
      const date = addDays(from, i);
      const day = activity.get(date);
      let kind: CalendarKind = 'empty';
      if (date > todayIso) kind = 'future';
      else if (day?.workoutDone) kind = 'workout';
      else if (day && day.steps >= stepsGoal) kind = 'steps';
      cells.push({ date, kind, today: date === todayIso, steps: day?.steps ?? 0 });
    }
    out.push({ from, cells });
  }
  return out;
}

/* ---------------------------------------------------------------------------------------------
 * Steps history
 * ------------------------------------------------------------------------------------------- */

export interface StepsPoint {
  date: string;
  steps: number;
  today: boolean;
}

/** The last `days` days (oldest first, today last) with the logged steps, 0 when nothing logged. */
export function stepsHistory(
  logs: DailyLogMap,
  todayIso: string,
  days = STEPS_HISTORY_DAYS,
): StepsPoint[] {
  const out: StepsPoint[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const date = addDays(todayIso, -i);
    out.push({ date, steps: logs[date]?.steps ?? 0, today: date === todayIso });
  }
  return out;
}

/* ---------------------------------------------------------------------------------------------
 * Personal records
 * ------------------------------------------------------------------------------------------- */

export interface PersonalRecord {
  key: string;
  /** Exercise or workout name in the UI locale. */
  name: string;
  /** Course name for workout benchmarks. */
  context?: string;
  /** Unit as stored ('reps', 'seconds', 'meters', 'calories', 'rounds'). */
  unit: string;
  latest: number;
  first: number;
  /** latest − first; 0 with a single attempt. */
  delta: number;
  attempts: number;
  recordedAt: string;
  /** For-time benchmarks: a smaller number is the better result. */
  lowerIsBetter: boolean;
}

type RecordLabel = { kind: 'exercise' | 'workout' | 'unknown'; name: string; context?: string };

/** Benchmark keys are exercise ids (test blocks) or workout ids (benchmark nodes). */
export function recordLabel(key: string, locale: Locale): RecordLabel {
  const exercise = EXERCISE_BY_ID.get(key);
  if (exercise) return { kind: 'exercise', name: exercise.name[locale] };
  for (const course of COURSES) {
    const workout = course.workouts.find((w) => w.id === key);
    if (workout) return { kind: 'workout', name: workout.name[locale], context: course.name[locale] };
  }
  return { kind: 'unknown', name: key.replace(/_/g, ' ') };
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

/** Latest value per benchmark key with the change against the first attempt. */
export function personalRecords(
  series: readonly BenchmarkSeries[],
  locale: Locale,
): PersonalRecord[] {
  return series.map((s) => {
    const label = recordLabel(s.key, locale);
    // `history` is most-recent-first, so the first attempt is the last entry.
    const first = s.history[s.history.length - 1] ?? s.latest;
    return {
      key: s.key,
      name: label.name,
      context: label.context,
      unit: s.latest.unit,
      latest: s.latest.value,
      first: first.value,
      delta: round2(s.latest.value - first.value),
      attempts: s.history.length,
      recordedAt: s.latest.recordedAt,
      lowerIsBetter: label.kind === 'workout' && s.latest.unit === 'seconds',
    };
  });
}

/** True when the latest attempt beats the first, false when it is worse, null without a change. */
export function recordImproved(record: PersonalRecord): boolean | null {
  if (record.attempts < 2 || record.delta === 0) return null;
  return record.lowerIsBetter ? record.delta < 0 : record.delta > 0;
}

/* ---------------------------------------------------------------------------------------------
 * Achievements input and totals
 * ------------------------------------------------------------------------------------------- */

export interface ProgressSnapshot {
  totals: MyTotals | null;
  sessions: readonly WorkoutSessionRow[];
  logs: DailyLogMap;
  benchmarks: readonly BenchmarkSeries[];
  courseStates: Readonly<Record<string, CourseStateRow>>;
  todayIso: string;
}

/** Every workout, test and benchmark node of the course is in `completedNodeIds`. */
export function isCourseCompleted(state: CourseStateRow): boolean {
  const course = COURSE_BY_ID.get(state.courseId);
  if (!course) return false;
  const done = new Set(state.completedNodeIds);
  return course.nodes
    .filter((n) => n.kind === 'workout' || n.kind === 'test' || n.kind === 'benchmark')
    .every((n) => done.has(n.id));
}

/** Calories of the loaded completed sessions (the totals RPC has no calories). */
export function totalCalories(sessions: readonly WorkoutSessionRow[]): number {
  let total = 0;
  for (const s of sessions) if (isCompletedSession(s)) total += s.calories ?? 0;
  return total;
}

/**
 * `UserStats` for `evaluateAchievements` from the progress store. Server totals win when
 * loaded; the streak and steps counters come from the rows in memory (last 90 days of logs).
 */
export function userStatsFromProgress(p: ProgressSnapshot): UserStats {
  const completed = p.sessions.filter(isCompletedSession);
  const streak = computeStreak(buildDayActivity(p.sessions, p.logs), p.todayIso);
  const seconds = completed.reduce((n, s) => n + (s.durationSec ?? 0), 0);
  return {
    workouts: p.totals?.workouts ?? completed.length,
    points: p.totals?.points ?? totalPoints(p.sessions, p.logs),
    streakCurrent: streak.current,
    streakLongest: streak.longest,
    stepsDaysAtGoal: Object.values(p.logs).filter((l) => l.steps >= STEPS_GOAL).length,
    benchmarksDone: p.benchmarks.reduce((n, s) => n + s.history.length, 0),
    coursesCompleted: Object.values(p.courseStates).filter(isCourseCompleted).length,
    totalMinutes: p.totals?.minutes ?? Math.round(seconds / 60),
  };
}

/* ---------------------------------------------------------------------------------------------
 * Labels
 * ------------------------------------------------------------------------------------------- */

/** Compact numeric day/month ("12.08" in RU, "8/12" in EN); noon avoids timezone drift. */
export function dayMonthLabel(locale: Locale, isoDate: string): string {
  const d = new Date(`${isoDate}T12:00:00`);
  return new Intl.DateTimeFormat(locale === 'ru' ? 'ru-RU' : 'en-US', {
    day: 'numeric',
    month: 'numeric',
  }).format(d);
}

/** Day of month without a leading zero ("3", "27"). */
export function dayOfMonthLabel(isoDate: string): string {
  return String(Number(isoDate.slice(8, 10)));
}
