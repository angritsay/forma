import { describe, expect, it } from 'vitest';
import { EXERCISE_BY_ID } from '@/content/registry';
import {
  contraindicationsFor,
  exerciseVideoRef,
  firstFilmedIndex,
  sessionVideoRefs,
  stepArtExerciseId,
  stepVideoRef,
} from './model';
import type { PlayerStep, PrescribedItem, PrescribedWorkout } from '@/lib/training/types';

const ex = (id: string) => {
  const e = EXERCISE_BY_ID.get(id);
  if (!e) throw new Error(`fixture exercise missing: ${id}`);
  return e;
};

describe('contraindicationsFor', () => {
  it('reads the engine rules: jumps for knees, floor work on the hands for wrists', () => {
    expect(contraindicationsFor(ex('tuck_jump'))).toContain('knees');
    expect(contraindicationsFor(ex('push_up'))).toContain('wrists');
  });
  it('lists hypertension for isometric holds, which the engine caps rather than swaps', () => {
    expect(contraindicationsFor(ex('plank'))).toContain('hypertension');
  });
  it('is empty for a plain movement with no rule attached', () => {
    // A bodyweight squat: no jump, no hinge under load, nothing overhead, not on the hands.
    expect(contraindicationsFor(ex('air_squat'))).toEqual([]);
  });
});

describe('exerciseVideoRef', () => {
  it('falls back to the Russian clip when the locale has no recording of its own', () => {
    const ruOnly = ex('air_squat');
    expect(ruOnly.video?.ru).toBeTruthy();
    expect(exerciseVideoRef('air_squat', 'en')).toBe(ruOnly.video?.ru);
  });
  it('is undefined for an unknown id or an exercise without video', () => {
    expect(exerciseVideoRef(undefined, 'ru')).toBeUndefined();
    expect(exerciseVideoRef('no_such_exercise', 'ru')).toBeUndefined();
  });
});

describe('stepVideoRef', () => {
  const clip = exerciseVideoRef('air_squat', 'ru');
  const next = exerciseVideoRef('push_up', 'ru');

  /*
   * The one the athlete actually asked for. Work carried the drawn figure while the coach's own
   * recording of that exact movement sat unused — the clips are the movement, not a separate
   * explanation, so the moment of doing it is exactly when it should be on screen.
   */
  it('plays the exercise while it is being done', () => {
    const step = { kind: 'work', exerciseId: 'air_squat' } as unknown as PlayerStep;
    expect(clip).toBeTruthy();
    expect(stepVideoRef(step, 'ru')).toBe(clip);
  });

  it('previews what is coming during rest, not what has just been done', () => {
    const step = { kind: 'rest', nextExerciseId: 'push_up' } as unknown as PlayerStep;
    expect(next).toBeTruthy();
    expect(stepVideoRef(step, 'ru')).toBe(next);
    expect(stepVideoRef(step, 'ru')).not.toBe(clip);
  });

  it('shows nothing when there is no step', () => {
    expect(stepVideoRef(undefined, 'ru')).toBeUndefined();
    expect(stepVideoRef({ kind: 'done' } as PlayerStep, 'ru')).toBeUndefined();
  });
});

/*
 * The owner's screenshot: an AMRAP step with a clock, «Круги 0» and a black middle. A step about a
 * whole block used to get no clip at all; it now plays the first movement on its board that has
 * one, and a tap on a row switches to that row's.
 */
describe('stepVideoRef on a board', () => {
  const item = (exerciseId: string) => ({ exerciseId }) as unknown as PrescribedItem;
  // An unknown id stands in for a movement nobody has filmed yet.
  const items = [item('no_such_exercise'), item('air_squat'), item('push_up')];
  const squat = exerciseVideoRef('air_squat', 'ru');
  const pushUp = exerciseVideoRef('push_up', 'ru');
  const prescribed = {
    blocks: [{ blockId: 'b1', items }],
  } as unknown as PrescribedWorkout;

  it('plays the first filmed movement of an AMRAP and a for-time piece', () => {
    expect(firstFilmedIndex(items, 'ru')).toBe(1);
    expect(stepVideoRef({ kind: 'amrap', items } as unknown as PlayerStep, 'ru')).toBe(squat);
    expect(stepVideoRef({ kind: 'fortime', items } as unknown as PlayerStep, 'ru')).toBe(squat);
  });

  it('plays the row the athlete picked', () => {
    const step = { kind: 'amrap', items } as unknown as PlayerStep;
    expect(stepVideoRef(step, 'ru', prescribed, 2)).toBe(pushUp);
    expect(stepArtExerciseId(step, prescribed, 'ru', 2)).toBe('push_up');
    // A row with no footage plays nothing rather than someone else's clip.
    expect(stepVideoRef(step, 'ru', prescribed, 0)).toBeUndefined();
  });

  it("plays the block's first filmed movement on its title card", () => {
    const intro = { kind: 'block_intro', blockId: 'b1' } as unknown as PlayerStep;
    expect(stepVideoRef(intro, 'ru', prescribed)).toBe(squat);
    expect(stepArtExerciseId(intro, prescribed, 'ru')).toBe('air_squat');
    // Without the prescription there is no block to look in.
    expect(stepVideoRef(intro, 'ru')).toBeUndefined();
  });

  it('lists every clip of the session once, for signing in one go', () => {
    const twice = {
      blocks: [
        { blockId: 'b1', items },
        { blockId: 'b2', items: [item('air_squat')] },
      ],
    } as unknown as PrescribedWorkout;
    expect(sessionVideoRefs(twice, 'ru')).toEqual([squat, pushUp]);
  });
});
