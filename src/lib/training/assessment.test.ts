import { describe, expect, it } from 'vitest';
import {
  computeFitnessIndex,
  initialScale,
  levelForIndex,
  plankScore,
  pushupAnchors,
  pushupScore,
  squatScore,
} from './assessment';
import { profile } from './fixtures.test-helpers';

describe('pushupScore', () => {
  it('averages the two overlapping norm bands for 25–34', () => {
    expect(pushupAnchors('male', '25-34')).toEqual([14.5, 19.5, 25.5, 33]);
    expect(pushupAnchors('male', '18-24')).toEqual([17, 22, 29, 36]);
    expect(pushupAnchors('female', '65+')).toEqual([2, 5, 12, 17]);
  });

  it('scores 0 for no push-ups and 100 at the excellent anchor', () => {
    expect(pushupScore(profile({ ageBand: '18-24', tests: { pushups: 0 } }))).toBe(0);
    expect(pushupScore(profile({ ageBand: '18-24', tests: { pushups: 36 } }))).toBe(100);
    expect(pushupScore(profile({ ageBand: '18-24', tests: { pushups: 60 } }))).toBe(100);
  });

  it('interpolates linearly between category anchors', () => {
    // male 18–24: fair 17 → 25, good 22 → 50
    expect(pushupScore(profile({ ageBand: '18-24', tests: { pushups: 17 } }))).toBeCloseTo(25);
    expect(pushupScore(profile({ ageBand: '18-24', tests: { pushups: 22 } }))).toBeCloseTo(50);
    expect(pushupScore(profile({ ageBand: '18-24', tests: { pushups: 19.5 } }))).toBeCloseTo(37.5);
  });

  it('scores women on the modified push-up table', () => {
    const w = (n: number) =>
      pushupScore(
        profile({ sex: 'female', ageBand: '18-24', tests: { pushups: n, pushupsOnKnees: true } }),
      );
    expect(w(30)).toBe(100);
    expect(w(15)).toBeCloseTo(50);
  });

  it('converts modality: knee push-ups ≈ 0.6 full for men, full ≈ knee / 0.6 for women', () => {
    // 30 knee → 18 full-equivalent, male 18–24: between fair 17 (25) and good 22 (50)
    const man = pushupScore(
      profile({ ageBand: '18-24', tests: { pushups: 30, pushupsOnKnees: true } }),
    );
    expect(man).toBeCloseTo(30);
    // 12 full → 20 knee-equivalent, female 18–24: between good 15 (50) and very good 21 (75)
    const woman = pushupScore(profile({ sex: 'female', ageBand: '18-24', tests: { pushups: 12 } }));
    expect(woman).toBeCloseTo(70.833, 2);
  });

  it('averages the male and female tables for sex "na"', () => {
    const male = pushupScore(profile({ sex: 'male', ageBand: '35-44', tests: { pushups: 20 } }))!;
    const female = pushupScore(
      profile({ sex: 'female', ageBand: '35-44', tests: { pushups: 20 } }),
    )!;
    const na = pushupScore(profile({ sex: 'na', ageBand: '35-44', tests: { pushups: 20 } }))!;
    expect(na).toBeCloseTo((male + female) / 2);
  });

  it('is more lenient for older age bands', () => {
    const young = pushupScore(profile({ ageBand: '18-24', tests: { pushups: 30 } }))!;
    const older = pushupScore(profile({ ageBand: '65+', tests: { pushups: 30 } }))!;
    expect(older).toBeGreaterThan(young);
    expect(older).toBe(100);
  });

  it('returns undefined when the test is missing', () => {
    expect(pushupScore(profile({ tests: {} }))).toBeUndefined();
  });
});

describe('squatScore', () => {
  it('follows the 25–34 expert anchors', () => {
    const s = (n: number) => squatScore(profile({ ageBand: '25-34', tests: { squats60s: n } }));
    expect(s(0)).toBe(0);
    expect(s(15)).toBeCloseTo(10);
    expect(s(30)).toBeCloseTo(50);
    expect(s(45)).toBeCloseTo(80);
    expect(s(55)).toBe(100);
    expect(s(70)).toBe(100);
    expect(s(35)).toBeCloseTo(60);
  });

  it('shifts anchors down 5% per older band', () => {
    const base = squatScore(profile({ ageBand: '25-34', tests: { squats60s: 45 } }))!;
    const older = squatScore(profile({ ageBand: '35-44', tests: { squats60s: 45 } }))!;
    const oldest = squatScore(profile({ ageBand: '65+', tests: { squats60s: 45 } }))!;
    expect(base).toBeCloseTo(80);
    expect(older).toBeGreaterThan(base);
    expect(oldest).toBeGreaterThan(older);
    expect(squatScore(profile({ ageBand: '18-24', tests: { squats60s: 45 } }))).toBeCloseTo(80);
  });
});

describe('plankScore', () => {
  it('follows the plank anchors and clamps at 180 s', () => {
    const p = (sec: number) => plankScore(profile({ tests: { plankSec: sec } }));
    expect(p(0)).toBe(0);
    expect(p(15)).toBeCloseTo(10);
    expect(p(30)).toBeCloseTo(30);
    expect(p(45)).toBeCloseTo(42.5);
    expect(p(60)).toBeCloseTo(55);
    expect(p(90)).toBeCloseTo(75);
    expect(p(120)).toBeCloseTo(90);
    expect(p(180)).toBe(100);
    expect(p(300)).toBe(100);
  });
});

describe('computeFitnessIndex', () => {
  it('computes the weighted index for a complete profile', () => {
    const r = computeFitnessIndex(profile());
    // pushups 52.08 × .3 + squats 60 × .25 + plank 55 × .2 + activity 70 × .15 + experience 35 × .1
    expect(r.index).toBe(56);
    expect(r.level).toBe(2);
    expect(r.components.squats).toBe(60);
    expect(r.components.plank).toBe(55);
    expect(r.components.activity).toBe(70);
    expect(r.components.experience).toBe(35);
    expect(r.missing).toEqual([]);
  });

  it('uses the weighted mean of present components when a test is missing', () => {
    const r = computeFitnessIndex(profile({ tests: { pushups: 20 } }));
    const expected = (52.0833 * 0.3 + 70 * 0.15 + 35 * 0.1) / 0.55;
    expect(r.index).toBe(Math.round(expected));
    expect(r.missing).toEqual(['squats', 'plank']);
    expect(r.components.squats).toBe(Math.round(expected));
  });

  it('caps the index at 60 when no self-test was performed', () => {
    const r = computeFitnessIndex(
      profile({ tests: {}, activityLevel: 'active', experience: 'advanced' }),
    );
    expect(r.index).toBe(60);
    expect(r.level).toBe(2);
    expect(r.missing).toEqual(['pushups', 'squats', 'plank']);
    const low = computeFitnessIndex(
      profile({ tests: {}, activityLevel: 'sedentary', experience: 'none' }),
    );
    expect(low.index).toBe(10);
    expect(low.level).toBe(1);
  });

  it('maps activity and experience to their fixed scores', () => {
    const r = computeFitnessIndex(profile({ activityLevel: 'sedentary', experience: 'advanced' }));
    expect(r.components.activity).toBe(10);
    expect(r.components.experience).toBe(100);
  });

  it('assigns levels at the documented thresholds', () => {
    expect(levelForIndex(0)).toBe(1);
    expect(levelForIndex(34)).toBe(1);
    expect(levelForIndex(35)).toBe(2);
    expect(levelForIndex(65)).toBe(2);
    expect(levelForIndex(66)).toBe(3);
    expect(levelForIndex(100)).toBe(3);
    const elite = computeFitnessIndex(
      profile({
        ageBand: '18-24',
        tests: { pushups: 45, squats60s: 60, plankSec: 200 },
        activityLevel: 'active',
        experience: 'advanced',
      }),
    );
    expect(elite.index).toBe(100);
    expect(elite.level).toBe(3);
  });

  it('never exceeds 0..100 with absurd inputs', () => {
    const r = computeFitnessIndex(
      profile({ tests: { pushups: 1000, squats60s: -5, plankSec: 99999 } }),
    );
    expect(r.index).toBeGreaterThanOrEqual(0);
    expect(r.index).toBeLessThanOrEqual(100);
    expect(r.components.squats).toBe(0);
  });
});

describe('initialScale', () => {
  it('maps 0..100 to 0.6..1.3 with two decimals', () => {
    expect(initialScale(0)).toBe(0.6);
    expect(initialScale(50)).toBe(0.95);
    expect(initialScale(100)).toBe(1.3);
    expect(initialScale(56)).toBe(0.99);
  });

  it('clamps out-of-range indexes', () => {
    expect(initialScale(-20)).toBe(0.6);
    expect(initialScale(140)).toBe(1.3);
    expect(initialScale(Number.NaN)).toBe(0.6);
  });
});
