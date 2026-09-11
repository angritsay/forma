import { describe, expect, it } from 'vitest';
import { EXERCISE_BY_ID } from '@/content/registry';
import { contraindicationsFor, exerciseVideoRef, stepVideoRef } from './model';
import type { PlayerStep } from '@/lib/training/types';

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

  it('plays it while it is being explained', () => {
    const step = { kind: 'explain', exerciseId: 'air_squat' } as unknown as PlayerStep;
    expect(stepVideoRef(step, 'ru')).toBe(clip);
  });

  it('previews what is coming during rest, not what has just been done', () => {
    const step = { kind: 'rest', nextExerciseId: 'push_up' } as unknown as PlayerStep;
    expect(next).toBeTruthy();
    expect(stepVideoRef(step, 'ru')).toBe(next);
    expect(stepVideoRef(step, 'ru')).not.toBe(clip);
  });

  it('shows nothing on a step that is about a block rather than a movement', () => {
    expect(stepVideoRef({ kind: 'block_intro' } as unknown as PlayerStep, 'ru')).toBeUndefined();
    expect(stepVideoRef({ kind: 'amrap' } as unknown as PlayerStep, 'ru')).toBeUndefined();
    expect(stepVideoRef(undefined, 'ru')).toBeUndefined();
  });
});
