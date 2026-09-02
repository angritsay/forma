import { describe, expect, it } from 'vitest';
import {
  AGE_BAND_NORM_BANDS,
  CHOICE_POINTS,
  CHOICE_REST,
  CHOICE_VOLUME,
  FITNESS_WEIGHTS,
  LEVEL_THRESHOLDS,
  LEVEL_TIER,
  PUSHUP_NORMS,
  STREAK_BONUS,
} from './constants';

describe('constants', () => {
  it('fitness weights sum to 1', () => {
    const total = Object.values(FITNESS_WEIGHTS).reduce((a, b) => a + b, 0);
    expect(total).toBeCloseTo(1, 10);
  });

  it('has 10 strictly ascending level thresholds starting at 0', () => {
    expect(LEVEL_THRESHOLDS).toHaveLength(10);
    expect(LEVEL_THRESHOLDS[0]).toBe(0);
    for (let i = 1; i < LEVEL_THRESHOLDS.length; i++) {
      expect(LEVEL_THRESHOLDS[i]!).toBeGreaterThan(LEVEL_THRESHOLDS[i - 1]!);
    }
    expect(LEVEL_TIER.level2From).toBeLessThan(LEVEL_TIER.level3From);
  });

  it('difficulty multipliers are ordered easier < normal < harder', () => {
    expect(CHOICE_VOLUME.easier).toBeLessThan(CHOICE_VOLUME.normal);
    expect(CHOICE_VOLUME.harder).toBeGreaterThan(CHOICE_VOLUME.normal);
    expect(CHOICE_REST.easier).toBeGreaterThan(CHOICE_REST.harder);
    expect(CHOICE_POINTS.easier).toBeLessThan(CHOICE_POINTS.harder);
    expect(STREAK_BONUS[0]!.days).toBeGreaterThan(STREAK_BONUS[1]!.days);
  });

  it('push-up norms are monotonic within a row and every age band maps to a norm band', () => {
    for (const sex of ['male', 'female'] as const) {
      for (const row of Object.values(PUSHUP_NORMS[sex])) {
        for (let i = 1; i < row.length; i++) expect(row[i]!).toBeGreaterThan(row[i - 1]!);
      }
    }
    for (const bands of Object.values(AGE_BAND_NORM_BANDS)) expect(bands.length).toBeGreaterThan(0);
  });
});
