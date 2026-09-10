import { describe, expect, it } from 'vitest';
import { EXERCISE_BY_ID } from '@/content/registry';
import { contraindicationsFor, exerciseVideoRef } from './model';

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
