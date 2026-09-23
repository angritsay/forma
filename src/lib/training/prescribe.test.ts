import { describe, expect, it } from 'vitest';
import {
  block,
  fixtureLookup,
  FULL_WORKOUT,
  fx,
  item,
  makeExercise,
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
    expect(p({ choice: 'harder' })).toBeCloseTo(1.1);
    expect(p({ choice: 'easier' })).toBeCloseTo(0.9);
    expect(p({ deload: true })).toBeCloseTo(0.65);
    expect(p({ scale: 1.5, choice: 'harder' })).toBeCloseTo(1.65);
    expect(p({ scale: 0.5, choice: 'easier', deload: true })).toBe(0.3);
    expect(p({ scale: 2, choice: 'harder' })).toBe(2);
  });

  it('falls back to scale 1 when the stored scale is not a number', () => {
    const p = prescribeWorkout(
      FULL_WORKOUT,
      base({ scale: Number.NaN as unknown as number }),
      fixtureLookup,
    );
    expect(p.scale).toBe(1);
    expect(p.effectiveScale).toBe(1);
    expect(Number.isFinite(p.estimatedSec)).toBe(true);
    const numbers = p.blocks.flatMap((b) => b.items.flatMap((i) => [i.target, i.estimatedSec]));
    expect(numbers.every((n) => Number.isFinite(n))).toBe(true);
    expect(p.blocks[1]!.items[0]!.target).toBe(10);
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
    expect(strength.items[0]!.target).toBe(11);
    expect(strength.items[1]!.target).toBe(13);
  });

  it('moves the AMRAP window and the EMOM / Tabata round count with the choice', () => {
    const w = workout({
      id: 'w',
      blocks: [
        block({
          id: 'a',
          format: 'amrap',
          durationSec: 600,
          items: [item('burpee', { reps: 10 }), item('air_squat', { reps: 10 })],
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
    // These formats have no sets to add, so the clock itself is the lever: a 10 min AMRAP
    // becomes 12, a 10-round EMOM becomes 12. Work/rest inside a Tabata interval stays canonical.
    const p = prescribeWorkout(w, base({ choice: 'harder', scale: 1.2 }), fixtureLookup);
    expect(p.blocks[0]!.durationSec).toBe(720);
    expect(p.blocks[0]!.items[0]!.target).toBe(13);
    expect(p.blocks[1]!.sets).toBe(12);
    expect(p.blocks[1]!.items[0]!.target).toBe(13);
    expect(p.blocks[2]!.sets).toBe(10);
    expect(p.blocks[2]!.workSec).toBe(20);
    expect(p.blocks[2]!.restSec).toBe(10);

    const easy = prescribeWorkout(w, base({ choice: 'easier' }), fixtureLookup);
    expect(easy.blocks[0]!.durationSec).toBe(480);
    expect(easy.blocks[1]!.sets).toBe(8);
  });
});

describe('sets', () => {
  const sets = (scale: number, authored = 3) =>
    prescribeWorkout(single([item('push_up')], { sets: authored }), base({ scale }), fixtureLookup)
      .blocks[0]!.sets;

  it('adds a set at scale ≥ 1.3 and removes one at ≤ 0.7 (min 2)', () => {
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

  it('leaves rest alone for the difficulty choice and stretches it only on a deload', () => {
    // How long you need between sets is a property of the movement, not of how ambitious you
    // feel. Moving it with the choice is also what used to cancel the choice's own effect on
    // session length — see CHOICE_SETS_DELTA in constants.ts.
    const authoredRest = prescribeWorkout(FULL_WORKOUT, base(), fixtureLookup).blocks[1]!;
    for (const choice of ['easier', 'harder'] as const) {
      const p = prescribeWorkout(FULL_WORKOUT, base({ choice }), fixtureLookup);
      expect(p.blocks[1]!.restBetweenSetsSec).toBe(authoredRest.restBetweenSetsSec);
      expect(p.blocks[1]!.items[0]!.restAfterSec).toBe(authoredRest.items[0]!.restAfterSec);
    }
    const d = prescribeWorkout(
      FULL_WORKOUT,
      base({ choice: 'easier', deload: true }),
      fixtureLookup,
    );
    expect(d.blocks[1]!.restBetweenSetsSec).toBe(70);
  });

  it('never touches rest in a non-scalable block', () => {
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
    ).toBe(30);
  });

  it('keeps interval and tabata work/rest at their authored, canonical values', () => {
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
    expect(p.blocks[0]!.restSec).toBe(20);
    expect(p.blocks[1]!.restSec).toBe(10);
    // The rounds move instead. An interval block already at the four-round floor stays there;
    // a Tabata has rounds to spare and drops from 8 to 6.
    expect(p.blocks[0]!.sets).toBe(4);
    expect(p.blocks[1]!.sets).toBe(6);
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
    expect(p.effectiveScale).toBeCloseTo(0.9);
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

  it('converts the target to the substitute unit, keeping the work time', () => {
    // 20 m of bear crawl ≈ 13 s of work → dead bug at 3 s per rep ≈ 4 reps (not "20 m of dead bug")
    const wr = base({ profile: profile({ limitations: ['wrists'] }) });
    const crawl = firstItem(single([item('bear_crawl', { meters: 20 })]), wr, 0);
    expect(crawl.exerciseId).toBe('dead_bug');
    expect(crawl.unit).toBe('reps');
    expect(crawl.target).toBe(4);
    expect(crawl.estimatedSec).toBe(12);
    // a 30 s superman hold ≈ 12 glute bridges at 2.5 s per rep
    const back = base({ profile: profile({ limitations: ['lower_back'] }) });
    const hold = firstItem(single([item('superman', { seconds: 30 })]), back, 0);
    expect(hold.exerciseId).toBe('glute_bridge');
    expect(hold.unit).toBe('reps');
    expect(hold.target).toBe(12);
    // same-unit substitutions keep the authored number
    const push = firstItem(
      single([item('push_up', { reps: 12 })]),
      base({ level: 1, choice: 'easier' }),
      0,
    );
    expect(push.exerciseId).toBe('knee_push_up');
    expect(push.unit).toBe('reps');
    expect(push.target).toBe(11);
  });

  it('never swaps in a harder variant inside a non-scalable block (warm-ups, cool-downs, tests)', () => {
    const hard = base({ choice: 'harder', level: 3 });
    const warm = prescribeWorkout(FULL_WORKOUT, hard, fixtureLookup).blocks[0]!;
    expect(warm.items.map((i) => i.exerciseId)).toEqual(['air_squat', 'plank']);
    const test = workout({
      id: 'w',
      blocks: [
        block({
          id: 'test',
          type: 'test',
          format: 'sets',
          sets: 1,
          scalable: false,
          items: [item('push_up', { seconds: 120 }), item('air_squat', { seconds: 60 })],
        }),
      ],
    });
    const p = prescribeWorkout(test, hard, fixtureLookup).blocks[0]!;
    expect(p.items.map((i) => i.exerciseId)).toEqual(['push_up', 'air_squat']);
    expect(p.items.every((i) => !i.substituted)).toBe(true);
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
    expect(p.blocks.map((b) => b.estimatedSec)).toEqual([81, 446, 620, 250, 53]);
    expect(p.estimatedSec).toBe(1450);
    expect(p.points).toBe(120);
    // 120 base × 1.25 harder × 0.5 repeat = 75. It was 90 while a 30-day streak added a fifth.
    expect(
      prescribeWorkout(FULL_WORKOUT, base({ choice: 'harder', repeat: true }), fixtureLookup)
        .points,
    ).toBe(75);
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

/*
 * A movement done one side at a time is counted as a total across both sides, so an odd total
 * gives one side a rep the other never gets. The authored numbers are even because whoever wrote
 * them counted in pairs; the engine is what breaks it, by multiplying them by a scale.
 */
describe('two-sided movements come out even', () => {
  const lunge = makeExercise({
    id: 'reverse_lunge',
    pattern: 'lunge',
    tags: ['lower', 'unilateral'],
    secondsPerRep: 2,
  });
  const squat = makeExercise({ id: 'air_squat', pattern: 'squat', secondsPerRep: 2 });
  const lookup: (id: string) => ReturnType<typeof makeExercise> | undefined = (id) =>
    id === lunge.id ? lunge : id === squat.id ? squat : undefined;

  const target = (exerciseId: string, reps: number, scale: number, perSide = false) =>
    prescribeWorkout(
      workout({
        id: 'w',
        blocks: [
          block({
            id: 'b',
            format: 'sets',
            sets: 1,
            items: [item(exerciseId, { reps, ...(perSide ? { perSide: true } : {}) })],
          }),
        ],
      }),
      base({ scale }),
      lookup,
    ).blocks[0]!.items[0]!.target;

  it('rounds an odd scaled total up or down to the nearest even number', () => {
    // 20 × 0.65 = 13 → 14; 20 × 0.55 = 11 → 12; 20 × 1.15 = 23 → 24.
    expect(target('reverse_lunge', 20, 0.65) % 2).toBe(0);
    expect(target('reverse_lunge', 20, 0.55) % 2).toBe(0);
    expect(target('reverse_lunge', 20, 1.15) % 2).toBe(0);
  });

  it('is even at every scale the engine can produce', () => {
    for (let scale = 0.3; scale <= 2.0001; scale += 0.05) {
      for (const authored of [8, 10, 12, 15, 16, 20, 24, 30, 40]) {
        const t = target('reverse_lunge', authored, Number(scale.toFixed(2)));
        expect(t % 2, `authored ${authored} at scale ${scale.toFixed(2)} gave ${t}`).toBe(0);
      }
    }
  });

  it('never rounds the movement away entirely', () => {
    expect(target('reverse_lunge', 2, 0.3)).toBeGreaterThanOrEqual(2);
  });

  it('leaves a two-sided movement alone when it is already counted per side', () => {
    // The number is per side and the athlete does it twice, so the total is even whatever it is.
    // Forcing this one even would silently double a third of the work.
    expect(target('reverse_lunge', 5, 1, true)).toBe(5);
    expect(target('reverse_lunge', 7, 1, true)).toBe(7);
  });

  it('leaves a two-legged movement alone', () => {
    expect(target('air_squat', 15, 1)).toBe(15);
    expect(target('air_squat', 20, 0.65)).toBe(13);
  });

  it('recognises a two-sided movement by its id when the tag is missing', () => {
    const untagged = makeExercise({ id: 'single_leg_rdl', pattern: 'hinge', secondsPerRep: 3 });
    const t = prescribeWorkout(
      workout({
        id: 'w',
        blocks: [
          block({
            id: 'b',
            format: 'sets',
            sets: 1,
            items: [item('single_leg_rdl', { reps: 20 })],
          }),
        ],
      }),
      base({ scale: 0.65 }),
      (id) => (id === untagged.id ? untagged : undefined),
    ).blocks[0]!.items[0]!.target;
    expect(t % 2).toBe(0);
  });
});

describe('audit of «Форма с нуля» (engine rules)', () => {
  const clip = { ru: 'clip.mp4' };
  const lib = new Map(
    [
      makeExercise({ id: 'squat', pattern: 'squat', video: clip, scaling: { harder: 'jump' } }),
      makeExercise({ id: 'jump', pattern: 'jump', level: 3 }),
      makeExercise({
        id: 'climber',
        pattern: 'locomotion',
        tags: ['on_hands'],
        level: 2,
        video: clip,
        scaling: { easier: 'march' },
      }),
      makeExercise({ id: 'march', pattern: 'locomotion' }),
      makeExercise({
        id: 'kneepush',
        pattern: 'push_horizontal',
        video: clip,
        scaling: { easier: 'wallpush' },
      }),
      makeExercise({ id: 'wallpush', pattern: 'push_horizontal' }),
      makeExercise({
        id: 'sit_up',
        pattern: 'core_flexion',
        video: clip,
        scaling: { easier: 'dead_bug' },
      }),
      makeExercise({ id: 'dead_bug', pattern: 'core_anti_extension', video: clip }),
      makeExercise({ id: 'a', video: clip }),
      makeExercise({ id: 'b', video: clip }),
      makeExercise({ id: 'c', video: clip }),
    ].map((e) => [e.id, e]),
  );
  const lookup = (id: string) => lib.get(id);
  const run = (w: ReturnType<typeof workout>, o: Partial<PrescribeOptions> = {}) =>
    prescribeWorkout(w, base(o), lookup);
  const one = (b: Parameters<typeof block>[0]) => workout({ id: 'w', blocks: [block(b)] });

  it('scaled AMRAP / for-time windows land on whole minutes', () => {
    for (const choice of ['easier', 'harder'] as const) {
      for (const d of [300, 420, 480, 540, 600, 780]) {
        const p = run(one({ id: 'm', format: 'amrap', durationSec: d, items: [item('a')] }), {
          choice,
        });
        expect(p.blocks[0]!.durationSec! % 60).toBe(0);
      }
    }
  });

  it('a main circuit of one or two rounds keeps them; the choice moves its reps', () => {
    for (const rounds of [1, 2]) {
      const w = one({
        id: 'c',
        type: 'metcon',
        format: 'circuit',
        sets: rounds,
        items: [item('a', { reps: 20 }), item('b', { reps: 20 })],
      });
      const [easier, normal, harder] = (['easier', 'normal', 'harder'] as const).map(
        (choice) => run(w, { choice }).blocks[0]!,
      );
      expect([easier!.sets, normal!.sets, harder!.sets]).toEqual([rounds, rounds, rounds]);
      // The for-time volume: a fifth either way, so «полегче» is not a rounding error away.
      expect(easier!.items[0]!.target).toBe(16);
      expect(normal!.items[0]!.target).toBe(20);
      expect(harder!.items[0]!.target).toBe(24);
    }
  });

  it('a longer main circuit gains its round on «посложнее» at the usual reps', () => {
    const w = one({
      id: 'c',
      type: 'metcon',
      format: 'circuit',
      sets: 4,
      items: [item('a', { reps: 20 })],
    });
    const normal = run(w).blocks[0]!;
    const harder = run(w, { choice: 'harder' }).blocks[0]!;
    expect(harder.sets).toBe(normal.sets + 1);
    expect(harder.items[0]!.target).toBe(normal.items[0]!.target);
  });

  it('EMOM minutes are whole cycles of the movements', () => {
    const w = one({
      id: 'e',
      format: 'emom',
      rounds: 12,
      items: [item('a'), item('b'), item('c')],
    });
    expect(run(w, { choice: 'easier' }).blocks[0]!.sets).toBe(9);
    expect(run(w, { choice: 'normal' }).blocks[0]!.sets).toBe(12);
    expect(run(w, { choice: 'harder' }).blocks[0]!.sets).toBe(15);
    const short = one({
      id: 'e',
      format: 'emom',
      rounds: 3,
      items: [item('a'), item('b'), item('c')],
    });
    for (const choice of ['easier', 'harder'] as const)
      expect(run(short, { choice }).blocks[0]!.sets).toBe(3);
  });

  it('EMOM reps on «полегче» are always below «как обычно»', () => {
    const w = one({ id: 'e', format: 'emom', rounds: 3, items: [item('a', { reps: 5 })] });
    const normal = run(w).blocks[0]!.items[0]!.target;
    const easier = run(w, { choice: 'easier' }).blocks[0]!.items[0]!.target;
    expect(normal).toBe(5);
    expect(easier).toBe(4);
  });

  it('a two-round main circuit keeps two rounds on «полегче»', () => {
    const w = one({ id: 'c', type: 'metcon', format: 'circuit', sets: 2, items: [item('a')] });
    expect(run(w, { choice: 'easier' }).blocks[0]!.sets).toBe(2);
    const core = one({ id: 'c', type: 'core', format: 'circuit', sets: 2, items: [item('a')] });
    expect(run(core, { choice: 'easier' }).blocks[0]!.sets).toBe(1);
  });

  it('a filmed movement is not swapped for an unfilmed harder variant; the target moves', () => {
    const w = one({ id: 's', format: 'sets', sets: 3, items: [item('squat', { reps: 10 })] });
    const normal = run(w, { level: 3 }).blocks[0]!.items[0]!;
    const harder = run(w, { level: 3, choice: 'harder' }).blocks[0]!.items[0]!;
    expect(harder.exerciseId).toBe('squat');
    expect(harder.target).toBeGreaterThan(normal.target);
  });

  it('a filmed level-2 movement stays on «полегче» for a beginner instead of an unfilmed one', () => {
    const w = one({ id: 's', format: 'sets', sets: 3, items: [item('climber', { reps: 20 })] });
    const easier = run(w, { level: 1, choice: 'easier' }).blocks[0]!.items[0]!;
    expect(easier.exerciseId).toBe('climber');
    expect(easier.substituted).toBe(false);
  });

  it('safety beats video: sore wrists get the unfilmed variant that is off the hands', () => {
    const w = one({ id: 's', format: 'sets', sets: 3, items: [item('climber', { reps: 20 })] });
    const p = run(w, { profile: profile({ limitations: ['wrists'] }) });
    expect(p.blocks[0]!.items[0]!.exerciseId).toBe('march');
  });

  it('an unfilmed variant that is no safer does not replace the filmed original', () => {
    const w = one({ id: 's', format: 'sets', sets: 3, items: [item('kneepush', { reps: 10 })] });
    const it0 = run(w, { profile: profile({ limitations: ['wrists'] }) }).blocks[0]!.items[0]!;
    expect(it0.exerciseId).toBe('kneepush');
    expect(it0.note).toBeDefined();
  });

  it('sit-ups swapped for dead bugs: twice the reps, even, without the sit-up cue', () => {
    const w = one({
      id: 's',
      format: 'sets',
      sets: 1,
      items: [item('sit_up', { reps: 7, note: { ru: 'Не тяни шею', en: 'Neck' } })],
    });
    const it0 = run(w, { profile: profile({ limitations: ['pregnancy'] }) }).blocks[0]!.items[0]!;
    expect(it0.exerciseId).toBe('dead_bug');
    expect(it0.target % 2).toBe(0);
    expect(it0.target).toBeGreaterThanOrEqual(12);
    expect(it0.note?.ru ?? '').not.toContain('Не тяни шею');
  });

  it('block rest is kept between blocks and dropped after the last', () => {
    const w = workout({
      id: 'w',
      blocks: [
        block({ id: 'x', format: 'sets', sets: 1, items: [item('a')], restAfterSec: 120 }),
        block({ id: 'y', format: 'sets', sets: 1, items: [item('b')], restAfterSec: 60 }),
      ],
    });
    const p = run(w);
    expect(p.blocks[0]!.restAfterSec).toBe(120);
    expect(p.blocks[1]!.restAfterSec).toBeUndefined();
  });
});
