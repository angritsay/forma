import { describe, expect, it } from 'vitest';
import { EQUIPMENT } from '@/content/schema';
import {
  clearDraft,
  draftToTrainingProfile,
  emptyDraft,
  firstIncompleteStep,
  isDraftComplete,
  isStepComplete,
  LEVEL_ACTIVITY,
  LEVEL_EXPERIENCE,
  LEVEL_MAX,
  LEVEL_MIN,
  loadDraft,
  ONBOARDING_DRAFT_KEY,
  resumeStepIndex,
  saveDraft,
  SELECTABLE_EQUIPMENT,
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
    limitations: ['knees'],
    // A draft that names a limitation is complete only once the health consent is given with it:
    // that is the rule `isStepComplete` now enforces, so the "everything answered" fixture has to
    // carry it or it stops meaning what its name says.
    healthConsent: true,
    level: 6,
  };
}

/*
 * The owner asked for five questions and nothing else, and «01/05» in the header is drawn from
 * this array rather than written down — so a sixth step added later would change the counter
 * silently, and this is what says no.
 */
describe('STEP_IDS', () => {
  it('is five questions, in the order the owner asked for them', () => {
    expect(STEP_IDS).toEqual(['name', 'age', 'sex', 'limitations', 'level']);
  });
});

/*
 * The picker's order is written by hand (draft.ts) because the schema's order serves the public
 * course filter and two admin selects instead. Hand-written means it can fall behind: add an
 * `Equipment` id to the schema, forget this list, and the option silently never appears in the
 * profile's equipment sheet — nothing throws and no other test notices.
 */
describe('SELECTABLE_EQUIPMENT', () => {
  it('offers every piece of equipment except the absence of it', () => {
    expect([...SELECTABLE_EQUIPMENT].sort()).toEqual(
      EQUIPMENT.filter((e) => e !== 'none')
        .slice()
        .sort(),
    );
  });
});

describe('draft persistence', () => {
  it('round-trips through storage and ignores corrupt data', () => {
    const s = memoryStorage();
    saveDraft(completeDraft(), s);
    expect(loadDraft(s)).toEqual(completeDraft());
    s.raw.set(ONBOARDING_DRAFT_KEY, '{not json');
    expect(loadDraft(s)).toEqual(emptyDraft());
    s.raw.set(ONBOARDING_DRAFT_KEY, JSON.stringify({ level: 99 }));
    expect(loadDraft(s)).toEqual(emptyDraft());
    clearDraft(s);
    expect(s.raw.size).toBe(0);
  });

  it('survives storage being unavailable', () => {
    expect(() => saveDraft(completeDraft(), null)).not.toThrow();
    expect(loadDraft(null)).toEqual(emptyDraft());
  });
});

describe('isStepComplete / firstIncompleteStep', () => {
  it('requires an answer to every one of the five', () => {
    const d = emptyDraft();
    expect(STEP_IDS.filter((s) => isStepComplete(d, s))).toEqual([]);
    expect(firstIncompleteStep(d)).toBe(0);
    expect(isDraftComplete(d)).toBe(false);
  });

  it('accepts «ничего, всё в порядке» as an answer about limitations', () => {
    const d = { ...emptyDraft(), limitationsNone: true };
    expect(isStepComplete(d, 'limitations')).toBe(true);
  });

  /*
   * Naming a limitation is handing over data about health, which 152-ФЗ ст. 10 puts in a special
   * category that needs its own consent — so the answer alone no longer opens «Далее». Answering
   * «ничего» hands over nothing and is unaffected, which is the other half of the rule and the
   * reason the checkbox is not simply always on screen.
   */
  it('holds «Далее» until a named limitation is consented to', () => {
    const named = { ...emptyDraft(), limitations: ['wrists' as const] };
    expect(isStepComplete(named, 'limitations')).toBe(false);
    expect(isStepComplete({ ...named, healthConsent: true }, 'limitations')).toBe(true);
    // And the consent on its own is not an answer: there is still nothing selected.
    expect(isStepComplete({ ...emptyDraft(), healthConsent: true }, 'limitations')).toBe(false);
  });

  /*
   * «Другое» is an answer like any plate — and an open field with nothing written in it is not
   * one. The empty case is the one worth writing down: pressing the plate must not complete the
   * step on its own, or somebody taps it, writes nothing, and hands the coach a blank note.
   */
  it('treats a written «Другое» as an answer and an empty one as nothing', () => {
    const base = { ...emptyDraft(), healthConsent: true };
    expect(isStepComplete({ ...base, limitationsOtherOn: true }, 'limitations')).toBe(false);
    expect(
      isStepComplete({ ...base, limitationsOtherOn: true, limitationsOther: '   ' }, 'limitations'),
    ).toBe(false);
    expect(
      isStepComplete({ ...base, limitationsOtherOn: true, limitationsOther: 'шея' }, 'limitations'),
    ).toBe(true);
    // Written, then the plate closed again: the text is no longer being offered, so it is not an
    // answer — and `limitationNote` agrees, which is what keeps it off the profile.
    expect(
      isStepComplete(
        { ...base, limitationsOtherOn: false, limitationsOther: 'шея' },
        'limitations',
      ),
    ).toBe(false);
    // It needs the same consent a plate does, because it is the same kind of data.
    expect(
      isStepComplete(
        { ...emptyDraft(), limitationsOtherOn: true, limitationsOther: 'шея' },
        'limitations',
      ),
    ).toBe(false);
  });

  it('carries the written note onto the profile, and nothing when there is none', () => {
    const d = { ...completeDraft(), limitationsOtherOn: true, limitationsOther: '  шея  ' };
    expect(draftToTrainingProfile(d)!.limitationsNote).toBe('шея');
    // The key is absent rather than empty: a profile should not say "told us about their health"
    // with nothing behind it.
    expect(draftToTrainingProfile(completeDraft())).not.toHaveProperty('limitationsNote');
    // «Ничего, всё в порядке» wins over anything left in the field.
    expect(draftToTrainingProfile({ ...d, limitationsNone: true })).not.toHaveProperty(
      'limitationsNote',
    );
  });

  it('rejects a blank name and stops at the last step when everything is answered', () => {
    expect(isStepComplete({ ...completeDraft(), displayName: '   ' }, 'name')).toBe(false);
    expect(isDraftComplete(completeDraft())).toBe(true);
    expect(firstIncompleteStep(completeDraft())).toBe(STEP_IDS.length - 1);
  });

  it('walks forward one unanswered question at a time', () => {
    const d = completeDraft();
    expect(firstIncompleteStep({ ...d, ageBand: undefined })).toBe(STEP_IDS.indexOf('age'));
    expect(firstIncompleteStep({ ...d, sex: undefined })).toBe(STEP_IDS.indexOf('sex'));
    expect(firstIncompleteStep({ ...d, level: undefined })).toBe(STEP_IDS.indexOf('level'));
  });
});

describe('resumeStepIndex', () => {
  it('resolves a step id and nothing else', () => {
    expect(resumeStepIndex('level')).toBe(STEP_IDS.indexOf('level'));
    expect(resumeStepIndex(null)).toBeNull();
    expect(resumeStepIndex('')).toBeNull();
    // The self-test left the wizard; an old «?step=tests» link resumes where the athlete was.
    expect(resumeStepIndex('tests')).toBeNull();
    expect(resumeStepIndex('nope')).toBeNull();
  });
});

describe('draftToTrainingProfile', () => {
  it('is null while a required answer is missing', () => {
    expect(draftToTrainingProfile(emptyDraft())).toBeNull();
    expect(draftToTrainingProfile({ ...completeDraft(), level: undefined })).toBeNull();
  });

  /*
   * The point of the whole change: three of the engine's fields are answered, two are derived from
   * the slider, and the ones nobody was asked about are absent rather than invented.
   */
  it('builds a profile that claims only what was asked', () => {
    const p = draftToTrainingProfile(completeDraft());
    expect(p).not.toBeNull();
    expect(p!.ageBand).toBe('25-34');
    expect(p!.sex).toBe('female');
    expect(p!.limitations).toEqual(['knees']);
    expect(p!.tests).toEqual({});
    expect(p!.equipment).toEqual(['none']);
    expect(p!.timePerSessionMin).toBeUndefined();
    expect(p!.goal).toBeUndefined();
  });

  it('reads the activity level and the experience off the slider', () => {
    const at = (level: number) => draftToTrainingProfile({ ...completeDraft(), level })!;
    expect(at(LEVEL_MIN).activityLevel).toBe('sedentary');
    expect(at(LEVEL_MIN).experience).toBe('none');
    expect(at(LEVEL_MAX).activityLevel).toBe('active');
    expect(at(LEVEL_MAX).experience).toBe('advanced');
  });

  it('clears the limitations when «ничего» was the answer', () => {
    const p = draftToTrainingProfile({
      ...completeDraft(),
      limitations: ['knees'],
      limitationsNone: true,
    })!;
    expect(p.limitations).toEqual([]);
  });
});

/* Ten notches, ten answers: an unmapped notch would silently fall back to «не тренируюсь». */
describe('level mapping', () => {
  it('covers every notch of the slider and never goes backwards', () => {
    expect(LEVEL_ACTIVITY).toHaveLength(LEVEL_MAX - LEVEL_MIN + 1);
    expect(LEVEL_EXPERIENCE).toHaveLength(LEVEL_MAX - LEVEL_MIN + 1);
    const activityRank = ['sedentary', 'light', 'moderate', 'active'];
    const experienceRank = ['none', 'beginner', 'intermediate', 'advanced'];
    for (let i = 1; i < LEVEL_ACTIVITY.length; i++) {
      expect(activityRank.indexOf(LEVEL_ACTIVITY[i]!)).toBeGreaterThanOrEqual(
        activityRank.indexOf(LEVEL_ACTIVITY[i - 1]!),
      );
      expect(experienceRank.indexOf(LEVEL_EXPERIENCE[i]!)).toBeGreaterThanOrEqual(
        experienceRank.indexOf(LEVEL_EXPERIENCE[i - 1]!),
      );
    }
  });
});

describe('toggleIn', () => {
  it('adds what is missing and removes what is there', () => {
    expect(toggleIn(['a'], 'b')).toEqual(['a', 'b']);
    expect(toggleIn(['a', 'b'], 'a')).toEqual(['b']);
  });
});
