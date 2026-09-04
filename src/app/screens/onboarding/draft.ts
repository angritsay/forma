/**
 * Onboarding wizard state (docs/SPEC.md §10 flow 2), persisted in sessionStorage so a reload
 * resumes where the user left off. Pure module: no React, testable in node.
 */
import { z } from 'zod';
import { EQUIPMENT, type Equipment, type Locale } from '@/content/schema';
import type {
  ActivityLevel,
  AgeBand,
  Experience,
  Goal,
  Limitation,
  SessionTime,
  Sex,
  UserTrainingProfile,
} from '@/lib/training/types';

export const ONBOARDING_DRAFT_KEY = 'forma.onboarding';

export const STEP_IDS = [
  'language',
  'name',
  'basics',
  'activity',
  'experience',
  'equipment',
  'limitations',
  'testPushups',
  'testSquats',
  'testPlank',
  'time',
  'goal',
  'result',
] as const;
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
export const ACTIVITY_LEVELS = [
  'sedentary',
  'light',
  'moderate',
  'active',
] as const satisfies readonly ActivityLevel[];
export const EXPERIENCES = [
  'none',
  'beginner',
  'intermediate',
  'advanced',
] as const satisfies readonly Experience[];
export const LIMITATIONS = [
  'knees',
  'lower_back',
  'shoulders',
  'wrists',
  'hypertension',
  'pregnancy',
] as const satisfies readonly Limitation[];
export const GOALS = [
  'fat_loss',
  'strength',
  'endurance',
  'general',
  'muscle',
] as const satisfies readonly Goal[];
export const SESSION_TIMES = [15, 20, 30, 45, 60] as const satisfies readonly SessionTime[];
/** Dumbbell / kettlebell weight chips, kg. */
export const WEIGHT_OPTIONS_KG = [2, 4, 6, 8, 10, 12, 16, 20, 24] as const;
/** Equipment the user can tick ("none" is implied by an empty selection). */
export const SELECTABLE_EQUIPMENT: readonly Equipment[] = EQUIPMENT.filter((e) => e !== 'none');

export const NAME_MAX = 40;
export const WEIGHT_MIN_KG = 30;
export const WEIGHT_MAX_KG = 250;
export const REPS_MAX = 500;
export const PLANK_MAX_SEC = 3600;

const TestsSchema = z.object({
  pushups: z.number().int().min(0).max(REPS_MAX).optional(),
  pushupsOnKnees: z.boolean().optional(),
  squats60s: z.number().int().min(0).max(REPS_MAX).optional(),
  plankSec: z.number().int().min(0).max(PLANK_MAX_SEC).optional(),
});

const SkippedSchema = z.object({
  pushups: z.boolean().optional(),
  squats: z.boolean().optional(),
  plank: z.boolean().optional(),
});

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
  weightKg: z.number().min(WEIGHT_MIN_KG).max(WEIGHT_MAX_KG).optional(),
  activityLevel: z.enum(ACTIVITY_LEVELS).optional(),
  experience: z.enum(EXPERIENCES).optional(),
  equipment: z.array(z.enum(EQUIPMENT)).default([]),
  dumbbellKg: z.array(z.number().positive()).default([]),
  kettlebellKg: z.array(z.number().positive()).default([]),
  limitations: z.array(z.enum(LIMITATIONS)).default([]),
  /** Explicit "nothing to protect" answer (distinct from "not answered yet"). */
  limitationsNone: z.boolean().default(false),
  tests: TestsSchema.default({}),
  skipped: SkippedSchema.default({}),
  timePerSessionMin: z
    .union([z.literal(15), z.literal(20), z.literal(30), z.literal(45), z.literal(60)])
    .optional(),
  goal: z.enum(GOALS).optional(),
});

export type OnboardingDraft = z.infer<typeof DraftSchema>;
export type TestKey = keyof z.infer<typeof SkippedSchema>;

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

/** Whether a step has everything it needs for "Continue". */
export function isStepComplete(d: OnboardingDraft, step: StepId): boolean {
  switch (step) {
    case 'language':
      return d.locale !== undefined;
    case 'name':
      return isValidName(d.displayName);
    case 'basics':
      return d.ageBand !== undefined && d.sex !== undefined;
    case 'activity':
      return d.activityLevel !== undefined;
    case 'experience':
      return d.experience !== undefined;
    case 'equipment':
      return true;
    case 'limitations':
      return d.limitationsNone || d.limitations.length > 0;
    case 'testPushups':
      return d.skipped.pushups === true || d.tests.pushups !== undefined;
    case 'testSquats':
      return d.skipped.squats === true || d.tests.squats60s !== undefined;
    case 'testPlank':
      return d.skipped.plank === true || d.tests.plankSec !== undefined;
    case 'time':
      return d.timePerSessionMin !== undefined;
    case 'goal':
      return d.goal !== undefined;
    case 'result':
      return STEP_IDS.filter((s) => s !== 'result').every((s) => isStepComplete(d, s));
  }
}

/** Index of the first step that is not complete (the result step when everything is done). */
export function firstIncompleteStep(d: OnboardingDraft): number {
  const i = STEP_IDS.findIndex((s) => s !== 'result' && !isStepComplete(d, s));
  return i === -1 ? STEP_IDS.length - 1 : i;
}

/** True when the user skipped every self-test. */
export function allTestsSkipped(d: OnboardingDraft): boolean {
  return (
    d.tests.pushups === undefined &&
    d.tests.squats60s === undefined &&
    d.tests.plankSec === undefined
  );
}

/** Build the engine profile; null while required answers are missing. */
export function draftToTrainingProfile(d: OnboardingDraft): UserTrainingProfile | null {
  if (
    !d.ageBand ||
    !d.sex ||
    !d.activityLevel ||
    !d.experience ||
    !d.timePerSessionMin ||
    !d.goal
  ) {
    return null;
  }
  const equipment: Equipment[] = d.equipment.length > 0 ? [...d.equipment] : ['none'];
  const sortAsc = (xs: readonly number[]) => [...new Set(xs)].sort((a, b) => a - b);
  const profile: UserTrainingProfile = {
    ageBand: d.ageBand,
    sex: d.sex,
    activityLevel: d.activityLevel,
    experience: d.experience,
    tests: {},
    limitations: d.limitationsNone ? [] : [...d.limitations],
    equipment,
    timePerSessionMin: d.timePerSessionMin,
    goal: d.goal,
  };
  if (d.weightKg !== undefined) profile.weightKg = d.weightKg;
  if (d.tests.pushups !== undefined) {
    profile.tests.pushups = d.tests.pushups;
    profile.tests.pushupsOnKnees = d.tests.pushupsOnKnees === true;
  }
  if (d.tests.squats60s !== undefined) profile.tests.squats60s = d.tests.squats60s;
  if (d.tests.plankSec !== undefined) profile.tests.plankSec = d.tests.plankSec;
  if (equipment.includes('dumbbells') && d.dumbbellKg.length > 0) {
    profile.dumbbellKg = sortAsc(d.dumbbellKg);
  }
  if (equipment.includes('kettlebell') && d.kettlebellKg.length > 0) {
    profile.kettlebellKg = sortAsc(d.kettlebellKg);
  }
  return profile;
}

export interface WeightField {
  /** Weight to store; undefined while the field is empty or not a valid weight yet. */
  weightKg?: number;
  /** The text is neither empty nor a weight inside [WEIGHT_MIN_KG, WEIGHT_MAX_KG]. */
  invalid: boolean;
}

/**
 * Parse the optional weight field. The raw text stays in the step component, so half-typed input
 * ("7" on the way to "70") is not wiped by the controlled value — only a valid weight is stored.
 */
export function parseWeightField(text: string): WeightField {
  const trimmed = text.trim();
  if (trimmed === '') return { invalid: false };
  const n = Number(trimmed.replace(',', '.'));
  if (!Number.isFinite(n)) return { invalid: true };
  const kg = Math.round(n * 10) / 10;
  if (kg < WEIGHT_MIN_KG || kg > WEIGHT_MAX_KG) return { invalid: true };
  return { weightKg: kg, invalid: false };
}

/**
 * Step index a `?step=` query parameter asks the wizard to resume at (`tests` is an alias for the
 * first self-test), or null when the parameter is missing or unknown. The caller still clamps it
 * to the first incomplete step so the athlete can never skip an unanswered question.
 */
export function resumeStepIndex(param: string | null | undefined): number | null {
  if (!param) return null;
  if (param === 'tests') return STEP_IDS.indexOf('testPushups');
  const i = (STEP_IDS as readonly string[]).indexOf(param);
  return i >= 0 ? i : null;
}

/** Parse a numeric text field into an integer within bounds, or undefined when empty/invalid. */
export function parseIntField(value: string, max: number): number | undefined {
  const trimmed = value.trim();
  if (trimmed === '') return undefined;
  const n = Number(trimmed);
  if (!Number.isFinite(n) || n < 0) return undefined;
  return Math.min(max, Math.floor(n));
}

/** Toggle a value in a list (immutable). */
export function toggleIn<T>(list: readonly T[], value: T): T[] {
  return list.includes(value) ? list.filter((x) => x !== value) : [...list, value];
}

export type { Locale };
