import { describe, expect, it } from 'vitest';
import { COURSE_BY_ID } from '@/content/registry';
import type { Course } from '@/content/schema';
import { DEMO_COURSE_ID, firstWorkoutFacts } from './demo';
import { filmedFacts, wallMoves } from './filmed';

describe('filmedFacts', () => {
  const course = COURSE_BY_ID.get(DEMO_COURSE_ID)!;
  const facts = filmedFacts(course);

  it('counts every distinct movement of the course, warm-ups included', () => {
    const ids = new Set(
      course.workouts.flatMap((w) => w.blocks.flatMap((b) => b.items)).map((i) => i.exerciseId),
    );
    expect(facts.total).toBe(ids.size);
    expect(facts.filmed).toBeLessThanOrEqual(facts.total);
    expect(facts.all).toBe(facts.filmed === facts.total);
  });

  it('says «all» only when a movement without a clip is absent', () => {
    const fake = {
      ...course,
      workouts: [
        ...course.workouts,
        {
          ...course.workouts[0]!,
          id: 'w_fake',
          blocks: [{ ...course.workouts[0]!.blocks[0]!, items: [{ exerciseId: 'no_such_move' }] }],
        },
      ],
    } as unknown as Course;
    const withGap = filmedFacts(fake);
    expect(withGap.total).toBe(facts.total + 1);
    expect(withGap.all).toBe(false);
  });

  it('builds the wall from training movements, without the ones shown elsewhere', () => {
    const first = firstWorkoutFacts('ru', course)!.moves.map((m) => m.exerciseId);
    const wall = wallMoves(facts, first, 8);
    expect(wall.length).toBeLessThanOrEqual(8);
    expect(new Set(wall).size).toBe(wall.length);
    expect(wall.some((id) => first.includes(id))).toBe(false);
    expect(wall.every((id) => facts.filmedIds.includes(id))).toBe(true);
    // Training movements lead; the reserve only fills what they leave.
    const lead = facts.training.filter((id) => !first.includes(id)).slice(0, 8);
    expect(wall.slice(0, lead.length)).toEqual(lead);
    if (facts.filmedIds.length - first.length >= 8) expect(wall).toHaveLength(8);
  });
});
