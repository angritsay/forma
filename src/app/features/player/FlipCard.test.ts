import { describe, expect, it } from 'vitest';
import { swipeOf } from './FlipCard';

/*
 * The card reads four directions and each one costs something: up hides the clip, sideways changes
 * the movement. A finger that wobbles must not do two of them at once, and a tap that drifted must
 * do none — which is all this function decides.
 */
describe('swipeOf', () => {
  it('names a clear swipe in each direction', () => {
    expect(swipeOf(0, -100)).toBe('up');
    expect(swipeOf(0, 100)).toBe('down');
    expect(swipeOf(-100, 0)).toBe('left');
    expect(swipeOf(100, 0)).toBe('right');
  });

  it('ignores a tap that drifted a few pixels', () => {
    expect(swipeOf(0, 0)).toBeNull();
    expect(swipeOf(6, -9)).toBeNull();
    expect(swipeOf(-30, 4)).toBeNull();
  });

  it('gives the whole gesture to its dominant axis', () => {
    // Mostly up with a sideways wobble is a turn, never a change of movement.
    expect(swipeOf(40, -120)).toBe('up');
    // Mostly sideways with a vertical wobble is a change of movement, never a turn.
    expect(swipeOf(-120, 40)).toBe('left');
  });

  it('asks for more travel sideways than upwards', () => {
    // 48px up turns the card; the same distance sideways is not yet a change of movement,
    // because landing on the wrong exercise is the more annoying mistake to undo.
    expect(swipeOf(0, -48)).toBe('up');
    expect(swipeOf(-48, 0)).toBeNull();
    expect(swipeOf(-64, 0)).toBe('left');
  });
});
