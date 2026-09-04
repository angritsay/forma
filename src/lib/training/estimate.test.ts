import { describe, expect, it } from 'vitest';
import { DEFAULT_WEIGHT_KG, REST_MET } from './constants';
import { estimateCalories, estimateDuration, estimatePoints, streakBonus } from './estimate';
import {
  block,
  fixtureLookup,
  FULL_WORKOUT,
  item,
  profile,
  workout,
} from './fixtures.test-helpers';
import { buildPlayerSteps } from './player';
import { prescribeWorkout } from './prescribe';
import type { PrescribeOptions } from './types';

const opts: PrescribeOptions = { profile: profile(), scale: 1, choice: 'normal', level: 2 };
const prescribe = (w = FULL_WORKOUT) => prescribeWorkout(w, opts, fixtureLookup);
const one = (b: Parameters<typeof block>[0]) => prescribe(workout({ id: 'w', blocks: [block(b)] }));

describe('estimateDuration', () => {
  it('sets: sets × (work + restAfter + transitions) + (sets − 1) × rest + intro', () => {
    // push_up 10 × 2 s = 20 (+30 rest), goblet 12 × 3 s = 36; 3 sets, 60 s between
    const d = estimateDuration(prescribe()).perBlock[1]!;
    expect(d.sec).toBe(3 * (56 + 30 + 16) + 2 * 60 + 20);
  });

  it('reports the work / rest split and per-block breakdown matching the prescription', () => {
    const p = prescribe();
    const d = estimateDuration(p);
    expect(d.perBlock.map((b) => b.blockId)).toEqual([
      'warmup',
      'strength',
      'metcon',
      'core',
      'cooldown',
    ]);
    expect(d.perBlock.map((b) => b.sec)).toEqual(p.blocks.map((b) => b.estimatedSec));
    expect(d.totalSec).toBe(p.estimatedSec);
    expect(d.workSec + d.restSec).toBeLessThanOrEqual(d.totalSec);
    expect(d.workSec).toBeGreaterThan(0);
    expect(d.restSec).toBeGreaterThan(0);
  });

  it('amrap and emom are format-fixed with a 70/30 split', () => {
    const a = estimateDuration(
      one({ id: 'a', format: 'amrap', durationSec: 600, items: [item('burpee')] }),
    );
    expect(a.totalSec).toBe(620);
    expect(a.workSec).toBe(420);
    expect(a.restSec).toBe(180);
    const e = estimateDuration(
      one({ id: 'e', format: 'emom', rounds: 10, items: [item('burpee'), item('air_squat')] }),
    );
    expect(e.totalSec).toBe(620);
    expect(e.workSec).toBe(420);
  });

  it('tabata and interval: rounds × work × items plus the rests the player actually plays', () => {
    const t = estimateDuration(
      one({
        id: 't',
        format: 'tabata',
        rounds: 8,
        workSec: 20,
        restSec: 10,
        items: [item('plank', { seconds: 20 })],
      }),
    );
    // 8 × 20 s work, 7 rests of 10 s (no trailing rest), 20 s intro
    expect(t.totalSec).toBe(250);
    expect(t.workSec).toBe(160);
    expect(t.restSec).toBe(70);
    const t2 = estimateDuration(
      one({
        id: 't',
        format: 'tabata',
        rounds: 8,
        workSec: 20,
        restSec: 10,
        items: [item('plank', { seconds: 20 }), item('air_squat', { reps: 10 })],
      }),
    );
    // two Tabatas: 2 × 8 × 20 s work, 2 × 7 rests + one 10 s gap between them
    expect(t2.totalSec).toBe(490);
    const i = estimateDuration(
      one({
        id: 'i',
        format: 'interval',
        rounds: 4,
        workSec: 40,
        restSec: 20,
        items: [item('run', { meters: 100 }), item('burpee', { reps: 5 })],
      }),
    );
    // 8 work intervals of 40 s, 7 rests of 20 s
    expect(i.totalSec).toBe(480);
  });

  it('uses the format defaults when a tabata block omits work and rest seconds', () => {
    const d = estimateDuration(
      one({ id: 't', format: 'tabata', rounds: 8, items: [item('air_squat', { reps: 10 })] }),
    );
    expect(d.workSec).toBe(160);
    expect(d.restSec).toBe(70);
  });

  it('never counts a rest the player skips (trailing rests, last set, last round)', () => {
    const w = workout({
      id: 'w',
      blocks: [
        block({
          id: 's',
          format: 'sets',
          sets: 3,
          restBetweenSetsSec: 60,
          items: [
            item('push_up', { reps: 10, restAfterSec: 30 }),
            item('air_squat', { reps: 15, restAfterSec: 45 }),
          ],
        }),
        block({
          id: 't',
          format: 'tabata',
          rounds: 8,
          workSec: 20,
          restSec: 10,
          restBetweenRoundsSec: 60,
          items: [item('air_squat', { reps: 10 }), item('burpee', { reps: 5 })],
        }),
        block({
          id: 'i',
          format: 'interval',
          rounds: 4,
          workSec: 40,
          restSec: 20,
          items: [item('run', { meters: 100 }), item('burpee', { reps: 5 })],
        }),
      ],
    });
    const p = prescribe(w);
    const played = buildPlayerSteps(p)
      .filter((s) => s.kind === 'rest')
      .reduce((total, s) => total + (s.kind === 'rest' ? s.durationSec : 0), 0);
    // 3 × 30 + 2 × 60 | 2 × 7 × 10 + 60 gap | 7 × 20
    expect(played).toBe(210 + 200 + 140);
    expect(estimateDuration(p).restSec).toBe(played);
  });

  it('fortime: estimated work × 1.15 + rest between rounds, capped by durationSec', () => {
    const items = [item('burpee', { reps: 10 }), item('air_squat', { reps: 15 })];
    const open = estimateDuration(
      one({
        id: 'f',
        format: 'fortime',
        sets: 3,
        durationSec: 900,
        restBetweenRoundsSec: 30,
        items,
      }),
    );
    // (40 + 37.5) × 3 × 1.15 = 267.375 + 2 × 30 = 327.375 + 20 intro
    expect(open.totalSec).toBe(347);
    const capped = estimateDuration(
      one({
        id: 'f',
        format: 'fortime',
        sets: 3,
        durationSec: 200,
        restBetweenRoundsSec: 30,
        items,
      }),
    );
    expect(capped.totalSec).toBe(220);
    expect(capped.workSec + capped.restSec).toBe(200);
  });

  it('accepts an empty workout gracefully', () => {
    const p = { ...prescribe(), blocks: [] };
    expect(estimateDuration(p)).toEqual({ totalSec: 0, workSec: 0, restSec: 0, perBlock: [] });
  });
});

describe('estimateCalories', () => {
  it('uses MET × kg × hours for work and REST_MET for rest, transitions and intros', () => {
    const p = one({ id: 'c', format: 'sets', sets: 1, items: [item('plank', { seconds: 60 })] });
    const work = (3.8 * 70 * 60) / 3600;
    const rest = (REST_MET * 70 * 28) / 3600;
    expect(estimateCalories(p, 70, fixtureLookup)).toBe(Math.round(work + rest));
  });

  it('splits AMRAP time 70/30 between work and rest', () => {
    const p = one({ id: 'a', format: 'amrap', durationSec: 600, items: [item('burpee')] });
    const work = (10 * 70 * 420) / 3600;
    const rest = (REST_MET * 70 * (180 + 20)) / 3600;
    expect(estimateCalories(p, 70, fixtureLookup)).toBe(Math.round(work + rest));
  });

  it('scales with body weight and falls back to the default weight', () => {
    const p = prescribe();
    const at70 = estimateCalories(p, 70, fixtureLookup);
    const at90 = estimateCalories(p, 90, fixtureLookup);
    expect(at90).toBeGreaterThan(at70);
    expect(Math.abs(at90 / at70 - 90 / 70)).toBeLessThan(0.02);
    expect(estimateCalories(p, undefined, fixtureLookup)).toBe(
      estimateCalories(p, DEFAULT_WEIGHT_KG, fixtureLookup),
    );
    expect(estimateCalories(p, 0, fixtureLookup)).toBe(at70);
  });

  it('uses a default MET when an exercise is unknown', () => {
    const p = one({ id: 'x', format: 'sets', sets: 1, items: [item('mystery', { reps: 10 })] });
    expect(estimateCalories(p, 70, fixtureLookup)).toBeGreaterThan(0);
  });
});

describe('estimatePoints', () => {
  it('applies choice, repeat and streak multipliers', () => {
    expect(estimatePoints(FULL_WORKOUT, 'normal')).toBe(120);
    expect(estimatePoints(FULL_WORKOUT, 'harder')).toBe(150);
    expect(estimatePoints(FULL_WORKOUT, 'easier')).toBe(96);
    expect(estimatePoints(FULL_WORKOUT, 'normal', { repeat: true })).toBe(60);
    expect(estimatePoints(FULL_WORKOUT, 'normal', { streakDays: 7 })).toBe(132);
    expect(estimatePoints(FULL_WORKOUT, 'normal', { streakDays: 30 })).toBe(144);
    expect(estimatePoints(FULL_WORKOUT, 'harder', { repeat: true, streakDays: 30 })).toBe(90);
  });

  it('streak bonus tiers: 0 below 7, 10% at 7..29, 20% at 30+', () => {
    expect(streakBonus(undefined)).toBe(0);
    expect(streakBonus(6)).toBe(0);
    expect(streakBonus(7)).toBe(0.1);
    expect(streakBonus(29)).toBe(0.1);
    expect(streakBonus(30)).toBe(0.2);
    expect(streakBonus(365)).toBe(0.2);
  });
});
