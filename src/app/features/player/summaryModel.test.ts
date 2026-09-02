import { describe, expect, it } from 'vitest';
import { t as translate, type TKey, type TParams } from '@/i18n/index';
import {
  block,
  fixtureLookup,
  FULL_WORKOUT,
  item,
  profile,
  workout,
} from '@/lib/training/fixtures.test-helpers';
import { buildPlayerSteps } from '@/lib/training/player';
import { prescribeWorkout } from '@/lib/training/prescribe';
import { computeCompletion } from '@/lib/training/session';
import type { PlayerResult } from '@/app/store/activeWorkout';
import { setLabel, setsText, skippedResult } from './model';
import {
  benchmarkRecord,
  benchmarkResult,
  blockCompletions,
  elapsedStartedAt,
  testResults,
} from './summaryModel';

const t = (key: TKey, params?: TParams) => translate('en', key, params);
const opts = { profile: profile(), scale: 1, choice: 'normal' as const, level: 2 as const };

const prescribed = prescribeWorkout(FULL_WORKOUT, opts, fixtureLookup);
const steps = buildPlayerSteps(prescribed);

/** Complete every scored step of one block. */
function completeBlock(blockId: string): PlayerResult[] {
  const out: PlayerResult[] = [];
  steps.forEach((s, i) => {
    if (!('blockId' in s) || s.blockId !== blockId) return;
    if (s.kind === 'work') out.push({ stepIndex: i, blockId, exerciseId: s.exerciseId, completed: true });
    if (s.kind === 'amrap') out.push({ stepIndex: i, blockId, completed: true, rounds: 99 });
    if (s.kind === 'fortime') out.push({ stepIndex: i, blockId, completed: true, timeSec: 1 });
  });
  return out;
}

describe('blockCompletions', () => {
  it('reports 1 for fully done blocks, 0 + skipped for untouched ones', () => {
    const results = [...completeBlock('warmup'), ...completeBlock('strength')];
    const blocks = blockCompletions(prescribed, steps, results, t, 'en');
    const byId = new Map(blocks.map((b) => [b.blockId, b]));
    expect(blocks.map((b) => b.blockId)).toEqual(prescribed.blocks.map((b) => b.blockId));
    expect(byId.get('warmup')?.completion).toBe(1);
    expect(byId.get('strength')?.completion).toBe(1);
    expect(byId.get('strength')?.skipped).toBe(false);
    expect(byId.get('metcon')?.completion).toBe(0);
    expect(byId.get('metcon')?.skipped).toBe(true);
    expect(byId.get('warmup')?.title).toBe('Warm-up');
  });

  it('is partial for a half-done AMRAP and consistent with the engine completion', () => {
    const amrapIndex = steps.findIndex((s) => s.kind === 'amrap');
    const amrap = steps[amrapIndex]!;
    if (amrap.kind !== 'amrap') throw new Error('expected amrap');
    const half = Math.max(1, Math.floor(amrap.expectedRounds / 2));
    const results: PlayerResult[] = [
      { stepIndex: amrapIndex, blockId: 'metcon', completed: true, rounds: half, extraReps: 0 },
    ];
    const metcon = blockCompletions(prescribed, steps, results, t, 'en').find(
      (b) => b.blockId === 'metcon',
    )!;
    expect(metcon.completion).toBeGreaterThan(0);
    expect(metcon.completion).toBeLessThan(1);
    expect(metcon.skipped).toBe(false);
    // Only one block has any results, so the engine's weighted total is lower, never higher.
    expect(computeCompletion(steps, results)).toBeLessThanOrEqual(metcon.completion);
  });
});

describe('benchmarkResult / benchmarkRecord', () => {
  it('turns an AMRAP score into rounds + partial reps', () => {
    const amrapIndex = steps.findIndex((s) => s.kind === 'amrap');
    const results: PlayerResult[] = [
      { stepIndex: amrapIndex, blockId: 'metcon', completed: true, rounds: 4, extraReps: 15 },
    ];
    const view = benchmarkResult(steps, results);
    expect(view).toMatchObject({ kind: 'amrap', rounds: 4, extraReps: 15 });
    // burpee 5 + air squat 10 + kb swing 15 = 30 reps per round → 15 extra reps = half a round.
    expect(benchmarkRecord(view!)).toEqual({ value: 4.5, unit: 'rounds' });
  });

  it('records a For-time only when finished under the cap', () => {
    const w = workout({
      id: 'w_ft',
      blocks: [
        block({
          id: 'ft',
          type: 'metcon',
          format: 'fortime',
          sets: 3,
          durationSec: 600,
          items: [item('burpee', { reps: 5 }), item('air_squat', { reps: 10 })],
        }),
      ],
    });
    const p = prescribeWorkout(w, opts, fixtureLookup);
    const s = buildPlayerSteps(p);
    const i = s.findIndex((x) => x.kind === 'fortime');
    const done = benchmarkResult(s, [{ stepIndex: i, blockId: 'ft', completed: true, timeSec: 412 }]);
    expect(done).toMatchObject({ kind: 'fortime', timeSec: 412, completed: true, capSec: 600 });
    expect(benchmarkRecord(done!)).toEqual({ value: 412, unit: 'seconds' });
    const capped = benchmarkResult(s, [{ stepIndex: i, blockId: 'ft', completed: false, timeSec: 600 }]);
    expect(benchmarkRecord(capped!)).toBeNull();
    expect(benchmarkResult(s, [{ stepIndex: i, blockId: 'ft', completed: false, skipped: true }])).toBeNull();
  });
});

describe('testResults', () => {
  it('lists the measurements of test-block steps only', () => {
    const w = workout({
      id: 'w_test',
      blocks: [
        block({
          id: 'warm',
          type: 'warmup',
          format: 'sets',
          sets: 1,
          scalable: false,
          items: [item('air_squat', { reps: 10 })],
        }),
        block({
          id: 'test',
          type: 'test',
          format: 'sets',
          sets: 1,
          scalable: false,
          items: [
            item('push_up', { seconds: 120, restAfterSec: 90 }),
            item('plank', { seconds: 300 }),
          ],
        }),
      ],
    });
    const p = prescribeWorkout(w, opts, fixtureLookup);
    const s = buildPlayerSteps(p);
    const work = s
      .map((x, i) => ({ x, i }))
      .filter(({ x }) => x.kind === 'work')
      .map(({ x, i }) => ({ step: x, i }));
    expect(work).toHaveLength(3);
    const [squat, pushUp, plank] = work as [
      (typeof work)[number],
      (typeof work)[number],
      (typeof work)[number],
    ];
    expect(pushUp.step.kind === 'work' && pushUp.step.mode).toBe('timer');

    const results: PlayerResult[] = [
      { stepIndex: squat.i, blockId: 'warm', exerciseId: 'air_squat', completed: true, achieved: 10 },
      {
        stepIndex: plank.i,
        blockId: 'test',
        exerciseId: 'plank',
        completed: true,
        testValue: 95,
        testUnit: 'seconds',
      },
      {
        stepIndex: pushUp.i,
        blockId: 'test',
        exerciseId: 'push_up',
        completed: true,
        testValue: 27,
        testUnit: 'reps',
      },
    ];
    expect(testResults(p, s, results, 'en').map((r) => [r.exerciseId, r.value, r.unit])).toEqual([
      ['push_up', 27, 'reps'],
      ['plank', 95, 'seconds'],
    ]);
    // The measurement does not distort completion: a done test counts as fully done.
    expect(computeCompletion(s, results)).toBe(1);
  });
});

describe('elapsedStartedAt', () => {
  it('backdates the start by the active seconds', () => {
    expect(elapsedStartedAt('2026-09-01T10:00:00.000Z', 600)).toBe('2026-09-01T09:50:00.000Z');
    expect(elapsedStartedAt('2026-09-01T10:00:00.000Z', 0)).toBeUndefined();
    expect(elapsedStartedAt('not a date', 60)).toBeUndefined();
  });
});

describe('model helpers', () => {
  it('labels sets / rounds / minutes by block format', () => {
    expect(setLabel(t, 'sets', 2, 3)).toBe('Set 2 of 3');
    expect(setLabel(t, 'emom', 4, 12)).toBe('Minute 4 of 12');
    expect(setLabel(t, 'circuit', 1, 3)).toBe('Round 1 of 3');
    expect(setsText(t, 'en', 1)).toBe('1 set');
    expect(setsText((k, p) => translate('ru', k, p), 'ru', 3)).toBe('3 подхода');
  });

  it('builds skipped results for scored steps only', () => {
    const workIndex = steps.findIndex((s) => s.kind === 'work');
    const work = steps[workIndex]!;
    expect(skippedResult(work, workIndex)).toMatchObject({
      stepIndex: workIndex,
      completed: false,
      skipped: true,
    });
    expect(skippedResult(steps[0]!, 0)).toBeNull();
    const restIndex = steps.findIndex((s) => s.kind === 'rest');
    expect(skippedResult(steps[restIndex]!, restIndex)).toBeNull();
  });
});
