import { describe, expect, it } from 'vitest';
import { EQUIPMENT } from '@/content/schema';
import {
  assessmentBenchmarks,
  assessmentDone,
  assessmentEmpty,
  clearDraft,
  draftToTrainingProfile,
  emptyDraft,
  firstIncompleteStep,
  isStepComplete,
  loadDraft,
  ONBOARDING_DRAFT_KEY,
  SELECTABLE_EQUIPMENT,
  parseIntField,
  parseWeightField,
  resumeStepIndex,
  saveDraft,
  STEP_IDS,
  toggleIn,
  WEIGHT_MAX_KG,
  WEIGHT_MIN_KG,
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
    assess: {
      later: false,
      onKnees: true,
      counts: {
        air_squat: 30,
        push_up: 12,
        sit_up: 20,
        reverse_lunge: 24,
        plank: 45,
      },
    },
    timePerSessionMin: 30,
    goal: 'general',
  };
}

/*
 * The picker's order is written by hand (draft.ts) because the schema's order serves the public
 * course filter and two admin selects instead. Hand-written means it can fall behind: add an
 * `Equipment` id to the schema, forget this list, and the option silently never appears in
 * onboarding — nothing throws and no other test notices.
 */
describe('SELECTABLE_EQUIPMENT', () => {
  it('offers every piece of equipment except the absence of it', () => {
    expect([...SELECTABLE_EQUIPMENT].sort()).toEqual(
      EQUIPMENT.filter((e) => e !== 'none')
        .slice()
        .sort(),
    );
  });

  it('asks first for the two things the beginners course actually needs', () => {
    expect(SELECTABLE_EQUIPMENT.slice(0, 2)).toEqual(['mat', 'chair']);
  });

  it('names each option once', () => {
    expect(new Set(SELECTABLE_EQUIPMENT).size).toBe(SELECTABLE_EQUIPMENT.length);
  });
});

describe('onboarding draft', () => {
  it('starts at step 0 with only the equipment step satisfied', () => {
    const d = emptyDraft();
    expect(d.step).toBe(0);
    expect(STEP_IDS.filter((s) => isStepComplete(d, s))).toEqual(['equipment']);
    expect(firstIncompleteStep(d)).toBe(0);
    expect(assessmentEmpty(d)).toBe(true);
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
    expect(firstIncompleteStep(d)).toBe(STEP_IDS.indexOf('name'));
    expect(firstIncompleteStep({ ...d, displayName: '  ' })).toBe(STEP_IDS.indexOf('name'));
    expect(firstIncompleteStep({ ...d, displayName: 'Настя' })).toBe(STEP_IDS.indexOf('basics'));
    expect(firstIncompleteStep(completeDraft())).toBe(STEP_IDS.indexOf('result'));
    expect(isStepComplete(completeDraft(), 'result')).toBe(true);
  });

  it('requires an explicit answer on limitations', () => {
    const d = emptyDraft();
    expect(isStepComplete(d, 'limitations')).toBe(false);
    expect(isStepComplete({ ...d, limitationsNone: true }, 'limitations')).toBe(true);
    expect(isStepComplete({ ...d, limitations: ['wrists'] }, 'limitations')).toBe(true);
  });

  it('completes the assessment step when every movement is counted, or it is postponed', () => {
    const d = emptyDraft();
    expect(isStepComplete(d, 'assess')).toBe(false);
    expect(assessmentDone(d)).toBe(false);
    // One movement short is not an answer: the engine reads the set, not the first of it.
    const partial = { ...d, assess: { ...d.assess, counts: { air_squat: 30 } } };
    expect(isStepComplete(partial, 'assess')).toBe(false);
    expect(isStepComplete({ ...d, assess: { ...d.assess, later: true } }, 'assess')).toBe(true);
    expect(isStepComplete(completeDraft(), 'assess')).toBe(true);
    expect(assessmentDone(completeDraft())).toBe(true);
    expect(assessmentEmpty(completeDraft())).toBe(false);
  });

  it('splits the assessment into engine inputs and personal records', () => {
    const p = draftToTrainingProfile(completeDraft());
    // The three the fitness index reads land in `tests`; the other two are benchmarks.
    expect(p?.tests).toEqual({ pushups: 12, pushupsOnKnees: true, squats60s: 30, plankSec: 45 });
    expect(assessmentBenchmarks(completeDraft())).toEqual({
      situps_60s: 20,
      lunges_60s: 24,
    });
    expect(assessmentBenchmarks(emptyDraft())).toEqual({});
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

  it('honours "no limitations" and a postponed assessment in the profile', () => {
    const base = completeDraft();
    const p = draftToTrainingProfile({
      ...base,
      limitations: ['knees'],
      limitationsNone: true,
      assess: { ...base.assess, later: true, counts: {} },
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

describe('parseWeightField', () => {
  it('accepts a weight inside the range, comma decimals included', () => {
    expect(parseWeightField('70')).toEqual({ weightKg: 70, invalid: false });
    expect(parseWeightField(' 62,5 ')).toEqual({ weightKg: 62.5, invalid: false });
    expect(parseWeightField('80.44')).toEqual({ weightKg: 80.4, invalid: false });
  });

  it('treats an empty field as "not answered", never as an error', () => {
    expect(parseWeightField('')).toEqual({ invalid: false });
    expect(parseWeightField('   ')).toEqual({ invalid: false });
  });

  it('reports out-of-range and non-numeric input without storing a weight', () => {
    expect(parseWeightField('7')).toEqual({ invalid: true });
    expect(parseWeightField(String(WEIGHT_MIN_KG - 1))).toEqual({ invalid: true });
    expect(parseWeightField(String(WEIGHT_MAX_KG + 1))).toEqual({ invalid: true });
    expect(parseWeightField('abc')).toEqual({ invalid: true });
  });

  it('keeps the range bounds themselves valid', () => {
    expect(parseWeightField(String(WEIGHT_MIN_KG)).weightKg).toBe(WEIGHT_MIN_KG);
    expect(parseWeightField(String(WEIGHT_MAX_KG)).weightKg).toBe(WEIGHT_MAX_KG);
  });
});

describe('resumeStepIndex', () => {
  it('maps "tests" to the assessment step and step ids to their index', () => {
    expect(resumeStepIndex('tests')).toBe(STEP_IDS.indexOf('assess'));
    expect(resumeStepIndex('goal')).toBe(STEP_IDS.indexOf('goal'));
    expect(resumeStepIndex('name')).toBe(0);
  });

  it('ignores a missing or unknown parameter', () => {
    expect(resumeStepIndex(null)).toBeNull();
    expect(resumeStepIndex(undefined)).toBeNull();
    expect(resumeStepIndex('')).toBeNull();
    expect(resumeStepIndex('nope')).toBeNull();
  });
});
