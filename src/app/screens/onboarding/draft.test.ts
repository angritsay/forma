import { describe, expect, it } from 'vitest';
import {
  allTestsSkipped,
  clearDraft,
  draftToTrainingProfile,
  emptyDraft,
  firstIncompleteStep,
  isStepComplete,
  loadDraft,
  ONBOARDING_DRAFT_KEY,
  parseIntField,
  saveDraft,
  STEP_IDS,
  toggleIn,
  type OnboardingDraft,
} from './draft';

function memoryStorage() {
  const m = new Map<string, string>();
  return {
    getItem: (k: string) => m.get(k) ?? null,
    setItem: (k: string, v: string) => void m.set(k, v),
    removeItem: (k: string) => void m.delete(k),
    raw: m,
  };
}

function completeDraft(): OnboardingDraft {
  return {
    ...emptyDraft(),
    locale: 'ru',
    displayName: 'Аня',
    ageBand: '25-34',
    sex: 'female',
    weightKg: 62,
    activityLevel: 'light',
    experience: 'beginner',
    equipment: ['dumbbells', 'mat'],
    dumbbellKg: [8, 4],
    kettlebellKg: [16],
    limitations: ['knees'],
    tests: { pushups: 12, pushupsOnKnees: true, squats60s: 30, plankSec: 45 },
    skipped: {},
    timePerSessionMin: 30,
    goal: 'general',
  };
}

describe('onboarding draft', () => {
  it('starts at step 0 with only the equipment step satisfied', () => {
    const d = emptyDraft();
    expect(d.step).toBe(0);
    expect(STEP_IDS.filter((s) => isStepComplete(d, s))).toEqual(['equipment']);
    expect(firstIncompleteStep(d)).toBe(0);
    expect(allTestsSkipped(d)).toBe(true);
  });

  it('round-trips through storage and clears', () => {
    const storage = memoryStorage();
    const d = { ...completeDraft(), step: 5 };
    saveDraft(d, storage);
    expect(storage.raw.has(ONBOARDING_DRAFT_KEY)).toBe(true);
    expect(loadDraft(storage)).toEqual(d);
    clearDraft(storage);
    expect(loadDraft(storage)).toEqual(emptyDraft());
  });

  it('falls back to an empty draft on corrupted or out-of-range data', () => {
    const storage = memoryStorage();
    storage.setItem(ONBOARDING_DRAFT_KEY, '{not json');
    expect(loadDraft(storage)).toEqual(emptyDraft());
    storage.setItem(ONBOARDING_DRAFT_KEY, JSON.stringify({ step: 99, ageBand: '12-17' }));
    expect(loadDraft(storage)).toEqual(emptyDraft());
    expect(loadDraft(null)).toEqual(emptyDraft());
  });

  it('walks the wizard step by step', () => {
    const d = emptyDraft();
    expect(firstIncompleteStep({ ...d, locale: 'en' })).toBe(STEP_IDS.indexOf('name'));
    expect(firstIncompleteStep({ ...d, locale: 'en', displayName: '  ' })).toBe(
      STEP_IDS.indexOf('name'),
    );
    expect(firstIncompleteStep({ ...d, locale: 'en', displayName: 'Sam' })).toBe(
      STEP_IDS.indexOf('basics'),
    );
    expect(firstIncompleteStep(completeDraft())).toBe(STEP_IDS.indexOf('result'));
    expect(isStepComplete(completeDraft(), 'result')).toBe(true);
  });

  it('requires an explicit answer on limitations', () => {
    const d = emptyDraft();
    expect(isStepComplete(d, 'limitations')).toBe(false);
    expect(isStepComplete({ ...d, limitationsNone: true }, 'limitations')).toBe(true);
    expect(isStepComplete({ ...d, limitations: ['wrists'] }, 'limitations')).toBe(true);
  });

  it('treats a self-test as complete when answered or skipped', () => {
    const d = emptyDraft();
    expect(isStepComplete(d, 'testPushups')).toBe(false);
    expect(isStepComplete({ ...d, skipped: { pushups: true } }, 'testPushups')).toBe(true);
    expect(isStepComplete({ ...d, tests: { pushups: 0 } }, 'testPushups')).toBe(true);
    expect(isStepComplete({ ...d, tests: { squats60s: 25 } }, 'testSquats')).toBe(true);
    expect(isStepComplete({ ...d, skipped: { plank: true } }, 'testPlank')).toBe(true);
  });

  it('builds the engine profile only when required answers exist', () => {
    expect(draftToTrainingProfile(emptyDraft())).toBeNull();
    expect(draftToTrainingProfile({ ...completeDraft(), goal: undefined })).toBeNull();
    const p = draftToTrainingProfile(completeDraft());
    expect(p).toMatchObject({
      ageBand: '25-34',
      sex: 'female',
      weightKg: 62,
      activityLevel: 'light',
      experience: 'beginner',
      limitations: ['knees'],
      equipment: ['dumbbells', 'mat'],
      timePerSessionMin: 30,
      goal: 'general',
      tests: { pushups: 12, pushupsOnKnees: true, squats60s: 30, plankSec: 45 },
    });
  });

  it('sorts weights and drops them for unselected equipment', () => {
    const p = draftToTrainingProfile(completeDraft());
    expect(p?.dumbbellKg).toEqual([4, 8]);
    expect(p?.kettlebellKg).toBeUndefined();
    const none = draftToTrainingProfile({ ...completeDraft(), equipment: [], dumbbellKg: [8] });
    expect(none?.equipment).toEqual(['none']);
    expect(none?.dumbbellKg).toBeUndefined();
  });

  it('honours "no limitations" and skipped tests in the profile', () => {
    const p = draftToTrainingProfile({
      ...completeDraft(),
      limitations: ['knees'],
      limitationsNone: true,
      tests: { pushupsOnKnees: true },
    });
    expect(p?.limitations).toEqual([]);
    expect(p?.tests).toEqual({});
    expect(p?.weightKg).toBe(62);
  });

  it('parses numeric fields defensively', () => {
    expect(parseIntField('', 100)).toBeUndefined();
    expect(parseIntField('abc', 100)).toBeUndefined();
    expect(parseIntField('-3', 100)).toBeUndefined();
    expect(parseIntField('12.9', 100)).toBe(12);
    expect(parseIntField('999', 100)).toBe(100);
  });

  it('toggles values immutably', () => {
    const list = ['a', 'b'];
    expect(toggleIn(list, 'c')).toEqual(['a', 'b', 'c']);
    expect(toggleIn(list, 'a')).toEqual(['b']);
    expect(list).toEqual(['a', 'b']);
  });
});
