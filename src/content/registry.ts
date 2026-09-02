/**
 * Validated, indexed access to product content.
 * Content authors export raw arrays from /content; this module validates them once
 * and exposes typed lookups for the app, the landing and the scripts.
 */
import type { z } from 'zod';
import { EXERCISES as RAW_EXERCISES } from '@content/exercises/index';
import { COURSES as RAW_COURSES } from '@content/courses/index';
import {
  CourseSchema,
  ExerciseSchema,
  type Course,
  type CourseNode,
  type Exercise,
  type Locale,
  type Workout,
} from './schema';

export type ContentIssue = { path: string; message: string };

function validate<T>(
  schema: z.ZodType<T, z.ZodTypeDef, unknown>,
  items: unknown[],
  label: string,
): { items: T[]; issues: ContentIssue[] } {
  const out: T[] = [];
  const issues: ContentIssue[] = [];
  items.forEach((raw, i) => {
    const res = schema.safeParse(raw);
    if (res.success) out.push(res.data);
    else {
      for (const e of res.error.issues) {
        issues.push({ path: `${label}[${i}].${e.path.join('.')}`, message: e.message });
      }
    }
  });
  return { items: out, issues };
}

const exercisesResult = validate(ExerciseSchema, RAW_EXERCISES as unknown[], 'exercises');
const coursesResult = validate(CourseSchema, RAW_COURSES as unknown[], 'courses');

export const EXERCISES: readonly Exercise[] = exercisesResult.items;
export const COURSES: readonly Course[] = [...coursesResult.items].sort(
  (a, b) => a.order - b.order,
);

export const EXERCISE_BY_ID: ReadonlyMap<string, Exercise> = new Map(
  EXERCISES.map((e) => [e.id, e]),
);
export const COURSE_BY_ID: ReadonlyMap<string, Course> = new Map(COURSES.map((c) => [c.id, c]));

export function getExercise(id: string): Exercise {
  const e = EXERCISE_BY_ID.get(id);
  if (!e) throw new Error(`Unknown exercise id: ${id}`);
  return e;
}

export function getCourse(id: string): Course {
  const c = COURSE_BY_ID.get(id);
  if (!c) throw new Error(`Unknown course id: ${id}`);
  return c;
}

export function getWorkout(course: Course, workoutId: string): Workout {
  const w = course.workouts.find((x) => x.id === workoutId);
  if (!w) throw new Error(`Unknown workout ${workoutId} in course ${course.id}`);
  return w;
}

export function getNode(course: Course, nodeId: string): CourseNode {
  const n = course.nodes.find((x) => x.id === nodeId);
  if (!n) throw new Error(`Unknown node ${nodeId} in course ${course.id}`);
  return n;
}

export function findExerciseBySlug(locale: Locale, slug: string): Exercise | undefined {
  return EXERCISES.find((e) => e.slug[locale] === slug);
}

export function findCourseBySlug(locale: Locale, slug: string): Course | undefined {
  return COURSES.find((c) => c.slug[locale] === slug);
}

/** Exercises used by a course (unique, in first-appearance order). */
export function courseExercises(course: Course): Exercise[] {
  const seen = new Set<string>();
  const out: Exercise[] = [];
  for (const w of course.workouts) {
    for (const b of w.blocks) {
      for (const it of b.items) {
        if (!seen.has(it.exerciseId)) {
          seen.add(it.exerciseId);
          const e = EXERCISE_BY_ID.get(it.exerciseId);
          if (e) out.push(e);
        }
      }
    }
  }
  return out;
}

/** Courses that use a given exercise. */
export function coursesUsingExercise(exerciseId: string): Course[] {
  return COURSES.filter((c) =>
    c.workouts.some((w) =>
      w.blocks.some((b) => b.items.some((it) => it.exerciseId === exerciseId)),
    ),
  );
}

/**
 * Cross-reference checks that zod cannot express per item.
 * Returns an empty array when the content is consistent.
 */
export function contentIssues(): ContentIssue[] {
  const issues: ContentIssue[] = [...exercisesResult.issues, ...coursesResult.issues];

  const exIds = new Set<string>();
  for (const e of EXERCISES) {
    if (exIds.has(e.id))
      issues.push({ path: `exercises.${e.id}`, message: 'duplicate exercise id' });
    exIds.add(e.id);
    for (const key of ['easier', 'harder'] as const) {
      const ref = e.scaling[key];
      if (ref && !EXERCISE_BY_ID.has(ref))
        issues.push({
          path: `exercises.${e.id}.scaling.${key}`,
          message: `unknown exercise ${ref}`,
        });
      if (ref === e.id)
        issues.push({ path: `exercises.${e.id}.scaling.${key}`, message: 'self reference' });
    }
  }
  for (const loc of ['ru', 'en'] as const) {
    const slugs = new Set<string>();
    for (const e of EXERCISES) {
      if (slugs.has(e.slug[loc]))
        issues.push({ path: `exercises.${e.id}.slug.${loc}`, message: 'duplicate slug' });
      slugs.add(e.slug[loc]);
    }
  }

  const courseIds = new Set<string>();
  for (const c of COURSES) {
    if (courseIds.has(c.id))
      issues.push({ path: `courses.${c.id}`, message: 'duplicate course id' });
    courseIds.add(c.id);
    const workoutIds = new Set(c.workouts.map((w) => w.id));
    if (workoutIds.size !== c.workouts.length)
      issues.push({ path: `courses.${c.id}.workouts`, message: 'duplicate workout id' });
    const allowed = new Set<string>([...c.equipment, 'none', 'mat']);
    for (const w of c.workouts) {
      for (const b of w.blocks) {
        for (const it of b.items) {
          const e = EXERCISE_BY_ID.get(it.exerciseId);
          if (!e) {
            issues.push({
              path: `courses.${c.id}.${w.id}.${b.id}`,
              message: `unknown exercise ${it.exerciseId}`,
            });
            continue;
          }
          if (!e.equipment.some((eq) => allowed.has(eq))) {
            issues.push({
              path: `courses.${c.id}.${w.id}.${b.id}.${it.exerciseId}`,
              message: `needs ${e.equipment.join('/')} not in course equipment`,
            });
          }
          const unitKey = e.unit;
          const given =
            it.reps !== undefined
              ? 'reps'
              : it.seconds !== undefined
                ? 'seconds'
                : it.meters !== undefined
                  ? 'meters'
                  : 'calories';
          if (given !== unitKey && !(unitKey === 'reps' && given === 'seconds')) {
            issues.push({
              path: `courses.${c.id}.${w.id}.${b.id}.${it.exerciseId}`,
              message: `unit ${given} does not match exercise unit ${unitKey}`,
            });
          }
        }
      }
    }
    const nodeIds = new Set<string>();
    let prevWorkoutDay: { week: number; day: number } | null = null;
    const kinds = { start: false, end: false };
    c.nodes.forEach((n, i) => {
      if (nodeIds.has(n.id))
        issues.push({ path: `courses.${c.id}.nodes.${n.id}`, message: 'duplicate node id' });
      nodeIds.add(n.id);
      if (n.workoutId && !workoutIds.has(n.workoutId))
        issues.push({
          path: `courses.${c.id}.nodes.${n.id}`,
          message: `unknown workout ${n.workoutId}`,
        });
      if (n.week > c.weeks)
        issues.push({
          path: `courses.${c.id}.nodes.${n.id}`,
          message: `week ${n.week} > course weeks ${c.weeks}`,
        });
      const prev = c.nodes[i - 1];
      if (prev && (prev.week > n.week || (prev.week === n.week && prev.day > n.day))) {
        issues.push({
          path: `courses.${c.id}.nodes.${n.id}`,
          message: 'nodes must be ordered by week/day',
        });
      }
      if (n.kind === 'test' || n.kind === 'benchmark') {
        if (i === 0) kinds.start = true;
        if (i === c.nodes.length - 1) kinds.end = true;
      }
      if (n.kind === 'workout') {
        if (prevWorkoutDay && prevWorkoutDay.week === n.week && prevWorkoutDay.day === n.day) {
          issues.push({
            path: `courses.${c.id}.nodes.${n.id}`,
            message: 'two workouts on the same day',
          });
        }
        prevWorkoutDay = { week: n.week, day: n.day };
      }
    });
    if (!kinds.start)
      issues.push({
        path: `courses.${c.id}.nodes`,
        message: 'first node must be a test/benchmark (baseline)',
      });
    if (!kinds.end)
      issues.push({
        path: `courses.${c.id}.nodes`,
        message: 'last node must be a test/benchmark (retest)',
      });
  }
  for (const loc of ['ru', 'en'] as const) {
    const slugs = new Set<string>();
    for (const c of COURSES) {
      if (slugs.has(c.slug[loc]))
        issues.push({ path: `courses.${c.id}.slug.${loc}`, message: 'duplicate slug' });
      slugs.add(c.slug[loc]);
    }
  }
  return issues;
}
