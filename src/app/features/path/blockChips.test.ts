/**
 * The block's chip line on the workout preview (`blockChips.ts`), held for every block format the
 * compiled courses use — EMOM with and without a rest between rounds, circuit, sets, AMRAP (rounds
 * and max reps), for time (with and without rounds), Tabata (with and without a rest between) — and
 * for the interval format the schema allows, in both languages. The sweep at the end walks every
 * block of every course, so a new shape fails here before it reads «undefined» on a phone.
 */
import { describe, expect, it } from 'vitest';
import { COURSES } from '@content/courses';
import { findCourse } from '@/content/catalogue';
import type { Workout } from '@/content/schema';
import { t as translate, type TKey, type TParams } from '@/i18n/index';
import type { Translator } from '@/app/hooks/useT';
import { prescribeWorkout } from '@/lib/training/prescribe';
import type { PrescribedBlock, UserTrainingProfile } from '@/lib/training/types';
import { blockChipLine, blockChips, restChip } from './blockChips';

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

const prescribe = (w: Workout) =>
  prescribeWorkout(w, { profile: PROFILE, level: 1, scale: 1, choice: 'normal' });

/** Every block of every compiled course, as the preview would receive it. */
const ALL: { where: string; block: PrescribedBlock }[] = COURSES.flatMap((input) => {
  const course = findCourse(input.id)!;
  return course.workouts.flatMap((w) =>
    prescribe(w).blocks.map((block) => ({ where: `${course.id}/${w.id}/${block.blockId}`, block })),
  );
});

const block = (where: string) => {
  const hit = ALL.find((x) => x.where === where);
  if (!hit) throw new Error(`no block ${where}`);
  return hit.block;
};

const both = (where: string) => [
  blockChipLine(tr('ru'), block(where)),
  blockChipLine(tr('en'), block(where)),
];

describe('blockChips — every format the courses use, in both languages', () => {
  it('EMOM with a rest between rounds: the rounds, the minute, the rest (Sergey’s workout 1)', () => {
    expect(both('start/w_s01_emom/s01_main')).toEqual([
      '3 круга · каждую минуту · отдых 1 мин',
      '3 rounds · every minute · rest 1 min',
    ]);
  });

  it('EMOM without rests: the minute and the whole clock', () => {
    expect(both('start/w_s07_emom_ladder/s07_main')).toEqual([
      'каждую минуту · 8 мин',
      'every minute · 8 min',
    ]);
  });

  it('circuit: rounds and the rest between them, in minutes and seconds', () => {
    expect(both('start/w_s10_every_2min/s10_main')).toEqual([
      '4 круга · отдых 1 мин 10 с',
      '4 rounds · rest 1 min 10 s',
    ]);
    expect(both('dumbbells/w_engine_tabata/et_skill')).toEqual([
      '2 круга · отдых 45 с',
      '2 rounds · rest 45 s',
    ]);
  });

  it('sets: the sets and the rest between them', () => {
    expect(both('engine/w_squat_push_a/spa_strength')).toEqual([
      '3 подхода · отдых 1 мин 15 с',
      '3 sets · rest 1 min 15 s',
    ]);
    expect(both('kettlebell/w_swing_school_a/ssa_getup')).toEqual([
      '3 подхода · отдых 30 с',
      '3 sets · rest 30 s',
    ]);
  });

  it('AMRAP: max rounds, or max reps when it is one movement', () => {
    expect(both('start/w_s06_amrap8/s06_main')).toEqual([
      'максимум кругов · 8 мин',
      'max rounds · 8 min',
    ]);
    expect(both('start/w_s04_bridges/s04_main')).toEqual([
      'максимум повторений · 5 мин',
      'max reps · 5 min',
    ]);
  });

  it('for time: the rounds when there are several, and the cap', () => {
    expect(both('dumbbells/w_complex_b/cxb_fortime')).toEqual([
      'на время · 3 круга · лимит 10 мин',
      'for time · 3 rounds · 10 min cap',
    ]);
    expect(both('dumbbells/w_bench_21_15_9/b2159_fortime')).toEqual([
      'на время · лимит 12 мин',
      'for time · 12 min cap',
    ]);
  });

  it('Tabata: work and rest per round, and the rest between the Tabatas', () => {
    expect(both('engine/w_engine_tabata/et_tabata_1')).toEqual([
      'Табата · 20 с / 10 с × 4',
      'Tabata · 20s on / 10s off × 4',
    ]);
    expect(both('dumbbells/w_engine_tabata/et_tabata')).toEqual([
      'Табата · 20 с / 10 с × 8 · отдых 1 мин',
      'Tabata · 20s on / 10s off × 8 · rest 1 min',
    ]);
  });

  it('intervals (in the schema, not in a course yet) read like a Tabata', () => {
    const interval: PrescribedBlock = {
      ...block('engine/w_engine_tabata/et_tabata_1'),
      format: 'interval',
      sets: 6,
      workSec: 30,
      restSec: 30,
    };
    expect(blockChipLine(tr('ru'), interval)).toBe('Интервалы · 30 с / 30 с × 6');
    expect(blockChipLine(tr('en'), interval)).toBe('Intervals · 30s on / 30s off × 6');
  });

  it('every block in every course says something, in plain words, in both languages', () => {
    const formats = new Set<string>();
    for (const { where, block: b } of ALL) {
      formats.add(b.format);
      for (const locale of ['ru', 'en'] as const) {
        const chips = blockChips(tr(locale), b);
        expect(chips.length, where).toBeGreaterThan(0);
        for (const chip of chips) {
          expect(chip, where).not.toMatch(/undefined|NaN|\{|\}|^\s*$|\b0 (мин|min)\b/);
        }
      }
    }
    // If a course starts using a format this list does not name, add a case above for it.
    expect([...formats].sort()).toEqual(['amrap', 'circuit', 'emom', 'fortime', 'sets', 'tabata']);
  });
});

describe('restChip', () => {
  it('seconds under a minute, minutes, and both', () => {
    expect([30, 60, 90, 180].map((s) => restChip(tr('ru'), s))).toEqual([
      'отдых 30 с',
      'отдых 1 мин',
      'отдых 1 мин 30 с',
      'отдых 3 мин',
    ]);
    expect([30, 60, 90].map((s) => restChip(tr('en'), s))).toEqual([
      'rest 30 s',
      'rest 1 min',
      'rest 1 min 30 s',
    ]);
  });
});
