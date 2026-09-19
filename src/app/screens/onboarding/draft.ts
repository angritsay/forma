/**
 * Onboarding wizard state (docs/SPEC.md §10 flow 2), persisted in sessionStorage so a reload
 * resumes where the user left off. Pure module: no React, testable in node.
 *
 * **Five questions.** The owner's instruction was «убрать все лишнее в онбординге и особенно
 * оттуда убрать тестирование» — so what is asked before the first workout is a name, an age, a
 * sex, what to protect, and one slider for how much the person trains today. Everything else the
 * wizard used to collect (minutes per session, goal, activity, experience, equipment, and the
 * self-test) either left the product or left this screen: the test is `/assessment` now and is
 * offered after the second completed workout (src/app/features/assessment).
 *
 * **What the profile no longer claims.** `draftToTrainingProfile` builds a real
 * `UserTrainingProfile` from five answers, and it does not invent the answers it was not given:
 * `timePerSessionMin` and `goal` are left unset (both are optional on the type and nothing in the
 * engine reads them), `tests` is empty until the assessment fills it, and no fitness index is
 * computed or stored — the index is a measurement, and nothing here measures anything.
 * `activityLevel` and `experience` *are* derived from the level slider, because the slider asks
 * exactly what those two fields hold: how much and how long this person trains, in their own
 * words. See LEVEL_ACTIVITY / LEVEL_EXPERIENCE for the mapping and what it does and does not say.
 */
import { z } from 'zod';
import type { Equipment, Locale } from '@/content/schema';
import type {
  ActivityLevel,
  AgeBand,
  Experience,
  Limitation,
  Sex,
  UserTrainingProfile,
} from '@/lib/training/types';

export const ONBOARDING_DRAFT_KEY = 'forma.onboarding';

/**
 * The five screens, in order. One question each — the counter in the header is
 * `STEP_IDS.length`, so «01/05» follows this array rather than a written-down number.
 *
 * Age and sex used to share one screen («Немного о тебе») with an optional weight field beside
 * them. Three answers under one question is the thing §10 keeps removing, and the weight was the
 * clearest case of it: nothing asked for it before the first workout — the calorie estimate falls
 * back to DEFAULT_WEIGHT_KG — so it was a field collected because it was easy to collect.
 */
export const STEP_IDS = ['name', 'age', 'sex', 'limitations', 'level'] as const;
export type StepId = (typeof STEP_IDS)[number];

export const AGE_BANDS = [
  '18-24',
  '25-34',
  '35-44',
  '45-54',
  '55-64',
  '65+',
] as const satisfies readonly AgeBand[];
export const SEXES = ['male', 'female', 'na'] as const satisfies readonly Sex[];
export const LIMITATIONS = [
  'knees',
  'lower_back',
  'shoulders',
  'wrists',
  'hypertension',
  'pregnancy',
] as const satisfies readonly Limitation[];

/** Dumbbell / kettlebell weight chips, kg (the profile's equipment sheet; not asked here). */
export const WEIGHT_OPTIONS_KG = [2, 4, 6, 8, 10, 12, 16, 20, 24] as const;
/**
 * Equipment the athlete can tick ("none" is implied by an empty selection), in the order it is
 * offered.
 *
 * It is no longer asked during onboarding — the equipment question was one of the six the owner
 * cut — but the list survives here because the profile's equipment sheet still offers it, and
 * because the order is written for the person answering rather than for the course filter and the
 * two admin selects that `EQUIPMENT` in src/content/schema.ts serves: what nearly everyone
 * already owns first, what belongs to someone who already trains last.
 */
export const SELECTABLE_EQUIPMENT: readonly Equipment[] = [
  'mat',
  'chair',
  'box',
  'dumbbells',
  'kettlebell',
  'bands',
  'jump_rope',
  'pullup_bar',
];

export const NAME_MAX = 40;

/**
 * How long the «Другое» note may be.
 *
 * Long enough for a sentence about a shoulder and an old operation, short enough that the field
 * stays a field and does not become a place to write a medical history into a form nobody
 * promised to read as one.
 */
export const LIMITATION_NOTE_MAX = 200;

/** The level slider's ends. Ten notches, because ten is the scale the whole product asks on. */
export const LEVEL_MIN = 1;
export const LEVEL_MAX = 10;

/**
 * Level → activity level, and level → experience.
 *
 * The slider asks one question — how much do you train now — and its ten labels
 * (`app.onbLevel01…10`) are sentences about exactly that: «Давно не тренировался» at 1,
 * «Тренируюсь много лет» at 10. Two of the engine's fields hold that same fact, so they are read
 * off it rather than asked again. What this is *not* is a measurement: it feeds the two
 * self-reported components of the fitness index (`ACTIVITY_SCORE`, `EXPERIENCE_SCORE`), which is
 * why an index built from it alone stays capped at `NO_TEST_INDEX_CAP` until the assessment
 * supplies a real count. Index 0 of each array is level 1.
 */
export const LEVEL_ACTIVITY: readonly ActivityLevel[] = [
  'sedentary',
  'sedentary',
  'light',
  'light',
  'light',
  'moderate',
  'moderate',
  'moderate',
  'active',
  'active',
];

export const LEVEL_EXPERIENCE: readonly Experience[] = [
  'none',
  'none',
  'none',
  'beginner',
  'beginner',
  'beginner',
  'intermediate',
  'intermediate',
  'intermediate',
  'advanced',
];

export const DraftSchema = z.object({
  step: z
    .number()
    .int()
    .min(0)
    .max(STEP_IDS.length - 1)
    .default(0),
  locale: z.enum(['ru', 'en']).optional(),
  displayName: z.string().max(NAME_MAX).optional(),
  ageBand: z.enum(AGE_BANDS).optional(),
  sex: z.enum(SEXES).optional(),
  limitations: z.array(z.enum(LIMITATIONS)).default([]),
  /** Explicit "nothing to protect" answer (distinct from "not answered yet"). */
  limitationsNone: z.boolean().default(false),
  /**
   * Agreement to hold what the limitations say.
   *
   * Гипертония and беременность are «состояние здоровья», which 152-ФЗ ст. 10 makes a special
   * category: processing it is allowed on a consent given knowingly and separately from everything
   * else. So it is its own answer rather than a clause folded into the sign-in — and
   * `isStepComplete` only asks for it once a limitation has actually been picked, because «ничего,
   * всё в порядке» collects no health data and so needs no permission to hold any.
   */
  healthConsent: z.boolean().default(false),
  /**
   * «Другое» — whether the free-text answer is open, and what is written in it.
   *
   * The six plates are the limitations the engine knows how to work around, and the list is closed
   * because each one maps to a substitution rule. A neck, an ankle, an old operation fit none of
   * them, and a question that cannot hold the answer somebody has teaches them the app is not for
   * them. So: a seventh plate that opens a field.
   *
   * **What it does and does not do.** The text is stored on the profile as `limitationsNote`, and
   * the coach reads it. Nothing parses it and no exercise is substituted because of it. That is
   * the honest boundary — a substitution triggered by guessing at free text would be worse than
   * none — and the hint under the field says so on the screen, so nobody writes «болит шея» and
   * then trains believing the workouts have changed.
   */
  limitationsOtherOn: z.boolean().default(false),
  limitationsOther: z.string().max(LIMITATION_NOTE_MAX).default(''),
  /** 1..10 from the slider; undefined until the handle is touched. */
  level: z.number().int().min(LEVEL_MIN).max(LEVEL_MAX).optional(),
});

export type OnboardingDraft = z.infer<typeof DraftSchema>;

export function emptyDraft(): OnboardingDraft {
  return DraftSchema.parse({});
}

interface StorageLike {
  getItem: (key: string) => string | null;
  setItem: (key: string, value: string) => void;
  removeItem: (key: string) => void;
}

function defaultStorage(): StorageLike | null {
  try {
    return typeof sessionStorage !== 'undefined' ? sessionStorage : null;
  } catch {
    return null;
  }
}

/** Read the persisted draft; invalid or missing data yields an empty draft. */
export function loadDraft(storage: StorageLike | null = defaultStorage()): OnboardingDraft {
  try {
    const raw = storage?.getItem(ONBOARDING_DRAFT_KEY);
    if (!raw) return emptyDraft();
    const parsed = DraftSchema.safeParse(JSON.parse(raw));
    return parsed.success ? parsed.data : emptyDraft();
  } catch {
    return emptyDraft();
  }
}

export function saveDraft(
  draft: OnboardingDraft,
  storage: StorageLike | null = defaultStorage(),
): void {
  try {
    storage?.setItem(ONBOARDING_DRAFT_KEY, JSON.stringify(draft));
  } catch {
    /* Storage full or unavailable: the wizard still works in memory. */
  }
}

export function clearDraft(storage: StorageLike | null = defaultStorage()): void {
  try {
    storage?.removeItem(ONBOARDING_DRAFT_KEY);
  } catch {
    /* ignore */
  }
}

export function isValidName(name: string | undefined): boolean {
  const n = (name ?? '').trim();
  return n.length >= 1 && n.length <= NAME_MAX;
}

/** The free-text answer as it will be stored: trimmed, and empty when the plate is not open. */
export function limitationNote(d: OnboardingDraft): string {
  return d.limitationsOtherOn ? d.limitationsOther.trim() : '';
}

/** Something was said about health: a plate, a written note, or both. */
function namesSomething(d: OnboardingDraft): boolean {
  return d.limitations.length > 0 || limitationNote(d).length > 0;
}

/** Whether a step has everything it needs for «Далее». */
export function isStepComplete(d: OnboardingDraft, step: StepId): boolean {
  switch (step) {
    case 'name':
      return isValidName(d.displayName);
    case 'age':
      return d.ageBand !== undefined;
    case 'sex':
      return d.sex !== undefined;
    case 'limitations':
      // Naming a limitation is handing over health data, so «Далее» waits for the consent as well
      // as for the answer. «Ничего, всё в порядке» hands over nothing and waits for nothing.
      //
      // An open «Другое» with an empty field is not an answer — the plate was pressed and nothing
      // was written — so it neither completes the step nor blocks a plate picked beside it.
      return d.limitationsNone || (namesSomething(d) && d.healthConsent);
    case 'level':
      return d.level !== undefined;
  }
}

/** Every question has an answer. */
export function isDraftComplete(d: OnboardingDraft): boolean {
  return STEP_IDS.every((s) => isStepComplete(d, s));
}

/** Index of the first step that is not complete (the last step when everything is done). */
export function firstIncompleteStep(d: OnboardingDraft): number {
  const i = STEP_IDS.findIndex((s) => !isStepComplete(d, s));
  return i === -1 ? STEP_IDS.length - 1 : i;
}

/**
 * Build the engine profile; null while a required answer is missing.
 *
 * `equipment: ['none']` is what an unanswered equipment question has always produced (the old
 * step stored an empty tick list the same way), and it is the conservative reading: `prescribe`
 * treats `none` and `mat` as always available and walks `scaling.easier` for anything that needs
 * more, so an athlete who does own dumbbells is given a workout they can do rather than one they
 * cannot. The profile's equipment sheet is where that answer is corrected.
 */
export function draftToTrainingProfile(d: OnboardingDraft): UserTrainingProfile | null {
  if (!d.ageBand || !d.sex || d.level === undefined) return null;
  const i = Math.min(LEVEL_MAX, Math.max(LEVEL_MIN, d.level)) - 1;
  // Absent rather than empty when nothing was written: the profile should not carry a key that
  // says «this person told us about their health» with nothing behind it.
  const note = d.limitationsNone ? '' : limitationNote(d);
  return {
    ageBand: d.ageBand,
    sex: d.sex,
    activityLevel: LEVEL_ACTIVITY[i] ?? 'sedentary',
    experience: LEVEL_EXPERIENCE[i] ?? 'none',
    tests: {},
    limitations: d.limitationsNone ? [] : [...d.limitations],
    ...(note ? { limitationsNote: note } : {}),
    equipment: ['none'],
  };
}

/**
 * Step index a `?step=` query parameter asks the wizard to resume at, or null when the parameter
 * is missing or unknown. The caller still clamps it to the first incomplete step, so it can never
 * skip an unanswered question.
 *
 * `tests` used to be an alias for the self-test step. The self-test is a screen of its own now
 * (`/assessment`), so the alias resolves to nothing rather than to some other question: an old
 * link simply resumes the wizard where the athlete left it.
 */
export function resumeStepIndex(param: string | null | undefined): number | null {
  if (!param) return null;
  const i = (STEP_IDS as readonly string[]).indexOf(param);
  return i >= 0 ? i : null;
}

/** Toggle a value in a list (immutable). */
export function toggleIn<T>(list: readonly T[], value: T): T[] {
  return list.includes(value) ? list.filter((x) => x !== value) : [...list, value];
}

export type { Locale };
