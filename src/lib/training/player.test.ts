import { describe, expect, it } from 'vitest';
import {
  block,
  fixtureLookup,
  FULL_WORKOUT,
  item,
  profile,
  workout,
} from './fixtures.test-helpers';
import { amrapExpectedRounds, buildPlayerSteps, warmupSkipIndex } from './player';
import { prescribeWorkout } from './prescribe';
import type { PlayerStep, PrescribeOptions } from './types';

const opts: PrescribeOptions = { profile: profile(), scale: 1, choice: 'normal', level: 2 };
const stepsFor = (b: Parameters<typeof block>[0]) =>
  buildPlayerSteps(prescribeWorkout(workout({ id: 'w', blocks: [block(b)] }), opts, fixtureLookup));
const kinds = (steps: PlayerStep[]) => steps.map((s) => s.kind);
const works = (steps: PlayerStep[]) =>
  steps.filter((s): s is Extract<PlayerStep, { kind: 'work' }> => s.kind === 'work');
const rests = (steps: PlayerStep[]) =>
  steps.filter((s): s is Extract<PlayerStep, { kind: 'rest' }> => s.kind === 'rest');

describe('buildPlayerSteps — sets and circuits', () => {
  it('sequences intro → work → rest per set, with no rest after the last set', () => {
    const steps = stepsFor({
      id: 's',
      format: 'sets',
      sets: 2,
      restBetweenSetsSec: 60,
      items: [item('push_up', { reps: 10, restAfterSec: 30 }), item('air_squat', { reps: 15 })],
    });
    // Nothing between the intro and the first movement: the demonstration plays through the work
    // itself, so there is no step whose only job is to introduce an exercise.
    expect(kinds(steps)).toEqual([
      'block_intro',
      'work',
      'rest',
      'work',
      'rest',
      'work',
      'rest',
      'work',
      'done',
    ]);
    const r = rests(steps);
    expect(r.map((x) => x.durationSec)).toEqual([30, 60, 30]);
    expect(r[0]!.nextExerciseId).toBe('air_squat');
    expect(r[1]!.nextExerciseId).toBe('push_up');
    const w = works(steps);
    expect(w.map((x) => [x.set, x.totalSets])).toEqual([
      [1, 2],
      [1, 2],
      [2, 2],
      [2, 2],
    ]);
    expect(w[0]!.mode).toBe('reps');
    expect(w[0]!.target).toBe(10);
    expect(w[0]!.durationSec).toBeUndefined();
  });

  it('uses timer mode for seconds-based items and carries the load', () => {
    const steps = stepsFor({
      id: 's',
      format: 'sets',
      sets: 1,
      items: [item('plank', { seconds: 45 }), item('db_goblet_squat', { reps: 10, load: 'heavy' })],
    });
    const w = works(steps);
    expect(w[0]!.mode).toBe('timer');
    expect(w[0]!.durationSec).toBe(45);
    expect(w[0]!.target).toBe(45);
    expect(w[1]!.loadKg).toBe(14);
  });

  /*
   * The whole of a real workout, not a two-item fixture: an introduction step would be easy to
   * reintroduce for one format and miss here.
   */
  it('never puts a step between the athlete and a movement', () => {
    const steps = buildPlayerSteps(prescribeWorkout(FULL_WORKOUT, opts, fixtureLookup));
    const kindsSeen = new Set(steps.map((s) => s.kind));
    expect([...kindsSeen]).not.toContain('explain');
    // Every movement still reaches the athlete: each work step names its exercise.
    expect(works(steps).every((w) => Boolean(w.exerciseId))).toBe(true);
  });

  it('circuits rest between rounds', () => {
    const steps = stepsFor({
      id: 'c',
      format: 'circuit',
      sets: 3,
      restBetweenRoundsSec: 45,
      items: [item('air_squat'), item('push_up')],
    });
    expect(rests(steps).map((r) => r.durationSec)).toEqual([45, 45]);
    expect(works(steps)).toHaveLength(6);
    expect(steps[steps.length - 1]!.kind).toBe('done');
  });
});

describe('buildPlayerSteps — timed formats', () => {
  it('emom: one 60 s timer step per minute, items round-robin', () => {
    const steps = stepsFor({
      id: 'e',
      format: 'emom',
      rounds: 4,
      items: [item('burpee', { reps: 8 }), item('air_squat', { reps: 12 })],
    });
    const w = works(steps);
    expect(w).toHaveLength(4);
    expect(w.map((x) => x.exerciseId)).toEqual(['burpee', 'air_squat', 'burpee', 'air_squat']);
    expect(w.every((x) => x.mode === 'timer' && x.durationSec === 60)).toBe(true);
    expect(w.map((x) => x.target)).toEqual([8, 12, 8, 12]);
    expect(w.map((x) => x.set)).toEqual([1, 2, 3, 4]);
    expect(rests(steps)).toHaveLength(0);
  });

  it('tabata: rounds × (work + rest) per item, trailing rest skipped', () => {
    const steps = stepsFor({
      id: 't',
      format: 'tabata',
      rounds: 8,
      workSec: 20,
      restSec: 10,
      items: [item('plank', { seconds: 20 })],
    });
    // intro, 8 work + 7 rest, done.
    expect(steps).toHaveLength(1 + 15 + 1);
    expect(works(steps).every((w) => w.mode === 'timer' && w.durationSec === 20)).toBe(true);
    expect(rests(steps)).toHaveLength(7);
    const two = stepsFor({
      id: 't',
      format: 'tabata',
      rounds: 8,
      workSec: 20,
      restSec: 10,
      items: [item('plank', { seconds: 20 }), item('air_squat', { reps: 8 })],
    });
    // intro, plank (8 work + 7 rest), the gap rest, air_squat (8 work + 7 rest), done.
    expect(two).toHaveLength(1 + 15 + 1 + 15 + 1);
    expect(
      works(two)
        .slice(8)
        .every((w) => w.target === 8),
    ).toBe(true);
  });

  it('interval: items alternate every round, trailing rest skipped', () => {
    const steps = stepsFor({
      id: 'i',
      format: 'interval',
      rounds: 2,
      workSec: 40,
      restSec: 20,
      items: [item('run', { meters: 100 }), item('burpee', { reps: 5 })],
    });
    expect(works(steps).map((w) => w.exerciseId)).toEqual(['run', 'burpee', 'run', 'burpee']);
    expect(rests(steps)).toHaveLength(3);
    expect(rests(steps)[0]!.nextExerciseId).toBe('burpee');
    // intro, 4 work interleaved with 3 rests, done.
    expect(steps).toHaveLength(1 + 4 + 3 + 1);
  });

  it('amrap: a single step with expected rounds derived from item estimates', () => {
    const p = prescribeWorkout(FULL_WORKOUT, opts, fixtureLookup);
    const steps = buildPlayerSteps(p);
    const amrap = steps.find((s) => s.kind === 'amrap');
    expect(amrap?.kind).toBe('amrap');
    if (amrap?.kind !== 'amrap') return;
    // burpee 5 × 4 + air_squat 10 × 2.5 + kb_swing 15 × 1.5 = 67.5 + 3 × 8 = 91.5 → floor(600 / 91.5)
    expect(amrap.expectedRounds).toBe(6);
    expect(amrap.durationSec).toBe(600);
    expect(amrap.items).toHaveLength(3);
    expect(amrapExpectedRounds({ ...p.blocks[2]!, durationSec: 30 })).toBe(1);
  });

  it('fortime: a single step with rounds and cap', () => {
    const steps = stepsFor({
      id: 'f',
      format: 'fortime',
      sets: 3,
      durationSec: 900,
      items: [item('burpee'), item('air_squat')],
    });
    expect(kinds(steps)).toEqual(['block_intro', 'fortime', 'done']);
    const ft = steps[1];
    if (ft?.kind !== 'fortime') throw new Error('expected fortime');
    expect(ft.rounds).toBe(3);
    expect(ft.capSec).toBe(900);
  });

  it('test blocks: timed items become timer steps whose result is recorded by the UI', () => {
    const steps = stepsFor({
      id: 'test',
      type: 'test',
      format: 'sets',
      sets: 1,
      scalable: false,
      items: [item('push_up', { seconds: 60 }), item('plank', { seconds: 120 })],
    });
    const w = works(steps);
    expect(w.map((x) => x.mode)).toEqual(['timer', 'timer']);
    expect(w.map((x) => x.durationSec)).toEqual([60, 120]);
    expect(w.map((x) => x.target)).toEqual([60, 120]);
    // Flagged so the UI records a score (reps held / reps done) instead of a completion ratio.
    expect(w.every((x) => x.isTest === true)).toBe(true);
    const normal = works(
      stepsFor({ id: 's', format: 'sets', sets: 1, items: [item('plank', { seconds: 30 })] }),
    );
    expect(normal.every((x) => x.isTest === undefined)).toBe(true);
  });

  it('amrapExpectedRounds stays a positive integer when item estimates are broken', () => {
    const p = prescribeWorkout(FULL_WORKOUT, opts, fixtureLookup);
    const amrap = p.blocks[2]!;
    const broken = {
      ...amrap,
      items: amrap.items.map((i) => ({ ...i, estimatedSec: Number.NaN })),
    };
    expect(amrapExpectedRounds(broken)).toBe(1);
    expect(amrapExpectedRounds({ ...amrap, durationSec: Number.NaN })).toBe(1);
  });

  it('carries block metadata into the intro and is deterministic', () => {
    const p = prescribeWorkout(FULL_WORKOUT, opts, fixtureLookup);
    const a = buildPlayerSteps(p);
    const b = buildPlayerSteps(p);
    expect(a).toEqual(b);
    // The opening warm-up has no screen in front of it at all: the session starts inside it.
    expect(p.blocks[0]?.type).toBe('warmup');
    expect(a[0]?.kind).not.toBe('block_intro');
    expect('blockId' in a[0]! ? a[0]!.blockId : null).toBe(p.blocks[0]?.blockId);
    // The first block intro is the block after the warm-up, with its metadata carried over.
    const intro = a.find((s) => s.kind === 'block_intro');
    if (intro?.kind !== 'block_intro') throw new Error('expected intro');
    expect(intro.blockIndex).toBe(1);
    expect(intro.blockId).toBe(p.blocks[1]?.blockId);
    expect(intro.type).toBe(p.blocks[1]?.type);
    expect(intro.format).toBe(p.blocks[1]?.format);
    // Five blocks, four intros: the warm-up gets none.
    expect(a.filter((s) => s.kind === 'block_intro')).toHaveLength(4);
    expect(a[a.length - 1]).toEqual({ kind: 'done' });
  });
});

describe('buildPlayerSteps — rest previews what is coming', () => {
  it('goes straight from the intro into the first movement, and names the next one in the rest', () => {
    const steps = stepsFor({
      id: 's',
      type: 'strength',
      format: 'sets',
      sets: 1,
      items: [item('push_up', { reps: 10, restAfterSec: 30 }), item('air_squat', { reps: 15 })],
    });
    expect(kinds(steps)).toEqual(['block_intro', 'work', 'rest', 'work', 'done']);
    // The rest is where the athlete meets air_squat: its clip plays above and its cues sit below.
    expect(rests(steps)[0]!.nextExerciseId).toBe('air_squat');
  });

  it('opens a session straight inside the warm-up, and says where skipping it lands', () => {
    const p = prescribeWorkout(FULL_WORKOUT, opts, fixtureLookup);
    const steps = buildPlayerSteps(p);
    const warmupId = p.blocks[0]!.blockId;
    // No gate and no intro: the first step is the first movement of the warm-up itself.
    expect(steps[0]?.kind).toBe('work');
    expect(steps.some((s) => s.kind === 'block_intro' && s.blockId === warmupId)).toBe(false);

    const skipTo = warmupSkipIndex(steps, p);
    if (skipTo === null) throw new Error('expected a warm-up to skip');
    // Everything before the skip target belongs to the warm-up block.
    for (let i = 0; i < skipTo; i++) {
      const s = steps[i]!;
      expect('blockId' in s ? s.blockId : warmupId).toBe(warmupId);
    }
    const target = steps[skipTo]!;
    expect(target.kind === 'done' || ('blockId' in target && target.blockId !== warmupId)).toBe(
      true,
    );
  });

  it('has nothing to skip when the workout does not open with a warm-up', () => {
    const p = prescribeWorkout(
      {
        ...FULL_WORKOUT,
        blocks: FULL_WORKOUT.blocks.filter((b) => b.type !== 'warmup'),
      },
      opts,
      fixtureLookup,
    );
    expect(warmupSkipIndex(buildPlayerSteps(p), p)).toBeNull();
  });
});
