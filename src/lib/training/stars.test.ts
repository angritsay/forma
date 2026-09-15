/**
 * The star is a promise to the athlete — "go back and take this harder and it is worth more" — so
 * the ways it could quietly lie are what this file is about. Every case below is one an
 * adversarial review of the design actually found.
 */
import { describe, expect, it } from 'vitest';
import { block, fixtureLookup, item, profile, workout } from './fixtures.test-helpers';
import { buildPlayerSteps } from './player';
import { prescribeWorkout } from './prescribe';
import { computeCompletion } from './session';
import {
  bestStars,
  nodeEarnsStars,
  starMarks,
  starsEarned,
  STARS_ON_OFFER,
  workDone,
} from './stars';
import type { DifficultyChoice, ExerciseResult } from './types';

/** A session shaped like the beginner course: a warm-up, one main piece, a cool-down. */
const SESSION = workout({
  id: 'w',
  blocks: [
    block({
      id: 'wu',
      type: 'warmup',
      format: 'circuit',
      sets: 1,
      scalable: false,
      items: [item('air_squat', { reps: 10 }), item('push_up', { reps: 10 })],
    }),
    block({
      id: 'main',
      type: 'strength',
      format: 'sets',
      sets: 2,
      items: [item('air_squat', { reps: 20 }), item('push_up', { reps: 20 })],
    }),
    block({
      id: 'cd',
      type: 'cooldown',
      format: 'sets',
      sets: 1,
      scalable: false,
      items: [item('air_squat', { seconds: 30 })],
    }),
  ],
});

const prescribed = (choice: DifficultyChoice = 'normal') =>
  prescribeWorkout(SESSION, { profile: profile(), scale: 1, choice, level: 2 }, fixtureLookup);

const stepsOf = (choice: DifficultyChoice = 'normal') => buildPlayerSteps(prescribed(choice));

/** Everything done, exactly as prescribed. */
function allDone(choice: DifficultyChoice = 'normal'): ExerciseResult[] {
  return stepsOf(choice).flatMap((s, i) =>
    s.kind === 'work'
      ? [{ stepIndex: i, blockId: s.blockId, completed: true, achieved: s.target }]
      : [],
  );
}

/** Everything done except the steps of one block. */
function allDoneExcept(blockId: string, choice: DifficultyChoice = 'normal'): ExerciseResult[] {
  return allDone(choice).filter((r) => r.blockId !== blockId);
}

describe('what fills a star', () => {
  it('is the main work, and nothing else', () => {
    expect(workDone(prescribed(), allDone())).toBe(1);
  });

  it('is untouched by skipping the warm-up or the cool-down', () => {
    // The point of the whole design: preparation is free to skip, the work is not. On a real
    // beginner session those two blocks are most of the clock, so counting them would make the
    // skip controls a trap.
    expect(workDone(prescribed(), allDoneExcept('wu'))).toBe(1);
    expect(workDone(prescribed(), allDoneExcept('cd'))).toBe(1);
    expect(
      workDone(
        prescribed(),
        allDone().filter((r) => r.blockId === 'main'),
      ),
    ).toBe(1);
  });

  it('falls when the main work is skipped', () => {
    expect(workDone(prescribed(), allDoneExcept('main'))).toBe(0);
  });

  it('is a share when only some of the main work was done', () => {
    const half = allDone().filter((r, i) => r.blockId !== 'main' || i % 2 === 0);
    const w = workDone(prescribed(), half);
    expect(w).toBeGreaterThan(0);
    expect(w).toBeLessThan(1);
  });

  it('does not change the session completion it is derived alongside', () => {
    // Stars are a second reading of the same results. The stored completion drives the course
    // scale, the next recommendation and the points, so it has to keep meaning what it meant.
    const steps = stepsOf();
    const results = allDoneExcept('wu');
    expect(computeCompletion(steps, results)).toBeLessThan(1);
    expect(workDone(prescribed(), results)).toBe(1);
  });
});

describe('what the choice puts up', () => {
  it('is one, two or three stars', () => {
    expect(STARS_ON_OFFER).toEqual({ easier: 1, normal: 2, harder: 3 });
    expect(starsEarned('easier', 1)).toBe(1);
    expect(starsEarned('normal', 1)).toBe(2);
    expect(starsEarned('harder', 1)).toBe(3);
  });

  it('only «посложнее», done in full, is worth three', () => {
    expect(starsEarned('normal', 1)).toBeLessThan(3);
    expect(starsEarned('harder', 0.99)).toBeLessThan(3);
  });

  it('pays nothing for a session that was opened and abandoned', () => {
    for (const c of ['easier', 'normal', 'harder'] as const) expect(starsEarned(c, 0)).toBe(0);
  });
});

describe('a node keeps its best attempt', () => {
  it('takes the best, never the latest', () => {
    // Repeating a day on a bad morning must not cost the stars already earned — the mechanic asks
    // people to come back, so coming back can only ever help.
    const best = bestStars([
      { choice: 'harder', work: 1 },
      { choice: 'easier', work: 0.4 },
    ]);
    expect(best).toBe(3);
  });

  it('is nothing before the first attempt', () => {
    expect(bestStars([])).toBe(0);
  });

  it('is not halved by a repeat, unlike points', () => {
    expect(
      bestStars([
        { choice: 'normal', work: 1 },
        { choice: 'normal', work: 1 },
      ]),
    ).toBe(2);
  });
});

describe('which nodes are graded at all', () => {
  it('grades a workout', () => {
    expect(nodeEarnsStars('workout')).toBe(true);
  });

  it('does not grade a test, a benchmark, a rest day or a milestone', () => {
    // A test is identical at every difficulty by construction, so a choice made on it costs
    // nothing: three stars there would be the cheapest in the product. You are not marked for
    // sitting an exam.
    for (const kind of ['test', 'benchmark', 'rest', 'milestone'] as const) {
      expect(nodeEarnsStars(kind), kind).toBe(false);
    }
  });
});

describe('drawing three marks', () => {
  it('never draws a mark as full until it is', () => {
    expect(starMarks(2.99)).toEqual({ full: 2, partial: 0.99, empty: 0 });
    expect(starMarks(3)).toEqual({ full: 3, partial: 0, empty: 0 });
  });

  it('always accounts for exactly three', () => {
    for (const s of [0, 0.3, 1, 1.5, 2, 2.4, 3]) {
      const m = starMarks(s);
      expect(m.full + (m.partial > 0 ? 1 : 0) + m.empty, `stars ${s}`).toBe(3);
    }
  });

  it('cannot be pushed past three or below nothing', () => {
    expect(starMarks(99)).toEqual({ full: 3, partial: 0, empty: 0 });
    expect(starMarks(-1)).toEqual({ full: 0, partial: 0, empty: 3 });
  });
});
