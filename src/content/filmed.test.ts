import { describe, expect, it } from 'vitest';
import { EXERCISES, FILMED_EXERCISES, LIVE_COURSES, isFilmed } from './registry';
import type { COURSES } from './registry';

/*
 * The cut the owner asked for: «с сайта и отовсюду убери упражнения у которых нет видео».
 *
 * The risk it carries is not the pages that go — it is a course on sale left prescribing a movement
 * that no longer has anywhere to explain itself. That is what the first test guards, and it is the
 * one that has to stay green for as long as the library is ahead of the camera.
 */
function prescribedIds(course: (typeof COURSES)[number]): Set<string> {
  const ids = new Set<string>();
  for (const w of course.workouts)
    for (const b of w.blocks) for (const i of b.items) ids.add(i.exerciseId);
  return ids;
}

describe('filmed exercises', () => {
  it('leaves every movement of every course on sale filmed', () => {
    const unfilmed = LIVE_COURSES.flatMap((c) =>
      [...prescribedIds(c)].filter((id) => !isFilmed(id)).map((id) => `${c.id}: ${id}`),
    );
    expect(unfilmed).toEqual([]);
  });

  it('is the subset of the library that has a clip, and keeps the rest in content', () => {
    // The unfilmed entries are not deleted: they are the copy the coach needs the week he films
    // them, and the courses held back from sale still prescribe them.
    expect(FILMED_EXERCISES.length).toBeGreaterThan(0);
    expect(FILMED_EXERCISES.length).toBeLessThan(EXERCISES.length);
    expect(FILMED_EXERCISES.every((e) => e.video)).toBe(true);
    expect(EXERCISES.filter((e) => e.video).length).toBe(FILMED_EXERCISES.length);
  });

  it('agrees with isFilmed, which is what the public surfaces ask', () => {
    for (const e of EXERCISES) expect(isFilmed(e.id)).toBe(Boolean(e.video));
    expect(isFilmed('no_such_exercise')).toBe(false);
  });
});
