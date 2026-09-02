import { describe, expect, it } from 'vitest';
import * as engine from './index';

describe('training engine public API', () => {
  it('exposes every function from SPEC §7', () => {
    const fns = [
      'computeFitnessIndex',
      'initialScale',
      'recommendDifficulty',
      'prescribeWorkout',
      'estimateDuration',
      'estimatePoints',
      'estimateCalories',
      'buildPlayerSteps',
      'summarizeSession',
      'adaptScale',
      'computeStreak',
      'stepsPoints',
      'levelForPoints',
      'evaluateAchievements',
    ] as const;
    for (const name of fns) expect(typeof engine[name], name).toBe('function');
    expect(Array.isArray(engine.ACHIEVEMENTS)).toBe(true);
    expect(engine.STEPS_GOAL).toBe(7000);
    expect(engine.LEVEL_THRESHOLDS).toHaveLength(10);
  });

  it('runs end to end against the (possibly empty) content registry without throwing', () => {
    const profile: engine.UserTrainingProfile = {
      ageBand: '35-44',
      sex: 'female',
      activityLevel: 'light',
      experience: 'none',
      tests: { pushups: 8, pushupsOnKnees: true, squats60s: 22, plankSec: 40 },
      limitations: [],
      equipment: ['none'],
      timePerSessionMin: 20,
      goal: 'fat_loss',
    };
    const fit = engine.computeFitnessIndex(profile);
    const scale = engine.initialScale(fit.index);
    expect(scale).toBeGreaterThanOrEqual(0.6);
    expect(scale).toBeLessThanOrEqual(1.3);
    const rec = engine.recommendDifficulty(
      { scale, history: [], completedNodeIds: [] },
      profile,
      '2026-09-02T08:00:00.000Z',
    );
    expect(rec.choice).toBe('normal');
  });
});
