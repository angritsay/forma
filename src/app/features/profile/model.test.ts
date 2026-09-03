import { describe, expect, it } from 'vitest';
import type { Profile } from '@/lib/api/types';
import type { UserTrainingProfile } from '@/lib/training/types';
import { firstIncompleteStep, isStepComplete } from '@/app/screens/onboarding/draft';
import {
  fitnessOf,
  newAvatarSeed,
  profileToDraft,
  TESTS_STEP_INDEX,
  withEquipment,
  withLimitations,
} from './model';

const TP: UserTrainingProfile = {
  ageBand: '25-34',
  sex: 'male',
  weightKg: 78,
  activityLevel: 'light',
  experience: 'beginner',
  tests: { pushups: 20, squats60s: 35, plankSec: 60 },
  limitations: ['knees'],
  equipment: ['dumbbells', 'jump_rope'],
  dumbbellKg: [4, 8],
  timePerSessionMin: 30,
  goal: 'fat_loss',
};

const PROFILE: Profile = {
  id: 'u1',
  email: 'a@example.com',
  displayName: 'Ann',
  avatarSeed: 'seed',
  locale: 'ru',
  trainingProfile: TP,
  fitnessIndex: 48,
  fitnessLevel: 2,
  onboardedAt: '2026-01-01T00:00:00Z',
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-01T00:00:00Z',
};

describe('newAvatarSeed', () => {
  it('returns 16 hex chars and varies between calls', () => {
    const a = newAvatarSeed();
    const b = newAvatarSeed();
    expect(a).toMatch(/^[0-9a-f]{16}$/);
    expect(a).not.toBe(b);
  });
});

describe('fitnessOf', () => {
  it('uses the stored index and level, else recomputes from the training profile', () => {
    expect(fitnessOf(PROFILE)).toEqual({ index: 48, level: 2 });
    const computed = fitnessOf({ fitnessIndex: null, fitnessLevel: null, trainingProfile: TP });
    expect(computed).not.toBeNull();
    expect(computed!.index).toBeGreaterThan(0);
    expect([1, 2, 3]).toContain(computed!.level);
    expect(fitnessOf({ fitnessIndex: null, fitnessLevel: null, trainingProfile: null })).toBeNull();
  });
});

describe('withEquipment / withLimitations', () => {
  it('normalizes equipment and keeps weights only for ticked gear', () => {
    const next = withEquipment(TP, ['kettlebell', 'kettlebell', 'mat'], [8], [16, 12, 16]);
    expect(next.equipment).toEqual(['kettlebell', 'mat']);
    expect(next.dumbbellKg).toBeUndefined();
    expect(next.kettlebellKg).toEqual([12, 16]);
    expect(withEquipment(TP, [], [4], []).equipment).toEqual(['none']);
    expect(withEquipment(TP, ['dumbbells'], [], []).dumbbellKg).toBeUndefined();
    expect(TP.dumbbellKg).toEqual([4, 8]); // input untouched
  });

  it('deduplicates limitations', () => {
    expect(withLimitations(TP, ['wrists', 'wrists', 'knees']).limitations).toEqual([
      'wrists',
      'knees',
    ]);
    expect(withLimitations(TP, []).limitations).toEqual([]);
  });
});

describe('profileToDraft', () => {
  it('builds a draft that resumes at the first self-test with everything else complete', () => {
    const draft = profileToDraft(PROFILE, 'en');
    expect(draft).not.toBeNull();
    expect(draft!.step).toBe(TESTS_STEP_INDEX);
    expect(firstIncompleteStep(draft!)).toBe(TESTS_STEP_INDEX);
    expect(isStepComplete(draft!, 'testPushups')).toBe(false);
    expect(draft).toMatchObject({
      locale: 'en',
      displayName: 'Ann',
      ageBand: '25-34',
      equipment: ['dumbbells', 'jump_rope'],
      dumbbellKg: [4, 8],
      limitations: ['knees'],
      limitationsNone: false,
      timePerSessionMin: 30,
      goal: 'fat_loss',
      tests: {},
    });
  });

  it('marks "no limitations" explicitly and returns null without a training profile', () => {
    const draft = profileToDraft(
      { ...PROFILE, trainingProfile: { ...TP, limitations: [], equipment: ['none'] } },
      'ru',
    );
    expect(draft).toMatchObject({ limitationsNone: true, equipment: [] });
    expect(profileToDraft({ ...PROFILE, trainingProfile: null }, 'ru')).toBeNull();
  });
});
