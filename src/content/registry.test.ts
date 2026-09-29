import { describe, expect, it } from 'vitest';
import {
  COURSES,
  EXERCISES,
  FILMED_EXERCISES,
  LIVE_COURSES,
  contentIssues,
  coursesUsingExercise,
} from './registry';

describe('content registry', () => {
  it('loads exercises and courses without schema or cross-reference issues', () => {
    const issues = contentIssues();
    const report = issues.map((i) => `${i.path}: ${i.message}`).join('\n');
    expect(issues, report).toEqual([]);
  });

  it('ships the full catalog (6 courses, 40+ exercises)', () => {
    expect(COURSES.length).toBe(6);
    expect(EXERCISES.length).toBeGreaterThanOrEqual(40);
  });

  it('every course has both locales in slugs and unique node ids', () => {
    for (const c of COURSES) {
      expect(c.slug.ru).toBeTruthy();
      expect(c.slug.en).toBeTruthy();
      expect(new Set(c.nodes.map((n) => n.id)).size).toBe(c.nodes.length);
    }
  });

  it('links an exercise only to courses on sale', () => {
    // Every filmed exercise has a public page, and each course it lists there is an anchor.
    const live = new Set(LIVE_COURSES.map((c) => c.id));
    const hidden = COURSES.filter((c) => !live.has(c.id));
    expect(hidden.length).toBeGreaterThan(0);
    for (const ex of FILMED_EXERCISES) {
      for (const c of coursesUsingExercise(ex.id))
        expect(live.has(c.id), `${ex.id} → ${c.id}`).toBe(true);
    }
    // A hidden course is still found when the caller asks for it by pool.
    const [anyHidden] = hidden;
    const firstId = anyHidden?.workouts[0]?.blocks[0]?.items[0]?.exerciseId;
    if (anyHidden && firstId) {
      expect(coursesUsingExercise(firstId, COURSES).map((c) => c.id)).toContain(anyHidden.id);
    }
  });
});
