import { afterEach, describe, expect, it } from 'vitest';
import {
  allCourses,
  allExercises,
  findCourse,
  findExercise,
  findNode,
  findWorkout,
  hasCourse,
  isCompiledCourse,
  resetCatalogueOverlay,
  setCatalogueOverlay,
} from './catalogue';
import { COURSES, EXERCISES, LIVE_COURSES } from './registry';
import type { Course, Exercise } from './schema';

afterEach(() => resetCatalogueOverlay());

/** A course shaped like one draftToCourse() would produce. Only the fields these tests read. */
function fakeCourse(id: string, order: number, name = id): Course {
  return {
    ...(COURSES[0] as Course),
    id,
    order,
    slug: { ru: id, en: id },
    name: { ru: name, en: name },
    nodes: [{ id: 'd1', week: 1, day: 1, kind: 'rest', title: { ru: 'Д', en: 'D' } }],
    workouts: [{ ...(COURSES[0]!.workouts[0] as Course['workouts'][number]), id: 'w_fake' }],
  };
}

function fakeExercise(id: string): Exercise {
  return { ...(EXERCISES[0] as Exercise), id, name: { ru: id, en: id } };
}

describe('catalogue', () => {
  it('is exactly the compiled content until something is loaded', () => {
    expect(allCourses()).toEqual(LIVE_COURSES);
    expect(allExercises()).toEqual(EXERCISES);
    expect(findCourse('start')?.id).toBe('start');
  });

  /*
   * The shelf and the shelf's index are different sets, and this is the test that says so: a
   * course taken off sale must vanish from every list and still resolve by id, because somebody
   * who bought it before it was withdrawn still opens it and their history still names it.
   */
  it('hides a course that is not on sale but can still resolve it', () => {
    const hidden = COURSES.filter((c) => !c.published);
    expect(hidden.length).toBeGreaterThan(0);
    for (const c of hidden) {
      expect(allCourses().map((x) => x.id)).not.toContain(c.id);
      expect(findCourse(c.id)?.id).toBe(c.id);
      expect(hasCourse(c.id)).toBe(true);
    }
  });

  it('adds published courses and keeps catalogue order', () => {
    setCatalogueOverlay({ courses: [fakeCourse('yoga', 2)], exercises: [] });
    const ids = allCourses().map((c) => c.id);
    expect(ids).toContain('yoga');
    expect(ids.length).toBe(LIVE_COURSES.length + 1);
    // `order` decides where it sits, not the order it arrived in.
    const orders = allCourses().map((c) => c.order);
    expect([...orders].sort((a, b) => a - b)).toEqual(orders);
    expect(hasCourse('yoga')).toBe(true);
    expect(findCourse('yoga')?.name.ru).toBe('yoga');
  });

  it('lets a compiled course win a collision with a database row', () => {
    // This is the state during the migration of the five existing courses: the files have been
    // reviewed, the rows are a copy in progress.
    const compiled = COURSES[0]!;
    setCatalogueOverlay({
      courses: [fakeCourse(compiled.id, 99, 'ПОДМЕНА')],
      exercises: [],
    });
    expect(findCourse(compiled.id)?.name.ru).toBe(compiled.name.ru);
    expect(allCourses().length).toBe(LIVE_COURSES.length);
    expect(isCompiledCourse(compiled.id)).toBe(true);
  });

  it('adds admin-authored exercises and leaves the seeded ones alone', () => {
    const compiled = EXERCISES[0]!;
    setCatalogueOverlay({
      courses: [],
      exercises: [fakeExercise('yoga_downward_dog'), { ...fakeExercise(compiled.id) }],
    });
    expect(findExercise('yoga_downward_dog')?.id).toBe('yoga_downward_dog');
    // The database copy is seeded *from* the files, so it is at best identical and at worst stale.
    expect(findExercise(compiled.id)?.name.ru).toBe(compiled.name.ru);
    expect(allExercises().length).toBe(EXERCISES.length + 1);
  });

  it('goes back to the compiled content on reset', () => {
    setCatalogueOverlay({ courses: [fakeCourse('yoga', 2)], exercises: [] });
    resetCatalogueOverlay();
    expect(allCourses()).toEqual(LIVE_COURSES);
    expect(findCourse('yoga')).toBeUndefined();
  });

  it('finds a workout and a node inside a course', () => {
    const course = COURSES[0]!;
    expect(findWorkout(course, course.workouts[0]!.id)?.id).toBe(course.workouts[0]!.id);
    expect(findWorkout(course, 'nope')).toBeUndefined();
    expect(findNode(course, course.nodes[0]!.id)?.id).toBe(course.nodes[0]!.id);
    expect(findNode(course, 'nope')).toBeUndefined();
  });
});
