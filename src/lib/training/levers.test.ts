import { describe, expect, it } from 'vitest';
import type { Block } from '@/content/schema';
import { adaptStepsFor, applyLevers, DEFAULT_ADAPT, isFrozen, leverFactor, temper } from './levers';

const block = (over: Partial<Block>): Block =>
  ({
    id: 'b',
    type: 'metcon',
    format: 'circuit',
    sets: 3,
    items: [{ exerciseId: 'air_squat', reps: 10 }],
    scalable: true,
    ...over,
  }) as Block;

describe('isFrozen', () => {
  it('freezes a warm-up, a cool-down and a test', () => {
    expect(isFrozen({ type: 'warmup', scalable: false })).toBe(true);
    expect(isFrozen({ type: 'cooldown', scalable: false })).toBe(true);
    // A benchmark is the thing the course is measured by: identical at every difficulty, or it
    // measures nothing.
    expect(isFrozen({ type: 'test', scalable: true })).toBe(true);
  });

  it('leaves ordinary work alone', () => {
    expect(isFrozen({ type: 'metcon', scalable: true })).toBe(false);
  });
});

describe('adaptStepsFor', () => {
  it('prefers what the block declares over what its format implies', () => {
    const declared = [{ lever: 'rest' as const, easier: 1.5, harder: 0.7 }];
    expect(adaptStepsFor(block({ adapt: declared }))).toEqual(declared);
  });

  it('falls back to the format default, so already-written courses need no hand-tuning', () => {
    expect(adaptStepsFor(block({ format: 'amrap', adapt: undefined }))).toEqual(
      DEFAULT_ADAPT.amrap,
    );
  });

  it('gives a frozen block the one lever that moves nothing', () => {
    expect(adaptStepsFor(block({ type: 'test' }))).toEqual([{ lever: 'none' }]);
  });

  it('has a default for every format the schema allows', () => {
    for (const f of [
      'sets',
      'circuit',
      'amrap',
      'emom',
      'fortime',
      'tabata',
      'interval',
    ] as const) {
      expect(DEFAULT_ADAPT[f].length).toBeGreaterThan(0);
    }
  });
});

describe('leverFactor', () => {
  it('never moves anything at «нормально»', () => {
    expect(leverFactor({ lever: 'reps', easier: 0.5, harder: 2 }, 'normal')).toBe(1);
  });

  it('treats a missing multiplier as no movement rather than as zero', () => {
    expect(leverFactor({ lever: 'reps' }, 'easier')).toBe(1);
    expect(leverFactor({ lever: 'reps', harder: 1.2 }, 'easier')).toBe(1);
  });
});

describe('applyLevers', () => {
  it('moves the window for an AMRAP and leaves the round alone — workout 6', () => {
    const b = block({ format: 'amrap', durationSec: 480, sets: undefined });
    expect(applyLevers(b, 'harder').durationSec).toBe(575); // 480 × 1.2, to the nearest 5 s
    expect(applyLevers(b, 'easier').durationSec).toBe(385);
    expect(applyLevers(b, 'harder').repsFactor).toBe(1);
  });

  it('moves the rest between pairs when that is what the coach declared — workout 3', () => {
    const b = block({
      format: 'fortime',
      durationSec: 540,
      restBetweenRoundsSec: 60,
      adapt: [{ lever: 'rest', easier: 1.5, harder: 0.67 }],
    });
    // Rest goes UP to make it easier. Every other lever shrinks; this one grows.
    expect(applyLevers(b, 'easier').restBetweenRoundsSec).toBe(90);
    expect(applyLevers(b, 'harder').restBetweenRoundsSec).toBe(40);
    expect(applyLevers(b, 'normal').restBetweenRoundsSec).toBe(60);
  });

  it('moves the number of rounds for a circuit — workout 5', () => {
    const b = block({ format: 'circuit', sets: 3 });
    expect(applyLevers(b, 'easier').sets).toBe(2);
    expect(applyLevers(b, 'harder').sets).toBe(4);
  });

  it('never cuts below one honest round', () => {
    const b = block({ format: 'circuit', sets: 1, adapt: [{ lever: 'rounds', easier: 0.2 }] });
    expect(applyLevers(b, 'easier').sets).toBe(1);
  });

  it('moves nothing at all in a benchmark — workout 19', () => {
    const b = block({ type: 'test', format: 'fortime', durationSec: 600, sets: 2 });
    const harder = applyLevers(b, 'harder');
    expect(harder).toMatchObject({ durationSec: 600, sets: 2, repsFactor: 1, swap: false });
  });

  it('leaves a warm-up exactly as the coach wrote it', () => {
    const b = block({ type: 'warmup', scalable: false, sets: 1, restBetweenRoundsSec: 30 });
    expect(applyLevers(b, 'easier')).toMatchObject({
      sets: 1,
      restBetweenRoundsSec: 30,
      repsFactor: 1,
    });
  });

  it('applies several levers in the order they are declared', () => {
    const b = block({
      format: 'circuit',
      sets: 4,
      adapt: [
        { lever: 'rounds', easier: 0.75, harder: 1.25 },
        { lever: 'reps', easier: 0.9, harder: 1.1 },
      ],
    });
    const easier = applyLevers(b, 'easier');
    expect(easier.sets).toBe(3);
    expect(easier.repsFactor).toBeCloseTo(0.9, 5);
  });

  it('raises the swap flag only when the mode actually moved', () => {
    const b = block({ adapt: [{ lever: 'swap' }] });
    expect(applyLevers(b, 'harder').swap).toBe(true);
    expect(applyLevers(b, 'normal').swap).toBe(false);
  });

  it('keeps a rest that exists from rounding away to nothing', () => {
    const b = block({ restBetweenRoundsSec: 6, adapt: [{ lever: 'rest', harder: 0.1 }] });
    expect(applyLevers(b, 'harder').restBetweenRoundsSec).toBe(5);
  });

  it('leaves a zero rest at zero — no rest authored means no rest meant', () => {
    const b = block({ restBetweenRoundsSec: 0, adapt: [{ lever: 'rest', easier: 2 }] });
    expect(applyLevers(b, 'easier').restBetweenRoundsSec).toBe(0);
  });
});

describe('temper', () => {
  /*
   * The ratio has already moved an unusual athlete a long way. Letting the mode compound on top is
   * how «посложнее» becomes unfinishable for the strong and «полегче» becomes empty for the weak.
   */
  it('leaves an average athlete move untouched', () => {
    expect(temper(1, 1.17)).toBeCloseTo(1.17, 5);
  });

  it('damps the move the further from average the athlete is', () => {
    expect(temper(2, 1.17)).toBeLessThan(temper(1.2, 1.17));
    expect(temper(0.5, 0.83)).toBeGreaterThan(temper(0.9, 0.83));
  });

  it('never flips the direction of the move', () => {
    expect(temper(2.5, 1.17)).toBeGreaterThan(1);
    expect(temper(0.4, 0.83)).toBeLessThan(1);
  });

  it('does nothing at «нормально»', () => {
    expect(temper(2.5, 1)).toBe(1);
  });
});
