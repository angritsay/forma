/**
 * Pure helpers for the Profile screen: avatar seeds, the fitness summary, training-profile
 * patches for the equipment / limitations editors, human-readable summaries and the onboarding
 * draft that lets the athlete retake the self-tests with everything else prefilled.
 */
import type { Equipment, Level, Locale } from '@/content/schema';
import type { Profile } from '@/lib/api/types';
import { computeFitnessIndex } from '@/lib/training/assessment';
import type { Limitation, UserTrainingProfile } from '@/lib/training/types';
import type { Translator } from '@/app/hooks/useT';
import { DraftSchema, STEP_IDS, type OnboardingDraft } from '@/app/screens/onboarding/draft';
import { EQUIPMENT_LABEL, LIMITATION_LABEL } from '@/app/screens/onboarding/labels';

/** Index of the first self-test step of the onboarding wizard. */
export const TESTS_STEP_INDEX: number = STEP_IDS.indexOf('testPushups');

/** 16 hex characters from the platform RNG (Math.random when crypto is unavailable). */
export function newAvatarSeed(): string {
  const bytes = new Uint8Array(8);
  const c = globalThis.crypto;
  if (c && typeof c.getRandomValues === 'function') c.getRandomValues(bytes);
  else for (let i = 0; i < bytes.length; i++) bytes[i] = Math.floor(Math.random() * 256);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
}

export interface Fitness {
  /** 0..100 */
  index: number;
  level: Level;
}

/** Stored fitness index and level, recomputed from the training profile when missing. */
export function fitnessOf(
  profile: Pick<Profile, 'fitnessIndex' | 'fitnessLevel' | 'trainingProfile'>,
): Fitness | null {
  if (profile.fitnessIndex !== null && profile.fitnessLevel !== null) {
    return { index: profile.fitnessIndex, level: profile.fitnessLevel };
  }
  if (!profile.trainingProfile) return null;
  const a = computeFitnessIndex(profile.trainingProfile);
  return { index: a.index, level: a.level };
}

function sortAsc(xs: readonly number[]): number[] {
  return [...new Set(xs)].sort((a, b) => a - b);
}

/** Training profile with new equipment; weights are kept only for equipment that is ticked. */
export function withEquipment(
  tp: UserTrainingProfile,
  equipment: readonly Equipment[],
  dumbbellKg: readonly number[],
  kettlebellKg: readonly number[],
): UserTrainingProfile {
  const { dumbbellKg: _d, kettlebellKg: _k, ...rest } = tp;
  const list = [...new Set(equipment.filter((e) => e !== 'none'))];
  const next: UserTrainingProfile = { ...rest, equipment: list.length > 0 ? list : ['none'] };
  if (list.includes('dumbbells') && dumbbellKg.length > 0) next.dumbbellKg = sortAsc(dumbbellKg);
  if (list.includes('kettlebell') && kettlebellKg.length > 0) {
    next.kettlebellKg = sortAsc(kettlebellKg);
  }
  return next;
}

export function withLimitations(
  tp: UserTrainingProfile,
  limitations: readonly Limitation[],
): UserTrainingProfile {
  return { ...tp, limitations: [...new Set(limitations)] };
}

/** "Dumbbells (4, 8 kg), Jump rope" or the "no equipment" label. */
export function equipmentSummary(tr: Translator, tp: UserTrainingProfile | null): string {
  const items = (tp?.equipment ?? []).filter((e) => e !== 'none');
  if (items.length === 0) return tr.t('common.equipment_none');
  return items
    .map((e) => {
      const label = tr.t(EQUIPMENT_LABEL[e]);
      const kg = e === 'dumbbells' ? tp?.dumbbellKg : e === 'kettlebell' ? tp?.kettlebellKg : undefined;
      return kg && kg.length > 0
        ? `${label} (${tr.t('app.profileWeightsKg', { list: kg.join(', ') })})`
        : label;
    })
    .join(', ');
}

export function limitationsSummary(tr: Translator, tp: UserTrainingProfile | null): string {
  const items = tp?.limitations ?? [];
  if (items.length === 0) return tr.t('app.profileLimitationsNone');
  return items.map((l) => tr.t(LIMITATION_LABEL[l])).join(', ');
}

/**
 * Onboarding draft that resumes at the self-tests: every other answer comes from the profile,
 * the tests are cleared so the wizard's "first incomplete step" is the push-up test. Null when
 * the profile has no training data (the wizard then starts from scratch).
 */
export function profileToDraft(profile: Profile, locale: Locale): OnboardingDraft | null {
  const tp = profile.trainingProfile;
  if (!tp) return null;
  const parsed = DraftSchema.safeParse({
    step: TESTS_STEP_INDEX,
    locale,
    displayName: profile.displayName ?? undefined,
    ageBand: tp.ageBand,
    sex: tp.sex,
    weightKg: tp.weightKg,
    activityLevel: tp.activityLevel,
    experience: tp.experience,
    equipment: tp.equipment.filter((e) => e !== 'none'),
    dumbbellKg: tp.dumbbellKg ?? [],
    kettlebellKg: tp.kettlebellKg ?? [],
    limitations: tp.limitations,
    limitationsNone: tp.limitations.length === 0,
    tests: {},
    skipped: {},
    timePerSessionMin: tp.timePerSessionMin,
    goal: tp.goal,
  });
  return parsed.success ? parsed.data : null;
}
