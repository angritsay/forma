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
  mediaOverlay,
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

  /*
   * The one thing a colliding row knows that the file does not is what the admin uploaded: the
   * seed never writes the media columns. That markup used to be dropped with the row.
   */
  it('takes the media of a database row whose id is compiled, and nothing else', () => {
    const compiled = EXERCISES[0]!;
    const row: Exercise = {
      ...fakeExercise(compiled.id),
      video: { ru: 'storage:videos/shared/row.ru.mp4' },
      videoMode: 'fit',
      audio: { ru: 'storage:audio/shared/row.ru.m4a' },
      introFull: { text: { ru: 'Полное' } },
      introBrief: { video: 'storage:videos/shared/row.intro-brief.mp4' },
    };
    setCatalogueOverlay({ courses: [], exercises: [row] });
    const merged = findExercise(compiled.id)!;
    expect(merged.name.ru).toBe(compiled.name.ru);
    expect(merged.description).toEqual(compiled.description);
    expect(merged.video).toEqual({ ru: 'storage:videos/shared/row.ru.mp4' });
    expect(merged.videoMode).toBe('fit');
    expect(merged.audio).toEqual({ ru: 'storage:audio/shared/row.ru.m4a' });
    expect(merged.introFull).toEqual({ text: { ru: 'Полное' } });
    expect(merged.introBrief).toEqual({ video: 'storage:videos/shared/row.intro-brief.mp4' });
    expect(allExercises().length).toBe(EXERCISES.length);
    // The list carries the same object the lookup does.
    expect(allExercises().find((e) => e.id === compiled.id)).toBe(merged);
  });

  it('keeps a compiled clip when the row has no media of its own', () => {
    const withClip = EXERCISES.find((e) => e.video !== undefined) ?? EXERCISES[0]!;
    const bare: Exercise = { ...fakeExercise(withClip.id) };
    delete bare.video;
    delete bare.videoMode;
    delete bare.audio;
    delete bare.introFull;
    delete bare.introBrief;
    setCatalogueOverlay({ courses: [], exercises: [bare] });
    expect(findExercise(withClip.id)).toEqual(withClip);
    expect(mediaOverlay(bare)).toEqual({});
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
