/**
 * The assessment list is content (`content/site/assessment.ts`), so it is edited by hand and can
 * name a movement that does not exist, or a record key the database will reject. Both fail at
 * runtime, in the middle of the one minute the athlete is counting — so they fail here instead.
 */
import { describe, expect, it } from 'vitest';
import { EXERCISE_BY_ID } from '@/content/registry';
import { ASSESSMENT_MOVES, ASSESSMENT_TOTAL_MIN } from '@content/site/assessment';

/** `recordBenchmark` (src/lib/api/benchmarks.ts) rejects anything else. */
const BENCHMARK_KEY = /^[a-z0-9_]{2,60}$/;

describe('onboarding assessment', () => {
  it('names movements the library actually has', () => {
    for (const move of ASSESSMENT_MOVES) {
      expect(EXERCISE_BY_ID.has(move.exerciseId), `unknown exercise: ${move.exerciseId}`).toBe(
        true,
      );
    }
  });

  it('measures every movement, and each one exactly once', () => {
    const ids = ASSESSMENT_MOVES.map((m) => m.exerciseId);
    expect(new Set(ids).size).toBe(ids.length);
    for (const move of ASSESSMENT_MOVES) {
      expect(move.seconds).toBeGreaterThan(0);
      // A count is either an engine input or a personal record; a count that is neither is data
      // collected from someone and then thrown away.
      expect(Boolean(move.maps) !== Boolean(move.benchmarkKey)).toBe(true);
      if (move.benchmarkKey) expect(move.benchmarkKey).toMatch(BENCHMARK_KEY);
    }
  });

  it('feeds each self-test of the fitness index at most once', () => {
    const mapped = ASSESSMENT_MOVES.map((m) => m.maps).filter(Boolean);
    expect(new Set(mapped).size).toBe(mapped.length);
  });

  it('fits the ten minutes it promises', () => {
    const work = ASSESSMENT_MOVES.reduce((sum, m) => sum + m.seconds, 0);
    // Work plus reading each movement and catching your breath after it; the promise is the whole
    // sitting, so the working half of it has to leave room for the rest.
    expect(work).toBeLessThanOrEqual(ASSESSMENT_TOTAL_MIN * 60 * 0.7);
  });
});
