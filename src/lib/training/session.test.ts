import { describe, expect, it } from 'vitest';
import { estimateCalories } from './estimate';
import {
  block,
  courseState,
  fixtureLookup,
  item,
  profile,
  summary,
  workout,
} from './fixtures.test-helpers';
import { SAFETY_NOTE } from './messages';
import { buildPlayerSteps } from './player';
import { prescribeWorkout } from './prescribe';
import {
  adaptScale,
  adaptationDelta,
  computeCompletion,
  recommendDifficulty,
  summarizeSession,
} from './session';
import type {
  ExerciseResult,
  PlayerStep,
  PrescribeOptions,
  SessionSummary,
  SummarizeOptions,
} from './types';

const opts: PrescribeOptions = { profile: profile(), scale: 1, choice: 'normal', level: 2 };

/** 2 sets × (push_up 10 reps [20 s], plank 30 s) → work steps at indexes 2, 4, 5, 6. */
const SIMPLE = workout({
  id: 'simple',
  basePoints: 100,
  blocks: [
    block({
      id: 'b',
      format: 'sets',
      sets: 2,
      items: [item('push_up', { reps: 10 }), item('plank', { seconds: 30 })],
    }),
  ],
});
const prescribed = prescribeWorkout(SIMPLE, opts, fixtureLookup);
const steps = buildPlayerSteps(prescribed);
const workIndexes = steps.map((s, i) => (s.kind === 'work' ? i : -1)).filter((i) => i >= 0);

const sopts: SummarizeOptions = {
  courseId: 'c1',
  nodeId: 'n1',
  completedAt: '2026-09-01T10:30:00.000Z',
  exerciseLookup: fixtureLookup,
};
const feedback = { rpe: 6, feeling: 'ok' as const };
const result = (stepIndex: number, o: Partial<ExerciseResult> = {}): ExerciseResult => ({
  stepIndex,
  blockId: 'b',
  completed: true,
  ...o,
});
const allDone = workIndexes.map((i) => result(i));

/** Indexes of every work step, in player order. */
const workIndexesOf = (list: PlayerStep[]) =>
  list.map((s, i) => (s.kind === 'work' ? i : -1)).filter((i) => i >= 0);

const prescribeOne = (b: Parameters<typeof block>[0]) =>
  prescribeWorkout(workout({ id: 'w', blocks: [block(b)] }), opts, fixtureLookup);

describe('computeCompletion', () => {
  it('is 1 when every work step is completed and 0 with no results', () => {
    expect(workIndexes).toEqual([2, 4, 5, 6]);
    expect(computeCompletion(steps, allDone)).toBe(1);
    expect(computeCompletion(steps, [])).toBe(0);
  });

  it('weights partial reps by the estimated seconds of each step', () => {
    const results = [result(2, { achieved: 5 }), result(4), result(5, { achieved: 5 }), result(6)];
    // push_up steps weigh 20 s each at 50%, plank steps 30 s each at 100% → 80 / 100
    expect(computeCompletion(steps, results)).toBe(0.8);
  });

  it('treats skipped and missing steps as 0 and timer achieved as seconds', () => {
    const results = [result(2, { skipped: true }), result(4, { achieved: 15 }), result(5)];
    // 0 × 20 + 0.5 × 30 + 1 × 20 + missing 0 × 30 = 35 / 100
    expect(computeCompletion(steps, results)).toBe(0.35);
    expect(computeCompletion(steps, [result(2, { completed: false })])).toBe(0);
    expect(computeCompletion(steps, [result(2, { achieved: 25 })])).toBe(0.2);
  });

  it('scores AMRAP by rounds + partial reps over expected rounds', () => {
    const amrapSteps: PlayerStep[] = [
      {
        kind: 'block_intro',
        blockId: 'a',
        blockIndex: 0,
        type: 'metcon',
        format: 'amrap',
        sets: 1,
      },
      {
        kind: 'amrap',
        blockId: 'a',
        durationSec: 600,
        expectedRounds: 6,
        items: prescribed.blocks[0]!.items.map((it) => ({ ...it, target: 10 })),
      },
      { kind: 'done' },
    ];
    const r = (o: Partial<ExerciseResult>) =>
      computeCompletion(amrapSteps, [{ stepIndex: 1, blockId: 'a', completed: true, ...o }]);
    expect(r({ rounds: 3 })).toBe(0.5);
    expect(r({ rounds: 3, extraReps: 10 })).toBe(0.58);
    expect(r({ rounds: 9 })).toBe(1);
    expect(r({})).toBe(1);
    expect(r({ completed: false })).toBe(0);
  });

  it('scores For-time: finished → 1, timed out → half of the time share', () => {
    const ftSteps: PlayerStep[] = [
      { kind: 'fortime', blockId: 'f', capSec: 600, rounds: 3, items: prescribed.blocks[0]!.items },
      { kind: 'done' },
    ];
    const r = (o: Partial<ExerciseResult>) =>
      computeCompletion(ftSteps, [{ stepIndex: 0, blockId: 'f', completed: true, ...o }]);
    expect(r({})).toBe(1);
    expect(r({ completed: false, timeSec: 600 })).toBe(0.5);
    expect(r({ completed: false, timeSec: 300 })).toBe(0.25);
    expect(r({ completed: false })).toBe(0);
  });

  it('scores a timer step on its clock: an EMOM minute counts the minute, not the reps', () => {
    const p = prescribeOne({
      id: 'e',
      format: 'emom',
      rounds: 4,
      items: [item('burpee', { reps: 8 })],
    });
    const st = buildPlayerSteps(p);
    const idx = workIndexesOf(st);
    expect(idx).toHaveLength(4);
    const done = (achieved: number) =>
      idx.map((i) => ({ stepIndex: i, blockId: 'e', completed: true, achieved }));
    // The player records the seconds worked; a finished minute is a full minute.
    expect(computeCompletion(st, done(60))).toBe(1);
    expect(computeCompletion(st, done(30))).toBe(0.5);
    // A minute marked done without a number counts in full as well.
    expect(
      computeCompletion(
        st,
        idx.map((i) => ({ stepIndex: i, blockId: 'e', completed: true })),
      ),
    ).toBe(1);
  });

  it('scores a Tabata round on its work interval', () => {
    const p = prescribeOne({
      id: 't',
      format: 'tabata',
      rounds: 4,
      workSec: 20,
      restSec: 10,
      items: [item('air_squat', { reps: 12 })],
    });
    const st = buildPlayerSteps(p);
    const idx = workIndexesOf(st);
    expect(idx).toHaveLength(4);
    const done = idx.map((i) => ({ stepIndex: i, blockId: 't', completed: true, achieved: 20 }));
    expect(computeCompletion(st, done)).toBe(1);
  });

  it('counts a max-effort test step in full whatever number the client records', () => {
    const p = prescribeOne({
      id: 'test',
      type: 'test',
      format: 'sets',
      sets: 1,
      scalable: false,
      items: [item('push_up', { seconds: 120 }), item('plank', { seconds: 60 })],
    });
    const st = buildPlayerSteps(p);
    const idx = workIndexesOf(st);
    // 32 push-ups in the two-minute window: a score, not a fifth of a "target" of 120.
    expect(
      computeCompletion(st, [
        { stepIndex: idx[0]!, blockId: 'test', completed: true, achieved: 32 },
        { stepIndex: idx[1]!, blockId: 'test', completed: true, achieved: 60 },
      ]),
    ).toBe(1);
    // The app records the measurement separately and sends no `achieved` at all.
    expect(
      computeCompletion(st, [
        { stepIndex: idx[0]!, blockId: 'test', completed: true },
        { stepIndex: idx[1]!, blockId: 'test', completed: true },
      ]),
    ).toBe(1);
    // A skipped test still counts as work not done.
    expect(
      computeCompletion(st, [
        { stepIndex: idx[0]!, blockId: 'test', completed: false, skipped: true },
        { stepIndex: idx[1]!, blockId: 'test', completed: true, achieved: 60 },
      ]),
    ).toBe(0.33);
  });

  it('never returns NaN when persisted steps carry broken numbers', () => {
    const broken = steps.map((s) =>
      s.kind === 'work'
        ? { ...s, durationSec: Number.NaN, item: { ...s.item, estimatedSec: Number.NaN } }
        : s,
    );
    const c = computeCompletion(broken, allDone);
    expect(Number.isFinite(c)).toBe(true);
    expect(c).toBe(0);
    const amrapStep: PlayerStep = {
      kind: 'amrap',
      blockId: 'a',
      durationSec: 600,
      expectedRounds: Number.NaN,
      items: prescribed.blocks[0]!.items,
    };
    const c2 = computeCompletion(
      [amrapStep, { kind: 'done' }],
      [{ stepIndex: 0, blockId: 'a', completed: true, rounds: 3 }],
    );
    expect(c2).toBe(1);
  });
});

describe('summarizeSession', () => {
  it('awards full points at completion ≥ 0.95 and proportional points below', () => {
    const full = summarizeSession(prescribed, allDone, feedback, sopts);
    expect(full.completion).toBe(1);
    expect(full.points).toBe(100);
    const partial = summarizeSession(
      prescribed,
      [result(2, { achieved: 5 }), result(4), result(5, { achieved: 5 }), result(6)],
      feedback,
      sopts,
    );
    expect(partial.completion).toBe(0.8);
    expect(partial.points).toBe(80);
    // 9/10 push-ups twice: (18 + 30 + 18 + 30) / 100 = 0.96 → still full points
    const almost = summarizeSession(
      prescribed,
      [result(2, { achieved: 9 }), result(4), result(5, { achieved: 9 }), result(6)],
      feedback,
      sopts,
    );
    expect(almost.completion).toBe(0.96);
    expect(almost.points).toBe(100);
  });

  it('uses the real duration when startedAt is given, otherwise the estimate × completion', () => {
    const real = summarizeSession(prescribed, allDone, feedback, {
      ...sopts,
      startedAt: '2026-09-01T10:00:00.000Z',
    });
    expect(real.durationSec).toBe(1800);
    const est = summarizeSession(prescribed, allDone, feedback, sopts);
    expect(est.durationSec).toBe(prescribed.estimatedSec);
    const half = summarizeSession(
      prescribed,
      [result(2, { achieved: 5 }), result(4), result(5, { achieved: 5 }), result(6)],
      feedback,
      sopts,
    );
    expect(half.durationSec).toBe(Math.round(prescribed.estimatedSec * 0.8));
    const bad = summarizeSession(prescribed, allDone, feedback, {
      ...sopts,
      startedAt: '2026-09-01T11:00:00.000Z',
    });
    expect(bad.durationSec).toBe(prescribed.estimatedSec);
  });

  it('scales calories by completion and body weight', () => {
    const full = summarizeSession(prescribed, allDone, feedback, { ...sopts, weightKg: 80 });
    expect(full.calories).toBe(estimateCalories(prescribed, 80, fixtureLookup));
    const none = summarizeSession(prescribed, [], feedback, sopts);
    expect(none.calories).toBe(0);
    expect(none.points).toBe(0);
  });

  it('copies identifiers and feedback, clamping RPE to 1..10', () => {
    const s = summarizeSession(
      prescribed,
      allDone,
      { rpe: 14, feeling: 'hard', note: 'x' },
      { ...sopts, sessionId: 'sess-1' },
    );
    expect(s.sessionId).toBe('sess-1');
    expect(s.courseId).toBe('c1');
    expect(s.nodeId).toBe('n1');
    expect(s.workoutId).toBe('simple');
    expect(s.choice).toBe('normal');
    expect(s.scale).toBe(1);
    expect(s.rpe).toBe(10);
    expect(s.feeling).toBe('hard');
    expect(s.completedAt).toBe(sopts.completedAt);
    expect(summarizeSession(prescribed, allDone, { rpe: 0, feeling: 'great' }, sopts).rpe).toBe(1);
  });

  it('accepts pre-built steps so results always match the persisted player', () => {
    const s = summarizeSession(prescribed, allDone, feedback, { ...sopts, steps });
    expect(s.completion).toBe(1);
  });
});

describe('adaptScale', () => {
  const state = courseState({ scale: 1 });

  it('follows the adaptation table', () => {
    expect(adaptationDelta(summary({ completion: 1, rpe: 5 }))).toEqual({
      delta: 0.05,
      reason: 'up5',
    });
    expect(adaptationDelta(summary({ completion: 0.95, rpe: 6 }))).toEqual({
      delta: 0.05,
      reason: 'up5',
    });
    expect(adaptationDelta(summary({ completion: 0.92, rpe: 7 }))).toEqual({
      delta: 0.02,
      reason: 'up2',
    });
    expect(adaptationDelta(summary({ completion: 1, rpe: 8 }))).toEqual({
      delta: 0.02,
      reason: 'up2',
    });
    expect(adaptationDelta(summary({ completion: 0.85, rpe: 8 }))).toEqual({
      delta: 0,
      reason: 'keep',
    });
    expect(adaptationDelta(summary({ completion: 0.92, rpe: 5 }))).toEqual({
      delta: 0,
      reason: 'keep',
    });
    expect(adaptationDelta(summary({ completion: 1, rpe: 9 }))).toEqual({
      delta: -0.05,
      reason: 'down5',
    });
    expect(adaptationDelta(summary({ completion: 0.7, rpe: 4 }))).toEqual({
      delta: -0.05,
      reason: 'down5',
    });
    expect(adaptationDelta(summary({ completion: 1, rpe: 3, feeling: 'pain' }))).toEqual({
      delta: -0.1,
      reason: 'pain',
    });
  });

  it('applies the delta with two-decimal rounding and localized reasons', () => {
    const up = adaptScale(state, summary({ completion: 1, rpe: 5 }));
    expect(up).toMatchObject({ scale: 1.05, delta: 0.05 });
    expect(up.reason.en).toMatch(/5%/);
    expect(up.reason.ru).toMatch(/5%/);
    expect(up.safetyNote).toBeUndefined();
    const down = adaptScale(courseState({ scale: 0.85 }), summary({ completion: 0.5, rpe: 9 }));
    expect(down).toMatchObject({ scale: 0.8, delta: -0.05 });
    const fine = adaptScale(courseState({ scale: 0.85 }), summary({ completion: 1, rpe: 6 }));
    expect(fine.scale).toBe(0.9);
  });

  it('clamps to 0.5..1.5 and explains when the edge is reached', () => {
    const top = adaptScale(courseState({ scale: 1.5 }), summary({ completion: 1, rpe: 4 }));
    expect(top).toMatchObject({ scale: 1.5, delta: 0 });
    expect(top.reason.en).toMatch(/top of the scale/i);
    const nearTop = adaptScale(courseState({ scale: 1.48 }), summary({ completion: 1, rpe: 4 }));
    expect(nearTop).toMatchObject({ scale: 1.5, delta: 0.02 });
    const bottom = adaptScale(courseState({ scale: 0.5 }), summary({ completion: 0.4, rpe: 9 }));
    expect(bottom).toMatchObject({ scale: 0.5, delta: 0 });
    expect(bottom.reason.en).toMatch(/bottom of the scale/i);
    expect(adaptScale(courseState({ scale: 3 }), summary({ completion: 1, rpe: 4 })).scale).toBe(
      1.5,
    );
  });

  it('returns the safety note on pain, even at the bottom of the scale', () => {
    const pain = adaptScale(state, summary({ completion: 1, rpe: 3, feeling: 'pain' }));
    expect(pain).toMatchObject({ scale: 0.9, delta: -0.1 });
    expect(pain.safetyNote).toEqual(SAFETY_NOTE);
    const floor = adaptScale(courseState({ scale: 0.5 }), summary({ feeling: 'pain' }));
    expect(floor.safetyNote).toEqual(SAFETY_NOTE);
    expect(floor.reason.en).toMatch(/pain/i);
  });
});

describe('recommendDifficulty', () => {
  const now = '2026-09-05T10:00:00.000Z';
  const easy = (completedAt: string, o: Partial<SessionSummary> = {}) =>
    summary({ rpe: 5, completion: 1, completedAt, ...o });
  const hist = (...h: SessionSummary[]) => courseState({ history: h });
  const p = profile();

  it('is "normal" for the first session', () => {
    const r = recommendDifficulty(courseState(), p, now);
    expect(r.choice).toBe('normal');
    expect(r.reason.en).toMatch(/first session/i);
    expect(r.reason.ru.length).toBeGreaterThan(0);
  });

  it('is "harder" after two easy, complete sessions with ≥ 48 h of rest', () => {
    const r = recommendDifficulty(
      hist(easy('2026-08-30T10:00:00.000Z'), easy('2026-09-02T10:00:00.000Z')),
      p,
      now,
    );
    expect(r.choice).toBe('harder');
    expect(r.reason.en).toMatch(/48 hours/);
  });

  it('is not "harder" with only one easy session or an RPE 7 in the last two', () => {
    expect(recommendDifficulty(hist(easy('2026-09-02T10:00:00.000Z')), p, now).choice).toBe(
      'normal',
    );
    const mixed = hist(
      easy('2026-08-30T10:00:00.000Z', { rpe: 7 }),
      easy('2026-09-02T10:00:00.000Z'),
    );
    expect(recommendDifficulty(mixed, p, now).choice).toBe('normal');
  });

  it('is "easier" after a maximal, incomplete or painful session', () => {
    expect(
      recommendDifficulty(hist(easy('2026-09-02T10:00:00.000Z', { rpe: 9 })), p, now),
    ).toMatchObject({ choice: 'easier' });
    expect(
      recommendDifficulty(hist(easy('2026-09-02T10:00:00.000Z', { completion: 0.7 })), p, now)
        .reason.en,
    ).toMatch(/80%/);
    expect(
      recommendDifficulty(hist(easy('2026-09-02T10:00:00.000Z', { feeling: 'pain' })), p, now)
        .reason.en,
    ).toMatch(/pain/i);
  });

  it('is "easier" when less than 24 h passed or after a 15 000-step day', () => {
    const soon = recommendDifficulty(hist(easy('2026-09-05T00:00:00.000Z')), p, now);
    expect(soon.choice).toBe('easier');
    expect(soon.reason.en).toMatch(/24 hours/);
    const walked = recommendDifficulty(hist(easy('2026-09-02T10:00:00.000Z')), p, now, {
      stepsYesterday: 15000,
    });
    expect(walked.choice).toBe('easier');
    expect(walked.reason.en).toMatch(/15,000/);
    expect(
      recommendDifficulty(hist(easy('2026-09-02T10:00:00.000Z')), p, now, { stepsYesterday: 14999 })
        .choice,
    ).toBe('normal');
  });

  it('is "normal" between 24 and 48 h even when the last sessions were easy', () => {
    const r = recommendDifficulty(
      hist(easy('2026-09-01T10:00:00.000Z'), easy('2026-09-04T00:00:00.000Z')),
      p,
      now,
    );
    expect(r.choice).toBe('normal');
    expect(r.reason.en).toMatch(/as usual/i);
  });

  it('sorts unsorted history by completedAt before looking at the last session', () => {
    const unsorted = hist(
      easy('2026-09-02T10:00:00.000Z', { rpe: 9 }),
      easy('2026-08-28T10:00:00.000Z'),
    );
    expect(recommendDifficulty(unsorted, p, now).choice).toBe('easier');
  });

  it('never recommends "harder" when one of the last two sessions reported pain', () => {
    const r = recommendDifficulty(
      hist(easy('2026-08-30T10:00:00.000Z', { feeling: 'pain' }), easy('2026-09-02T10:00:00.000Z')),
      p,
      now,
    );
    expect(r.choice).toBe('normal');
  });

  it('orders history chronologically even when timestamps carry different offsets', () => {
    // 2026-09-03T23:00+03:00 is 20:00Z — the 21:00Z session is the more recent one.
    const state = hist(easy('2026-09-03T21:00:00Z', { rpe: 9 }), easy('2026-09-03T23:00:00+03:00'));
    expect(recommendDifficulty(state, p, now).choice).toBe('easier');
  });

  it('always keeps pregnancy at "easier"', () => {
    const pg = profile({ limitations: ['pregnancy'] });
    const r = recommendDifficulty(
      hist(easy('2026-08-30T10:00:00.000Z'), easy('2026-09-02T10:00:00.000Z')),
      pg,
      now,
    );
    expect(r.choice).toBe('easier');
    expect(r.reason.ru).toMatch(/беременност/i);
  });
});
