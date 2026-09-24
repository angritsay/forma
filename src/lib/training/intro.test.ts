import { describe, expect, it } from 'vitest';
import type { Exercise, ExerciseIntro } from '@/content/schema';
import { block, fixtureLookup, item, profile, workout } from './fixtures.test-helpers';
import { introExists, introTier, introTierFor, introTiersFor } from './intro';
import { prescribeWorkout } from './prescribe';
import type { ExerciseLookup, PrescribeOptions } from './types';

const FULL: ExerciseIntro = { text: { ru: 'Подробно о позе' } };
const BRIEF: ExerciseIntro = { audio: { ru: 'storage:audio/shared/x.intro-brief.ru.m4a' } };

describe('introTier', () => {
  it('is full the first time, brief the next two, and then nothing', () => {
    expect([0, 1, 2, 3, 4, 50].map(introTier)).toEqual([
      'full',
      'brief',
      'brief',
      null,
      null,
      null,
    ]);
  });

  it('reads a broken count as never seen', () => {
    expect(introTier(Number.NaN)).toBe('full');
    expect(introTier(-3)).toBe('full');
  });
});

describe('introExists', () => {
  it('needs words, a clip or a recording', () => {
    expect(introExists(undefined)).toBe(false);
    expect(introExists({})).toBe(false);
    expect(introExists({ text: { ru: '  ', en: '' } })).toBe(false);
    expect(introExists({ audio: {} })).toBe(false);
    expect(introExists({ video: '' })).toBe(false);
    expect(introExists({ text: { en: 'Breathe' } })).toBe(true);
    expect(introExists({ video: 'storage:videos/shared/x.intro.mp4' })).toBe(true);
    expect(introExists(BRIEF)).toBe(true);
  });
});

describe('introTierFor', () => {
  const at = (ex: Parameters<typeof introTierFor>[0]) =>
    [0, 1, 2, 3].map((n) => introTierFor(ex, n));

  it('both configured: full, brief, brief, nothing', () => {
    expect(at({ introFull: FULL, introBrief: BRIEF })).toEqual(['full', 'brief', 'brief', null]);
  });

  it('only the full one: shown the first time and never again', () => {
    expect(at({ introFull: FULL })).toEqual(['full', null, null, null]);
    expect(at({ introFull: FULL, introBrief: {} })).toEqual(['full', null, null, null]);
  });

  it('only the brief one: shown the first three times', () => {
    expect(at({ introBrief: BRIEF })).toEqual(['brief', 'brief', 'brief', null]);
  });

  it('none, or no exercise at all: nothing', () => {
    expect(at({})).toEqual([null, null, null, null]);
    expect(at(undefined)).toEqual([null, null, null, null]);
  });
});

describe('introTiersFor', () => {
  const opts: PrescribeOptions = { profile: profile(), scale: 1, choice: 'normal', level: 2 };
  const explained = new Set(['air_squat', 'push_up', 'burpee', 'plank']);
  const lookup: ExerciseLookup = (id) => {
    const e = fixtureLookup(id);
    if (!e || !explained.has(id)) return e;
    return { ...e, introFull: FULL, introBrief: BRIEF } satisfies Exercise;
  };

  it('covers every movement done on its own, warm-up included, by the counts given', () => {
    const w = workout({
      id: 'w',
      blocks: [
        block({ id: 'wu', type: 'warmup', format: 'circuit', items: [item('air_squat')] }),
        block({ id: 's', format: 'sets', items: [item('push_up'), item('glute_bridge')] }),
        block({
          id: 'board',
          format: 'amrap',
          durationSec: 300,
          items: [item('burpee'), item('air_squat')],
        }),
        block({ id: 'one', format: 'amrap', durationSec: 300, items: [item('plank')] }),
      ],
    });
    const p = prescribeWorkout(w, opts, fixtureLookup);
    expect(introTiersFor(p, { push_up: 1, plank: 7 }, lookup)).toEqual({
      air_squat: 'full',
      push_up: 'brief',
      // burpee: only on a board of several — not explained.
      // plank: seen enough already. glute_bridge: nothing configured.
    });
  });

  it('decides a movement at its first appearance, even when a later block is a board', () => {
    const w = workout({
      id: 'w',
      blocks: [
        block({
          id: 'board',
          format: 'fortime',
          durationSec: 300,
          items: [item('burpee'), item('push_up')],
        }),
        block({ id: 's', format: 'sets', items: [item('burpee')] }),
      ],
    });
    const p = prescribeWorkout(w, opts, fixtureLookup);
    expect(introTiersFor(p, {}, lookup)).toEqual({ burpee: 'full' });
  });

  it('keys by the movement actually done, not the one written', () => {
    const p = prescribeWorkout(
      workout({ id: 'w', blocks: [block({ id: 's', format: 'sets', items: [item('push_up')] })] }),
      opts,
      fixtureLookup,
    );
    const swapped = {
      ...p,
      blocks: p.blocks.map((b) => ({
        ...b,
        items: b.items.map((it) => ({
          ...it,
          exerciseId: 'glute_bridge',
          originalExerciseId: it.exerciseId,
          substituted: true,
        })),
      })),
    };
    // glute_bridge has no explanation, and push_up's does not follow it across the swap.
    expect(introTiersFor(swapped, {}, lookup)).toEqual({});
  });
});
