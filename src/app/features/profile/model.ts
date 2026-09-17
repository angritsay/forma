/**
 * Pure helpers for the account sheet: avatar seeds, the fitness summary, training-profile patches
 * for the equipment editor and human-readable summaries.
 *
 * The onboarding draft that resumed the wizard at the self-tests («Пройти тесты заново») is gone
 * with the profile screen and the wizard's assessment step: the test is a modal shown after a
 * couple of workouts now (`/assessment`), so there is no step to resume at.
 */
import type { Equipment, Level, Locale } from '@/content/schema';
import type { Profile } from '@/lib/api/types';
import { computeFitnessIndex } from '@/lib/training/assessment';
import type { Limitation, UserTrainingProfile } from '@/lib/training/types';
import type { Translator } from '@/app/hooks/useT';
import { EQUIPMENT_LABEL, LIMITATION_LABEL } from '@/app/screens/onboarding/labels';

/**
 * The assessment has never been done: the profile carries neither of the two counts the fitness
 * index reads from it.
 *
 * This is what «Не сейчас» leaves behind. The onboarding draft is cleared the moment the profile
 * is saved, so the postponement cannot be remembered there — and it does not need to be: the
 * absence of the numbers *is* the state, and it stays true across devices and reinstalls. Home
 * turns it into today's second task.
 */
export function assessmentPending(
  profile: Pick<Profile, 'trainingProfile'> | null | undefined,
): boolean {
  const tp = profile?.trainingProfile;
  if (!tp) return false;
  return tp.tests.pushups === undefined && tp.tests.squats60s === undefined;
}

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
      const kg =
        e === 'dumbbells' ? tp?.dumbbellKg : e === 'kettlebell' ? tp?.kettlebellKg : undefined;
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
 * Month and year of an ISO timestamp for the «В форме с …» kicker: "июля 2026 г." / "July 2026".
 *
 * `Intl` has no month-year format that declines the month: `{ month: 'long', year: 'numeric' }`
 * gives the nominative «июль 2026 г.», and «с июль» is wrong Russian. Formatting with a day and
 * dropping the day part (and the separator that follows it) keeps the genitive the full date
 * uses. Empty for an unparseable timestamp rather than "Invalid Date" on the profile.
 */
export function sinceLabel(locale: Locale, iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const parts = new Intl.DateTimeFormat(locale === 'ru' ? 'ru-RU' : 'en-US', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).formatToParts(d);
  const out: string[] = [];
  for (let i = 0; i < parts.length; i++) {
    const part = parts[i]!;
    if (part.type === 'day') {
      if (parts[i + 1]?.type === 'literal') i++;
      continue;
    }
    out.push(part.value);
  }
  return out.join('').trim();
}

/** First word of the name and the rest: the profile sets them at 800 and 200 in one line. */
export function splitName(name: string): { heavy: string; thin: string } {
  const trimmed = name.trim();
  const space = trimmed.indexOf(' ');
  if (space < 0) return { heavy: trimmed, thin: '' };
  return { heavy: trimmed.slice(0, space), thin: trimmed.slice(space + 1).trim() };
}
