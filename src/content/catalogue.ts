/**
 * The catalogue the product trains from: the compiled content, plus whatever has been published
 * from the admin panel on top of it.
 *
 * `registry.ts` reads the files in /content and validates them at module load. That was the whole
 * truth while a course could only be a file. Since 0008 a course can also be rows in the database,
 * and those change without a deploy — so the truth is something loaded at runtime, and this module
 * is where the two halves meet.
 *
 * The shape never changes: `draftToCourse()` turns the rows into the same `Course` object
 * `CourseSchema` describes, so the path screen, the player, scoring and the leaderboard cannot tell
 * the two kinds apart. That is the point.
 *
 * It lives under `src/content/` rather than `src/app/store/` because `src/lib/training` needs the
 * lookups too, and the training model must not depend on a React store. The React binding is
 * `src/app/store/catalogue.ts`, which loads the data and calls {@link setCatalogueOverlay}.
 *
 * With nothing loaded — a static landing build, a script, a test — every accessor returns exactly
 * what the compiled registry holds.
 */
import { COURSES, EXERCISE_BY_ID, EXERCISES, LIVE_COURSES } from './registry';
import type { Course, CourseNode, Exercise, Workout } from './schema';

const COMPILED_COURSE_BY_ID: ReadonlyMap<string, Course> = new Map(COURSES.map((c) => [c.id, c]));

/*
 * The list and the lookup are deliberately different sets.
 *
 * `courses` is what the app *offers* — the course list, the home page — so it holds only what is
 * on sale. `courseById` is what the app can *resolve*, and that has to stay every compiled course:
 * somebody who bought a course before it was taken off sale still opens it, their history still
 * names it, and the demo backend still seeds it. A course off sale disappears from the shelf, not
 * from the product.
 */
let courses: readonly Course[] = LIVE_COURSES;
let courseById: ReadonlyMap<string, Course> = COMPILED_COURSE_BY_ID;
let exercises: readonly Exercise[] = EXERCISES;
let exerciseById: ReadonlyMap<string, Exercise> = EXERCISE_BY_ID;

const listeners = new Set<() => void>();

/** Is this id one of the compiled courses? Used to let the files win during the migration. */
export const isCompiledCourse = (id: string): boolean => COMPILED_COURSE_BY_ID.has(id);

/** Is this id one of the compiled exercises? */
export const isCompiledExercise = (id: string): boolean => EXERCISE_BY_ID.has(id);

/**
 * Replace the runtime half of the catalogue.
 *
 * Compiled content always wins a collision. Database exercises are *seeded from* the files and
 * re-seeded on every content change, so a row that shares an id is at best identical and at worst
 * stale; the rows worth taking are the ones with no compiled counterpart, which is exactly the set
 * somebody authored. The same rule one level up keeps the five reviewed course files authoritative
 * while they are being migrated into the database.
 */
export function setCatalogueOverlay(overlay: {
  courses: readonly Course[];
  exercises: readonly Exercise[];
}): void {
  const extraCourses = overlay.courses.filter((c) => !COMPILED_COURSE_BY_ID.has(c.id));
  const extraExercises = overlay.exercises.filter((e) => !EXERCISE_BY_ID.has(e.id));

  courses = [...LIVE_COURSES, ...extraCourses].sort((a, b) => a.order - b.order);
  // Keyed over every compiled course, not just the ones on sale — see the note by the declaration.
  courseById = new Map([...COURSES, ...extraCourses].map((c) => [c.id, c]));
  exercises = [...EXERCISES, ...extraExercises];
  exerciseById = new Map(exercises.map((e) => [e.id, e]));

  for (const fn of listeners) fn();
}

/** Drop back to the compiled content. For tests, and for signing out. */
export function resetCatalogueOverlay(): void {
  courses = LIVE_COURSES;
  courseById = COMPILED_COURSE_BY_ID;
  exercises = EXERCISES;
  exerciseById = EXERCISE_BY_ID;
  for (const fn of listeners) fn();
}

/** Called after every overlay change. Returns an unsubscribe. */
export function onCatalogueChange(fn: () => void): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export const allCourses = (): readonly Course[] => courses;
export const allExercises = (): readonly Exercise[] => exercises;
export const findCourse = (id: string): Course | undefined => courseById.get(id);
export const findExercise = (id: string): Exercise | undefined => exerciseById.get(id);
export const hasCourse = (id: string): boolean => courseById.has(id);

/** A workout of a course, by id. Ids are unique inside a course, not globally. */
export const findWorkout = (course: Course, workoutId: string): Workout | undefined =>
  course.workouts.find((w) => w.id === workoutId);

/** A node of a course, by id. */
export const findNode = (course: Course, nodeId: string): CourseNode | undefined =>
  course.nodes.find((n) => n.id === nodeId);
