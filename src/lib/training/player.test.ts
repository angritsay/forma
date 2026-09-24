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
import { computeCompletion } from './session';
import type { PlayerStep, PrescribeOptions, PrescribedWorkout } from './types';

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
  it('never puts a step between the athlete and a movement the coach has not explained', () => {
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

  it('max reps: the engine flags the block and the player reads the flag', () => {
    const maxBlock = { id: 'm', format: 'amrap' as const, durationSec: 300 };
    const one = prescribeWorkout(
      workout({ id: 'w', blocks: [block({ ...maxBlock, items: [item('burpee', { reps: 50 })] })] }),
      opts,
      fixtureLookup,
    );
    expect(one.blocks[0]!.maxReps).toBe(true);
    const step = buildPlayerSteps(one).find((s) => s.kind === 'amrap');
    expect(step?.kind === 'amrap' && step.maxReps).toBe(true);
    if (step?.kind === 'amrap') expect(step.expectedRounds).toBe(1);

    // Two movements, or one timed movement: an ordinary AMRAP, flagged false.
    const two = prescribeWorkout(
      workout({
        id: 'w',
        blocks: [block({ ...maxBlock, items: [item('burpee'), item('air_squat')] })],
      }),
      opts,
      fixtureLookup,
    );
    expect(two.blocks[0]!.maxReps).toBe(false);
    const timed = prescribeWorkout(
      workout({
        id: 'w',
        blocks: [block({ ...maxBlock, items: [item('plank', { seconds: 60 })] })],
      }),
      opts,
      fixtureLookup,
    );
    expect(timed.blocks[0]!.maxReps).toBe(false);

    // The player follows the flag, not the shape: a block the prescriber did not flag stays rounds.
    const unflagged = { ...one, blocks: [{ ...one.blocks[0]!, maxReps: false }] };
    const plain = buildPlayerSteps(unflagged).find((s) => s.kind === 'amrap');
    expect(plain?.kind === 'amrap' && plain.maxReps).toBeFalsy();
    // A prescription stored before the flag existed falls back to the same rule.
    const { maxReps: _dropped, ...legacyBlock } = one.blocks[0]!;
    const legacy = { ...one, blocks: [legacyBlock] };
    const old = buildPlayerSteps(legacy).find((s) => s.kind === 'amrap');
    expect(old?.kind === 'amrap' && old.maxReps).toBe(true);
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

describe('buildPlayerSteps — rest after a block', () => {
  it('plays the block rest before the next block and counts it in the estimate', () => {
    const w = workout({
      id: 'w',
      blocks: [
        block({
          id: 'x',
          format: 'fortime',
          sets: 1,
          durationSec: 360,
          items: [item('air_squat', { reps: 20 })],
          restAfterSec: 120,
        }),
        block({
          id: 'y',
          format: 'fortime',
          sets: 1,
          durationSec: 600,
          items: [item('push_up', { reps: 10 })],
          restAfterSec: 60,
        }),
      ],
    });
    const p = prescribeWorkout(w, opts, fixtureLookup);
    const steps = buildPlayerSteps(p);
    expect(kinds(steps)).toEqual([
      'block_intro',
      'fortime',
      'rest',
      'block_intro',
      'fortime',
      'done',
    ]);
    const rest = rests(steps)[0]!;
    expect(rest.durationSec).toBe(120);
    expect(rest.nextExerciseId).toBe('push_up');
    const without = prescribeWorkout(
      { ...w, blocks: w.blocks.map((b) => ({ ...b, restAfterSec: undefined })) },
      opts,
      fixtureLookup,
    );
    expect(p.estimatedSec - without.estimatedSec).toBe(120);
  });
});

describe("buildPlayerSteps — the coach's explanation before an exercise", () => {
  const base = (): PrescribedWorkout => prescribeWorkout(FULL_WORKOUT, opts, fixtureLookup);
  const intros = (steps: PlayerStep[]) =>
    steps.filter((s): s is Extract<PlayerStep, { kind: 'intro' }> => s.kind === 'intro');

  it("builds exactly today's steps without the map, and with an empty one", () => {
    const p = base();
    expect(p.intros).toBeUndefined();
    const today = buildPlayerSteps(p);
    expect(buildPlayerSteps({ ...p, intros: {} })).toEqual(today);
    expect(intros(today)).toHaveLength(0);
  });

  it('puts one explanation before the first time each explained exercise is done', () => {
    const p: PrescribedWorkout = { ...base(), intros: { air_squat: 'full', push_up: 'brief' } };
    const steps = buildPlayerSteps(p);
    const found = intros(steps);
    expect(found.map((s) => [s.exerciseId, s.tier, s.blockId])).toEqual([
      ['air_squat', 'full', 'warmup'],
      ['push_up', 'brief', 'strength'],
    ]);
    for (const intro of found) {
      const i = steps.indexOf(intro);
      const next = steps[i + 1];
      expect(next?.kind).toBe('work');
      expect(next && 'exerciseId' in next ? next.exerciseId : undefined).toBe(intro.exerciseId);
      // And nowhere earlier is that exercise done.
      const earlier = works(steps.slice(0, i)).filter((w) => w.exerciseId === intro.exerciseId);
      expect(earlier).toHaveLength(0);
    }
    // Everything else is today's sequence with those two steps taken out.
    expect(steps.filter((s) => s.kind !== 'intro')).toEqual(buildPlayerSteps(base()));
  });

  it('explains a one-movement board and skips a board of several', () => {
    const w = workout({
      id: 'w',
      blocks: [
        block({
          id: 'multi',
          format: 'amrap',
          durationSec: 300,
          items: [item('burpee', { reps: 5 }), item('air_squat', { reps: 10 })],
        }),
        block({ id: 'one', format: 'fortime', durationSec: 300, items: [item('burpee')] }),
      ],
    });
    const p = prescribeWorkout(w, opts, fixtureLookup);
    const steps = buildPlayerSteps({ ...p, intros: { burpee: 'full', air_squat: 'brief' } });
    // `air_squat` appears only on the multi-movement board: no step for it.
    expect(intros(steps).map((s) => [s.exerciseId, s.blockId])).toEqual([['burpee', 'one']]);
    const i = steps.findIndex((s) => s.kind === 'intro');
    expect(steps[i + 1]?.kind).toBe('fortime');
  });

  it('explains every movement of an EMOM or an interval up front, not between its minutes', () => {
    for (const format of ['emom', 'interval'] as const) {
      const w = workout({
        id: 'w',
        blocks: [
          block({
            id: 'b',
            format,
            sets: 4,
            items: [item('burpee', { reps: 5 }), item('air_squat', { reps: 10 })],
          }),
        ],
      });
      const p = prescribeWorkout(w, opts, fixtureLookup);
      const steps = buildPlayerSteps({ ...p, intros: { burpee: 'full', air_squat: 'brief' } });
      expect(kinds(steps).slice(0, 4)).toEqual(['block_intro', 'intro', 'intro', 'work']);
      expect(intros(steps).map((s) => s.exerciseId)).toEqual(['burpee', 'air_squat']);
    }
  });

  it('keeps the warm-up skip after the whole warm-up, its explanations included', () => {
    const p: PrescribedWorkout = { ...base(), intros: { air_squat: 'full', plank: 'brief' } };
    const steps = buildPlayerSteps(p);
    expect(steps[0]).toEqual({
      kind: 'intro',
      blockId: 'warmup',
      exerciseId: 'air_squat',
      tier: 'full',
    });
    const skipTo = warmupSkipIndex(steps, p);
    const plain = buildPlayerSteps(base());
    // Two explanations inside the warm-up: the target moves by exactly those two.
    expect(skipTo).toBe((warmupSkipIndex(plain, base()) ?? -99) + 2);
    expect(steps[skipTo!]).toEqual(plain[skipTo! - 2]);
  });

  it('weighs nothing in completion: explained or not, the same results give the same share', () => {
    const plainP = base();
    const plain = buildPlayerSteps(plainP);
    const withP: PrescribedWorkout = { ...plainP, intros: { push_up: 'full' } };
    const withIntro = buildPlayerSteps(withP);
    // Complete every other work step of the plain list.
    const plainResults = plain
      .map((s, i) => ({ s, i }))
      .filter(({ s }) => s.kind === 'work')
      .filter((_, n) => n % 2 === 0)
      .map(({ s, i }) => ({
        stepIndex: i,
        blockId: (s as { blockId: string }).blockId,
        completed: true,
      }));
    // Rebuilt steps are fresh objects, so match by position instead: intros are the only insertions.
    const map = new Map<number, number>();
    let j = 0;
    withIntro.forEach((s, k) => {
      if (s.kind === 'intro') return;
      map.set(j, k);
      j += 1;
    });
    const moved = plainResults.map((r) => ({ ...r, stepIndex: map.get(r.stepIndex)! }));
    expect(computeCompletion(withIntro, moved)).toBe(computeCompletion(plain, plainResults));
    expect(computeCompletion(withIntro, moved)).toBeGreaterThan(0);
  });

  it('ignores a tier it does not know, as a map from storage might carry', () => {
    const p = { ...base(), intros: { air_squat: 'long' } } as unknown as PrescribedWorkout;
    expect(buildPlayerSteps(p)).toEqual(buildPlayerSteps(base()));
  });
});
