import { describe, expect, it } from 'vitest';
import type { Exercise, Level } from '@/content/schema';
import {
  comfortFor,
  hardSession,
  referenceComfort,
  targetFor,
  twoForTwo,
  updateComfort,
  type ComfortEntry,
  type ComfortMap,
} from './comfort';

/** A library stub: only the four fields the model reads. */
function lib(defs: Record<string, { pattern: string; ref?: Partial<Record<Level, number>> }>) {
  const exercise = (id: string) => {
    const d = defs[id];
    if (!d) return undefined;
    return { id, pattern: d.pattern, comfortRef: d.ref } as unknown as Exercise;
  };
  return { exercise };
}

const LIBRARY = lib({
  air_squat: { pattern: 'squat', ref: { 1: 12, 2: 20 } },
  reverse_lunge: { pattern: 'lunge', ref: { 1: 12 } },
  knee_push_up: { pattern: 'push_horizontal', ref: { 1: 10 } },
  chair_dip: { pattern: 'push_horizontal', ref: { 1: 11 } },
  plank: { pattern: 'core_anti_extension', ref: { 1: 45 } },
  sit_up: { pattern: 'core_flexion', ref: { 1: 7 } },
  no_ref: { pattern: 'squat' },
});

/** The same library plus one push movement nobody has ever done, for the borrowing tests. */
const LIBRARY_PLUS = lib({
  air_squat: { pattern: 'squat', ref: { 1: 12, 2: 20 } },
  knee_push_up: { pattern: 'push_horizontal', ref: { 1: 10 } },
  chair_dip: { pattern: 'push_horizontal', ref: { 1: 11 } },
  pike_push_up: { pattern: 'push_horizontal', ref: { 1: 8 } },
});

describe('targetFor', () => {
  /*
   * The invariant the whole design rests on. An athlete exactly average for the course's level gets
   * the coach's programme, to the rep. If this ever fails, the engine has started writing its own
   * programme instead of adapting his.
   */
  it('returns the authored number untouched for an average athlete at «нормально»', () => {
    for (const authored of [1, 5, 8, 13, 15, 30, 60]) {
      expect(targetFor(authored, 1, 'normal')).toBe(authored);
    }
  });

  it('reproduces the owner’s example: comfortable 10 → 10 / 12 / 15', () => {
    // The coach authored 15 squats as «нормально» for a standard beginner whose comfort is 12.
    const ratio = 10 / 12;
    expect(targetFor(15, ratio, 'easier')).toBe(10);
    expect(targetFor(15, ratio, 'normal')).toBe(13);
    expect(targetFor(15, ratio, 'harder')).toBe(15);
  });

  it('never leaves the coach’s range — the dead bug that started all this', () => {
    // Authored 30, the coach's own note says 20-40, a strong athlete's ratio is 1.4.
    expect(targetFor(30, 1.4, 'harder')).toBe(49); // unbounded, this is the number that was wrong
    expect(targetFor(30, 1.4, 'harder', { min: 20, max: 40 })).toBe(40);
    expect(targetFor(30, 0.3, 'easier', { min: 20, max: 40 })).toBe(20);
  });

  it('is monotonic in both the ratio and the mode', () => {
    const ratios = [0.5, 0.8, 1, 1.3, 1.8];
    for (let i = 1; i < ratios.length; i++) {
      expect(targetFor(20, ratios[i]!, 'normal')).toBeGreaterThanOrEqual(
        targetFor(20, ratios[i - 1]!, 'normal'),
      );
    }
    expect(targetFor(20, 1, 'easier')).toBeLessThan(targetFor(20, 1, 'normal'));
    expect(targetFor(20, 1, 'normal')).toBeLessThan(targetFor(20, 1, 'harder'));
  });

  it('never asks for less than one rep, whatever the numbers say', () => {
    expect(targetFor(1, 0.4, 'easier')).toBe(1);
    expect(targetFor(2, 0.4, 'easier', { max: 1 })).toBe(1);
  });

  it('survives nonsense rather than spreading NaN through the prescription', () => {
    expect(targetFor(Number.NaN, 1, 'normal')).toBe(1);
    expect(targetFor(10, Number.NaN, 'normal')).toBe(10);
    expect(targetFor(10, 0, 'normal')).toBe(10);
  });
});

describe('referenceComfort', () => {
  it('reads the level asked for', () => {
    expect(referenceComfort(LIBRARY.exercise('air_squat'), 1)).toBe(12);
    expect(referenceComfort(LIBRARY.exercise('air_squat'), 2)).toBe(20);
  });

  it('falls back to the nearest level rather than to nothing', () => {
    expect(referenceComfort(LIBRARY.exercise('reverse_lunge'), 3)).toBe(12);
  });

  it('is undefined when nobody has said what average looks like', () => {
    expect(referenceComfort(LIBRARY.exercise('no_ref'), 1)).toBeUndefined();
    expect(referenceComfort(undefined, 1)).toBeUndefined();
  });
});

describe('comfortFor', () => {
  const observed: ComfortMap = {
    air_squat: { comfort: 10, observations: 4 },
    knee_push_up: { comfort: 20, observations: 4 },
  };

  it('uses the movement’s own observations when it has them', () => {
    const c = comfortFor('air_squat', observed, 1, LIBRARY);
    expect(c).toEqual({ value: 10, source: 'observed', ratio: 10 / 12 });
  });

  it('borrows from the same pattern, shrunk toward average', () => {
    // Nothing for chair_dip, but knee_push_up (same pattern) sits at 2.0 of average.
    const c = comfortFor('chair_dip', observed, 1, LIBRARY);
    expect(c.source).toBe('pattern');
    // 1 + 0.7 × (2.0 − 1) = 1.7, and 11 × 1.7 = 18.7 — not 22, which full confidence would give.
    expect(c.ratio).toBeCloseTo(1.7, 5);
    expect(c.value).toBeCloseTo(18.7, 5);
  });

  it('shrinks a cross-pattern borrow much harder', () => {
    // A plank says nothing direct about sit-ups: different pattern, so λ = 0.4 not 0.7.
    const strongPlank: ComfortMap = { plank: { comfort: 90, observations: 3 } };
    const c = comfortFor('sit_up', strongPlank, 1, LIBRARY);
    expect(c.source).toBe('pattern');
    // The plank ratio is 2.0 (clamped from 90/45); 1 + 0.4 × 1.0 = 1.4.
    expect(c.ratio).toBeCloseTo(1.4, 5);
  });

  it('caps an inferred ratio so one outlier cannot carry a whole profile', () => {
    const superhuman: ComfortMap = { knee_push_up: { comfort: 200, observations: 9 } };
    const c = comfortFor('chair_dip', superhuman, 1, LIBRARY);
    expect(c.ratio).toBeLessThanOrEqual(1.8);
  });

  it('falls back to the standard person when it knows nothing at all', () => {
    const c = comfortFor('air_squat', {}, 1, LIBRARY);
    expect(c).toEqual({ value: 12, source: 'reference', ratio: 1 });
  });

  it('weights a borrow by confidence, so one hesitant guess does not outvote eight sessions', () => {
    const loud: ComfortMap = {
      knee_push_up: { comfort: 20, observations: 8 }, // ratio 2.0, well established
      chair_dip: { comfort: 5.5, observations: 1 }, // ratio 0.5, seen once
    };
    const quiet: ComfortMap = {
      knee_push_up: { comfort: 20, observations: 1 },
      chair_dip: { comfort: 5.5, observations: 8 },
    };
    // Same two movements, same two ratios — only the confidence differs, and it decides.
    expect(comfortFor('pike_push_up', loud, 1, LIBRARY_PLUS).ratio).toBeGreaterThan(
      comfortFor('pike_push_up', quiet, 1, LIBRARY_PLUS).ratio,
    );
  });
});

describe('updateComfort — the censoring problem', () => {
  const base: ComfortEntry = { comfort: 12, observations: 3 };

  it('learns NOTHING when the athlete simply hits the target', () => {
    const { entry, update } = updateComfort(base, {
      exerciseId: 'air_squat',
      target: 12,
      achieved: 12,
      choice: 'normal',
    });
    expect(update.reason).toBe('hold');
    expect(entry).toEqual(base);
  });

  it('moves up when they do more than asked', () => {
    const { entry, update } = updateComfort(base, {
      exerciseId: 'air_squat',
      target: 12,
      achieved: 16,
      choice: 'normal',
    });
    expect(update.reason).toBe('over');
    expect(entry.comfort).toBeGreaterThan(12);
    expect(entry.observations).toBe(4);
  });

  it('drops decisively on a shortfall rather than inching', () => {
    const { entry, update } = updateComfort(base, {
      exerciseId: 'air_squat',
      target: 12,
      achieved: 7,
      choice: 'normal',
    });
    expect(update.reason).toBe('short');
    // The exponential average alone would have given 10.8 — one rep off the target they just
    // failed, so they would fail again. The shortfall pulls to what happened and the asymmetric
    // clamp lets it fall a quarter in one go: 9, which they can actually do.
    expect(entry.comfort).toBeCloseTo(9, 5);
  });

  it('falls further in one session than it can rise, because the two errors differ in cost', () => {
    const down = updateComfort(
      { comfort: 20, observations: 0 },
      {
        exerciseId: 'air_squat',
        target: 20,
        achieved: 2,
        choice: 'normal',
      },
    ).entry.comfort;
    const up = updateComfort(
      { comfort: 20, observations: 0 },
      {
        exerciseId: 'air_squat',
        target: 20,
        achieved: 90,
        choice: 'normal',
      },
    ).entry.comfort;
    expect(20 - down).toBeGreaterThan(up - 20);
  });

  it('treats a real measurement as uncensored even when it equals the target', () => {
    const { update } = updateComfort(base, {
      exerciseId: 'air_squat',
      target: 12,
      achieved: 12,
      choice: 'normal',
      measured: true,
    });
    expect(update.reason).toBe('measured');
  });

  it('reads the achieved number back through the mode it was prescribed at', () => {
    // 10 done at «полегче» means comfort ≈ 10/0.83 ≈ 12, not 10.
    const { entry } = updateComfort(
      { comfort: 9, observations: 0 },
      {
        exerciseId: 'air_squat',
        target: 8,
        achieved: 10,
        choice: 'easier',
      },
    );
    expect(entry.comfort).toBeGreaterThan(9);
  });

  it('never moves a comfort more than a tenth in one session', () => {
    const { entry } = updateComfort(
      { comfort: 10, observations: 0 },
      {
        exerciseId: 'air_squat',
        target: 10,
        achieved: 60,
        choice: 'normal',
      },
    );
    expect(entry.comfort).toBeLessThanOrEqual(11.000001);
  });

  it('seeds itself from the target when the movement is brand new', () => {
    const { entry } = updateComfort(undefined, {
      exerciseId: 'air_squat',
      target: 12,
      achieved: 14,
      choice: 'normal',
    });
    expect(entry.comfort).toBeGreaterThan(12);
    expect(entry.observations).toBe(1);
  });

  it('holds on a number that cannot be read', () => {
    expect(
      updateComfort(base, {
        exerciseId: 'air_squat',
        target: 12,
        achieved: Number.NaN,
        choice: 'normal',
      }).update.reason,
    ).toBe('hold');
  });
});

describe('twoForTwo and hardSession', () => {
  it('raises a little when the target was met twice, easily', () => {
    const { entry, update } = twoForTwo({ comfort: 10, observations: 5 });
    expect(entry.comfort).toBeCloseTo(10.4, 5);
    expect(update.reason).toBe('two-for-two');
  });

  it('lets a hard session lower, and never lets it raise', () => {
    expect(hardSession({ comfort: 10, observations: 5 }, 0.95).comfort).toBeCloseTo(9.5, 5);
    expect(hardSession({ comfort: 10, observations: 5 }, 1.5).comfort).toBe(10);
  });

  it('does not count a hard session as new evidence about the movement', () => {
    expect(hardSession({ comfort: 10, observations: 5 }, 0.95).observations).toBe(5);
  });
});
