import { describe, expect, it } from 'vitest';
import { findCourse, findWorkout } from '@/content/catalogue';
import type { Course } from '@/content/schema';
import { t as translate, type TKey, type TParams } from '@/i18n/index';
import type { Translator } from '@/app/hooks/useT';
import { blockMeta } from '@/app/features/player/model';
import { blockMetaLabel as landingBlockMeta } from '@/components/landing/courseHelpers';
import { prescribeWorkout } from '@/lib/training/prescribe';
import type { UserTrainingProfile } from '@/lib/training/types';
import { blockMetaLabel } from './plan';

const tr = (locale: 'ru' | 'en'): Translator => ({
  locale,
  t: (key: TKey, params?: TParams) => translate(locale, key, params),
  l: (value) => (value ? value[locale] : ''),
});

const PROFILE = {
  ageBand: '25-34',
  sex: 'female',
  activityLevel: 'sedentary',
  experience: 'none',
  tests: { pushups: 3, pushupsOnKnees: true, squats60s: 20, plankSec: 20 },
  limitations: [],
  equipment: [],
} as unknown as UserTrainingProfile;

const course = findCourse('start') as Course;
const workout = findWorkout(course, 'w_s01_emom')!;
const authored = workout.blocks.find((b) => b.format === 'emom')!;
const prescribed = prescribeWorkout(workout, {
  profile: PROFILE,
  level: 1,
  scale: 0.8,
  choice: 'normal',
}).blocks.find((b) => b.blockId === authored.id)!;

/*
 * Sergey's workout 1 is three rounds with a rest minute between them, 3 + 1 + 3 + 1 + 3. Every
 * summary says the rounds and the whole clock — never «9 мин», which is the work minutes alone.
 */
describe('EMOM with a rest between rounds, in every block summary', () => {
  it('path plan: «3 круга · 11 мин»', () => {
    expect(blockMetaLabel(tr('ru'), prescribed)).toBe('EMOM · 3 круга · 11 мин');
    expect(blockMetaLabel(tr('en'), prescribed)).toMatch(/3 rounds · 11 min/);
  });

  it('player block intro: the same rounds and minutes', () => {
    const t = (key: TKey, params?: TParams) => translate('ru', key, params);
    expect(blockMeta(t, 'ru', prescribed)).toMatch(/3 круга · 11 мин$/);
  });

  it('landing course page, from the authored block (the site says «раунд» for every circuit)', () => {
    expect(landingBlockMeta('ru', authored)).toBe('EMOM · 3 раунда · 11 мин');
    expect(landingBlockMeta('en', authored)).toMatch(/3 rounds · 11 min$/);
  });

  it('an EMOM without rests still reads as its minutes', () => {
    const plain = { ...prescribed, restBetweenRoundsSec: 0 };
    expect(blockMetaLabel(tr('ru'), plain)).toBe('EMOM · 9 мин');
  });
});
