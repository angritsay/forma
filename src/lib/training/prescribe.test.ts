import { describe, expect, it } from 'vitest';
import {
  block,
  fixtureLookup,
  FULL_WORKOUT,
  fx,
  item,
  profile,
  workout,
} from './fixtures.test-helpers';
import {
  conflictsWithLimitations,
  easierChain,
  hasEquipmentFor,
  pickLoadKg,
  prescribeWorkout,
  scaleRest,
  scaleTarget,
} from './prescribe';
import type { PrescribeOptions } from './types';

const base = (o: Partial<PrescribeOptions> = {}): PrescribeOptions => ({
  profile: profile(),
  scale: 1,
  choice: 'normal',
  level: 2,
  ...o,
});

const single = (items: ReturnType<typeof item>[], extra: Record<string, unknown> = {}) =>
  workout({
    id: 'w',
    blocks: [block({ id: 'b', format: 'sets', sets: 3, items, ...extra })],
  });

const firstItem = (w = FULL_WORKOUT, opts = base(), blockIndex = 1, itemIndex = 0) =>
  prescribeWorkout(w, opts, fixtureLookup).blocks[blockIndex]!.items[itemIndex]!;

describe('effective scale', () => {
  it('multiplies scale × choice × deload and clamps to 0.3..2', () => {
    const p = (o: Partial<PrescribeOptions>) =>
      prescribeWorkout(FULL_WORKOUT, base(o), fixtureLookup).effectiveScale;
    expect(p({})).toBe(1);
    expect(p({ choice: 'harder' })).toBeCloseTo(1.15);
    expect(p({ choice: 'easier' })).toBeCloseTo(0.85);
    expect(p({ deload: true })).toBeCloseTo(0.65);
    expect(p({ scale: 1.5, choice: 'harder' })).toBeCloseTo(1.725);
    expect(p({ scale: 0.5, choice: 'easier', deload: true })).toBe(0.3);
    expect(p({ scale: 2, choice: 'harder' })).toBe(2);
  });

  it('echoes the inputs (workoutId, scale, choice, deload)', () => {
    const p = prescribeWorkout(
      FULL_WORKOUT,
      base({ scale: 1.1, choice: 'harder', deload: true }),
      fixtureLookup,
    );
    expect(p.workoutId).toBe('fixture_full');
    expect(p.scale).toBe(1.1);
    expect(p.choice).toBe('harder');
    expect(p.deload).toBe(true);
  });
});

describe('targets', () => {
  it('scales reps/seconds/meters/calories with the documented rounding', () => {
    expect(scaleTarget('reps', 10, 1.15)).toBe(12);
    expect(scaleTarget('reps', 10, 0.85)).toBe(9);
    expect(scaleTarget('reps', 1, 0.3)).toBe(1);
    expect(scaleTarget('seconds', 20, 1.15)).toBe(25);
    expect(scaleTarget('seconds', 20, 0.85)).toBe(15);
    expect(scaleTarget('seconds', 10, 0.5)).toBe(10);
    expect(scaleTarget('meters', 400, 1.15)).toBe(460);
    expect(scaleTarget('meters', 400, 0.85)).toBe(340);
    expect(scaleTarget('meters', 5, 0.3)).toBe(5);
    expect(scaleTarget('calories', 15, 1.15)).toBe(17);
    expect(scaleTarget('calories', 2, 0.3)).toBe(1);
  });

  it('keeps authored numbers in non-scalable blocks', () => {
    const p = prescribeWorkout(FULL_WORKOUT, base({ choice: 'harder' }), fixtureLookup);
    const warm = p.blocks[0]!;
    expect(warm.scaled).toBe(false);
    expect(warm.items[0]!.target).toBe(10);
    expect(warm.items[1]!.target).toBe(20);
    const strength = p.blocks[1]!;
    expect(strength.scaled).toBe(true);
    expect(strength.items[0]!.target).toBe(12);
    expect(strength.items[1]!.target).toBe(14);
  });

  it('does not scale AMRAP / EMOM / Tabata durations, only the reps inside', () => {
    const w = workout({
      id: 'w',
      blocks: [
        block({
          id: 'a',
          format: 'amrap',
          durationSec: 600,
          items: [item('burpee', { reps: 10 })],
        }),
        block({ id: 'e', format: 'emom', rounds: 10, items: [item('air_squat', { reps: 10 })] }),
        block({
          id: 't',
          format: 'tabata',
          rounds: 8,
          workSec: 20,
          restSec: 10,
          items: [item('plank', { seconds: 20 })],
        }),
      ],
    });
    const p = prescribeWorkout(w, base({ choice: 'harder', scale: 1.2 }), fixtureLookup);
    expect(p.blocks[0]!.durationSec).toBe(600);
    expect(p.blocks[0]!.items[0]!.target).toBe(14);
    expect(p.blocks[1]!.sets).toBe(10);
    expect(p.blocks[1]!.items[0]!.target).toBe(14);
    expect(p.blocks[2]!.sets).toBe(8);
    expect(p.blocks[2]!.workSec).toBe(20);
    expect(p.blocks[2]!.restSec).toBe(10);
  });
});

describe('sets', () => {
  const sets = (scale: number, authored = 3) =>
    prescribeWorkout(single([item('push_up')], { sets: authored }), base({ scale }), fixtureLookup)
      .blocks[0]!.sets;

  it('adds a set at effective scale ≥ 1.3 and removes one at ≤ 0.7 (min 2)', () => {
    expect(sets(1)).toBe(3);
    expect(sets(1.3)).toBe(4);
    expect(sets(1.29)).toBe(3);
    expect(sets(0.7)).toBe(2);
    expect(sets(0.7, 2)).toBe(2);
    expect(sets(0.6, 4)).toBe(3);
    expect(sets(0.6, 1)).toBe(1);
  });
});

describe('rest', () => {
  it('scales rest by choice and deload, rounded to 5 s', () => {
    expect(scaleRest(60, 0.9)).toBe(55);
    expect(scaleRest(60, 1.15)).toBe(70);
    expect(scaleRest(60, 1.2)).toBe(70);
    expect(scaleRest(60, 1.15 * 1.2)).toBe(85);
    expect(scaleRest(0, 1.2)).toBe(0);
    expect(scaleRest(undefined, 1.2)).toBe(0);
    expect(scaleRest(2, 0.9)).toBe(5);
  });

  it('applies the multipliers to block and item rests', () => {
    const p = prescribeWorkout(FULL_WORKOUT, base({ choice: 'harder' }), fixtureLookup);
    expect(p.blocks[1]!.restBetweenSetsSec).toBe(55);
    expect(p.blocks[1]!.items[0]!.restAfterSec).toBe(25);
    const d = prescribeWorkout(
      FULL_WORKOUT,
      base({ choice: 'easier', deload: true }),
      fixtureLookup,
    );
    expect(d.blocks[1]!.restBetweenSetsSec).toBe(85);
  });

  it('scales rest in non-scalable blocks by the choice only (no deload)', () => {
    const w = workout({
      id: 'w',
      blocks: [
        block({
          id: 'wu',
          type: 'warmup',
          format: 'circuit',
          sets: 2,
          scalable: false,
          restBetweenRoundsSec: 30,
          items: [item('air_squat')],
        }),
      ],
    });
    expect(
      prescribeWorkout(w, base({ deload: true }), fixtureLookup).blocks[0]!.restBetweenRoundsSec,
    ).toBe(30);
    expect(
      prescribeWorkout(w, base({ choice: 'easier' }), fixtureLookup).blocks[0]!
        .restBetweenRoundsSec,
    ).toBe(35);
  });

  it('scales interval rest but not tabata rest', () => {
    const w = workout({
      id: 'w',
      blocks: [
        block({
          id: 'i',
          format: 'interval',
          rounds: 4,
          workSec: 40,
          restSec: 20,
          items: [item('run', { meters: 100 })],
        }),
        block({
          id: 't',
          format: 'tabata',
          rounds: 8,
          workSec: 20,
          restSec: 10,
          items: [item('plank', { seconds: 20 })],
        }),
      ],
    });
    const p = prescribeWorkout(w, base({ choice: 'easier' }), fixtureLookup);
    expect(p.blocks[0]!.restSec).toBe(25);
    expect(p.blocks[1]!.restSec).toBe(10);
  });
});

describe('substitutions', () => {
  it('walks the easier chain until an exercise the athlete has equipment for', () => {
    const it = firstItem(
      single([item('kb_swing', { reps: 15, load: 'light' })]),
      base({ profile: profile({ equipment: ['none', 'mat'], kettlebellKg: [] }) }),
      0,
    );
    expect(it.exerciseId).toBe('glute_bridge');
    expect(it.originalExerciseId).toBe('kb_swing');
    expect(it.substituted).toBe(true);
    expect(it.note).toBeUndefined();
    expect(it.loadLabel).toBeUndefined();
    expect(it.loadKg).toBeUndefined();
  });

  it('keeps the original with an "equipment needed" note when no variant is doable', () => {
    const it = firstItem(
      single([item('pull_up', { reps: 5 })]),
      base({ level: 3, profile: profile({ equipment: ['none'] }) }),
      0,
    );
    expect(it.exerciseId).toBe('pull_up');
    expect(it.substituted).toBe(false);
    expect(it.note?.en).toMatch(/equipment needed/i);
    expect(it.note?.ru).toMatch(/инвентарь/i);
  });

  it('downgrades level-3 exercises for level-1 athletes', () => {
    const it = firstItem(single([item('jumping_lunge', { reps: 10 })]), base({ level: 1 }), 0);
    expect(it.exerciseId).toBe('reverse_lunge');
    expect(it.substituted).toBe(true);
  });

  it('downgrades level-2 exercises for level-1 athletes only on "easier"', () => {
    expect(firstItem(single([item('push_up')]), base({ level: 1 }), 0).exerciseId).toBe('push_up');
    expect(
      firstItem(single([item('push_up')]), base({ level: 1, choice: 'easier' }), 0).exerciseId,
    ).toBe('knee_push_up');
  });

  it('avoids jumping with knee complaints', () => {
    const knees = base({ profile: profile({ limitations: ['knees'] }) });
    expect(firstItem(single([item('jump_squat')]), knees, 0).exerciseId).toBe('air_squat');
    expect(firstItem(single([item('tuck_jump')]), knees, 0).exerciseId).toBe('air_squat');
    expect(firstItem(single([item('jump_rope', { seconds: 60 })]), knees, 0).exerciseId).toBe(
      'run_in_place',
    );
  });

  it('avoids loaded hinges and risky core moves with lower-back complaints', () => {
    const back = base({ profile: profile({ limitations: ['lower_back'] }) });
    expect(firstItem(single([item('kb_swing', { load: 'medium' })]), back, 0).exerciseId).toBe(
      'glute_bridge',
    );
    expect(firstItem(single([item('kb_swing', { load: 'light' })]), back, 0).exerciseId).toBe(
      'kb_swing',
    );
    expect(firstItem(single([item('superman', { seconds: 30 })]), back, 0).exerciseId).toBe(
      'glute_bridge',
    );
    expect(firstItem(single([item('russian_twist')]), back, 0).exerciseId).toBe('dead_bug');
  });

  it('avoids vertical push/pull with shoulder complaints, stepping down with a caution when unavoidable', () => {
    const sh = base({ level: 3, profile: profile({ limitations: ['shoulders'] }) });
    expect(firstItem(single([item('pull_up')]), sh, 0).exerciseId).toBe('inverted_row');
    const press = firstItem(single([item('db_press', { load: 'light' })]), sh, 0);
    expect(press.exerciseId).toBe('db_front_raise');
    expect(press.note?.en).toMatch(/sensitive area/i);
  });

  it('steps push-ups down for wrist complaints and swaps floor work when possible', () => {
    const wr = base({ profile: profile({ limitations: ['wrists'] }) });
    const pu = firstItem(single([item('push_up')]), wr, 0);
    expect(pu.exerciseId).toBe('knee_push_up');
    expect(pu.note).toBeDefined();
    expect(firstItem(single([item('bear_crawl', { meters: 20 })]), wr, 0).exerciseId).toBe(
      'dead_bug',
    );
  });

  it('caps isometric holds at 30 s and downgrades heavy loads for hypertension', () => {
    const ht = base({ profile: profile({ limitations: ['hypertension'] }), scale: 1.3 });
    const w = single([item('plank', { seconds: 60 }), item('db_goblet_squat', { load: 'heavy' })]);
    const p = prescribeWorkout(w, ht, fixtureLookup).blocks[0]!;
    expect(p.items[0]!.target).toBe(30);
    expect(p.items[1]!.loadLabel).toBe('medium');
    expect(p.items[1]!.loadKg).toBe(10);
    expect(firstItem(single([item('run_in_place', { seconds: 60 })]), ht, 0).target).toBe(80);
  });

  it('treats pregnancy as "easier": no supine flexion, no jumps, no heavy loads', () => {
    const pg = base({
      choice: 'harder',
      level: 3,
      profile: profile({ limitations: ['pregnancy'] }),
    });
    const w = single([item('sit_up'), item('jump_squat'), item('kb_deadlift', { load: 'heavy' })]);
    const p = prescribeWorkout(w, pg, fixtureLookup);
    expect(p.choice).toBe('easier');
    expect(p.effectiveScale).toBeCloseTo(0.85);
    expect(p.blocks[0]!.items[0]!.exerciseId).toBe('dead_bug');
    expect(p.blocks[0]!.items[1]!.exerciseId).toBe('air_squat');
    expect(p.blocks[0]!.items[2]!.loadLabel).toBe('medium');
  });

  it('uses the harder variant for level-3 athletes choosing "harder" on bodyweight moves', () => {
    const hard = base({ choice: 'harder', level: 3 });
    expect(firstItem(single([item('push_up')]), hard, 0).exerciseId).toBe('decline_push_up');
    expect(firstItem(single([item('air_squat')]), hard, 0).exerciseId).toBe('jump_squat');
    // loadable moves keep their prescription
    expect(firstItem(single([item('kb_deadlift')]), hard, 0).exerciseId).toBe('kb_deadlift');
    // level 2 athletes are not pushed up
    expect(firstItem(single([item('push_up')]), base({ choice: 'harder' }), 0).exerciseId).toBe(
      'push_up',
    );
    // a harder variant that conflicts with a limitation is not used
    const knees = base({
      choice: 'harder',
      level: 3,
      profile: profile({ limitations: ['knees'] }),
    });
    expect(firstItem(single([item('air_squat')]), knees, 0).exerciseId).toBe('air_squat');
  });

  it('exposes the classification helpers', () => {
    expect(hasEquipmentFor(fx('push_up'), [])).toBe(true);
    expect(hasEquipmentFor(fx('db_goblet_squat'), ['kettlebell'])).toBe(true);
    expect(hasEquipmentFor(fx('db_goblet_squat'), ['bands'])).toBe(false);
    expect(easierChain(fx('pull_up'), fixtureLookup).map((e) => e.id)).toEqual([
      'pull_up',
      'inverted_row',
      'band_row',
    ]);
    expect(easierChain(fx('run'), fixtureLookup).map((e) => e.id)).toEqual(['run']);
    expect(conflictsWithLimitations(fx('kb_swing'), 'heavy', new Set(['lower_back']))).toBe(true);
    expect(conflictsWithLimitations(fx('kb_swing'), 'light', new Set(['lower_back']))).toBe(false);
    expect(conflictsWithLimitations(fx('plank'), undefined, new Set(['wrists']))).toBe(true);
    expect(conflictsWithLimitations(fx('plank'), undefined, new Set(['knees']))).toBe(false);
  });
});

describe('loads', () => {
  it('maps light/medium/heavy to the lightest/median/heaviest owned weight', () => {
    const p = profile({ dumbbellKg: [6, 10, 14], kettlebellKg: [12, 16] });
    expect(pickLoadKg(fx('db_goblet_squat'), 'light', p)).toBe(6);
    expect(pickLoadKg(fx('db_goblet_squat'), 'medium', p)).toBe(10);
    expect(pickLoadKg(fx('db_goblet_squat'), 'heavy', p)).toBe(14);
    expect(pickLoadKg(fx('kb_swing'), 'light', p)).toBe(12);
    expect(pickLoadKg(fx('kb_swing'), 'medium', p)).toBe(12);
    expect(pickLoadKg(fx('kb_swing'), 'heavy', p)).toBe(16);
  });

  it('uses the only weight when there is one, sorts unsorted lists, and returns undefined without weights', () => {
    expect(pickLoadKg(fx('kb_swing'), 'heavy', profile({ kettlebellKg: [8] }))).toBe(8);
    expect(pickLoadKg(fx('kb_swing'), 'light', profile({ kettlebellKg: [24, 8, 16] }))).toBe(8);
    expect(pickLoadKg(fx('kb_swing'), 'light', profile({ kettlebellKg: [] }))).toBeUndefined();
    expect(
      pickLoadKg(
        fx('db_goblet_squat'),
        'light',
        profile({ dumbbellKg: undefined, kettlebellKg: [16] }),
      ),
    ).toBe(16);
  });

  it('keeps the label without a weight when the athlete has none, defaults loadable items to medium', () => {
    const it = firstItem(
      single([item('kb_swing', { load: 'heavy' })]),
      base({ profile: profile({ kettlebellKg: undefined }) }),
      0,
    );
    expect(it.loadLabel).toBe('heavy');
    expect(it.loadKg).toBeUndefined();
    const noLabel = firstItem(single([item('db_goblet_squat')]), base(), 0);
    expect(noLabel.loadLabel).toBe('medium');
    expect(noLabel.loadKg).toBe(10);
    const bodyweight = firstItem(single([item('air_squat', { load: 'light' })]), base(), 0);
    expect(bodyweight.loadLabel).toBeUndefined();
  });
});

describe('estimates and points', () => {
  it('estimates item seconds per unit', () => {
    const w = single([
      item('push_up', { reps: 10 }),
      item('reverse_lunge', { reps: 8, perSide: true }),
      item('plank', { seconds: 20 }),
      item('run', { meters: 300 }),
      item('bike_cal', { calories: 15 }),
    ]);
    const items = prescribeWorkout(w, base(), fixtureLookup).blocks[0]!.items;
    expect(items[0]!.estimatedSec).toBe(20);
    expect(items[1]!.estimatedSec).toBe(48);
    expect(items[1]!.perSide).toBe(true);
    expect(items[2]!.estimatedSec).toBe(20);
    expect(items[3]!.estimatedSec).toBe(200);
    expect(items[4]!.estimatedSec).toBe(60);
  });

  it('fills block and total estimates and the points', () => {
    const p = prescribeWorkout(FULL_WORKOUT, base(), fixtureLookup);
    expect(p.blocks.map((b) => b.estimatedSec)).toEqual([81, 446, 620, 260, 53]);
    expect(p.estimatedSec).toBe(1460);
    expect(p.points).toBe(120);
    expect(
      prescribeWorkout(
        FULL_WORKOUT,
        base({ choice: 'harder', repeat: true, streakDays: 30 }),
        fixtureLookup,
      ).points,
    ).toBe(90);
  });

  it('survives an exercise that is missing from the lookup', () => {
    const it = firstItem(single([item('mystery_move', { reps: 10 })]), base(), 0);
    expect(it.exerciseId).toBe('mystery_move');
    expect(it.substituted).toBe(false);
    expect(it.estimatedSec).toBe(30);
  });

  it('keeps authored notes and joins them with engine notes', () => {
    const w = single([item('pull_up', { reps: 5, note: { ru: 'Спокойно.', en: 'Steady.' } })]);
    const it = prescribeWorkout(
      w,
      base({ level: 3, profile: profile({ equipment: ['none'] }) }),
      fixtureLookup,
    ).blocks[0]!.items[0]!;
    expect(it.note?.en).toMatch(/Equipment needed/);
    expect(it.note?.en).toMatch(/Steady\./);
    const plain = firstItem(
      single([item('push_up', { note: { ru: 'Локти.', en: 'Elbows.' } })]),
      base(),
      0,
    );
    expect(plain.note).toEqual({ ru: 'Локти.', en: 'Elbows.' });
  });
});
