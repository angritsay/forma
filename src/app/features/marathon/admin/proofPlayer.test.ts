import { describe, expect, it } from 'vitest';
import {
  formatClock,
  isPlayableDuration,
  isReviewSpeed,
  nextSpeed,
  nudge,
  playedRatio,
  ratioAt,
  REVIEW_SPEEDS,
  seekTarget,
} from './proofPlayer';

/**
 * The proof player's arithmetic.
 *
 * Every case here is one the coach hits on a real feed: metadata that has not arrived, a clip the
 * browser reports as endless, a finger that leaves the strip mid-drag. The component cannot be
 * rendered in these tests (the suite runs in node, with no media element to speak of), so this is
 * where the behaviour is pinned.
 */
describe('REVIEW_SPEEDS', () => {
  it('offers 1×, 2× and 4× — the speeds a proof survives', () => {
    expect([...REVIEW_SPEEDS]).toEqual([1, 2, 4]);
  });
});

describe('nextSpeed', () => {
  it('cycles and comes back round', () => {
    expect(nextSpeed(1)).toBe(2);
    expect(nextSpeed(2)).toBe(4);
    expect(nextSpeed(4)).toBe(1);
  });

  it('recovers from a rate that is not on the toggle', () => {
    // A browser is free to clamp `playbackRate`; the toggle must still have somewhere to go.
    expect(nextSpeed(3)).toBe(1);
    expect(nextSpeed(Number.NaN)).toBe(1);
  });
});

describe('isReviewSpeed', () => {
  it('accepts only the three speeds', () => {
    expect(isReviewSpeed(2)).toBe(true);
    expect(isReviewSpeed(3)).toBe(false);
    expect(isReviewSpeed('2')).toBe(false);
    expect(isReviewSpeed(null)).toBe(false);
  });
});

describe('ratioAt', () => {
  it('reads a position along the track', () => {
    expect(ratioAt(100, 100, 200)).toBe(0);
    expect(ratioAt(200, 100, 200)).toBe(0.5);
    expect(ratioAt(300, 100, 200)).toBe(1);
  });

  it('clamps a drag that has run off the strip', () => {
    // The pointer is captured, so points keep arriving from outside the element — and from
    // outside the screen, when a thumb slides off the edge of a phone.
    expect(ratioAt(-40, 100, 200)).toBe(0);
    expect(ratioAt(9999, 100, 200)).toBe(1);
  });

  it('reads an unmeasured track as the start', () => {
    expect(ratioAt(120, 100, 0)).toBe(0);
    expect(ratioAt(Number.NaN, 100, 200)).toBe(0);
  });
});

describe('seekTarget', () => {
  it('turns a position into a time', () => {
    expect(seekTarget(0.5, 600)).toBe(300);
    expect(seekTarget(0, 600)).toBe(0);
    expect(seekTarget(1, 600)).toBe(600);
  });

  it('stays at the start while the duration is unknown', () => {
    // `currentTime = NaN` throws, and a clip reported as endless has no position to seek to.
    expect(seekTarget(0.5, Number.NaN)).toBe(0);
    expect(seekTarget(0.5, Number.POSITIVE_INFINITY)).toBe(0);
    expect(seekTarget(0.5, 0)).toBe(0);
  });
});

describe('nudge', () => {
  it('steps by whole seconds inside the clip', () => {
    expect(nudge(100, 600, 5)).toBe(105);
    expect(nudge(100, 600, -5)).toBe(95);
  });

  it('never leaves the clip', () => {
    expect(nudge(2, 600, -5)).toBe(0);
    expect(nudge(598, 600, 5)).toBe(600);
  });

  it('is a no-op before the duration is known', () => {
    expect(nudge(10, Number.NaN, 5)).toBe(0);
  });
});

describe('playedRatio', () => {
  it('is what the bar draws', () => {
    expect(playedRatio(150, 600)).toBe(0.25);
    expect(playedRatio(600, 600)).toBe(1);
  });

  it('is empty when there is nothing to divide by', () => {
    expect(playedRatio(10, 0)).toBe(0);
    expect(playedRatio(Number.NaN, 600)).toBe(0);
  });
});

describe('formatClock', () => {
  it('reads like a stopwatch', () => {
    expect(formatClock(0)).toBe('00:00');
    expect(formatClock(9)).toBe('00:09');
    expect(formatClock(581)).toBe('09:41');
    expect(formatClock(600)).toBe('10:00');
  });

  it('grows an hours field only when it needs one', () => {
    expect(formatClock(3599)).toBe('59:59');
    expect(formatClock(3750)).toBe('1:02:30');
  });

  it('says nothing rather than zero before metadata arrives', () => {
    // A clip whose length is not known yet must not read as a clip of length nil.
    expect(formatClock(Number.NaN)).toBe('--:--');
    expect(formatClock(Number.POSITIVE_INFINITY)).toBe('--:--');
    expect(formatClock(-1)).toBe('--:--');
  });
});

describe('isPlayableDuration', () => {
  it('separates a measured clip from one that is not', () => {
    expect(isPlayableDuration(600)).toBe(true);
    expect(isPlayableDuration(0)).toBe(false);
    expect(isPlayableDuration(Number.NaN)).toBe(false);
    expect(isPlayableDuration(Number.POSITIVE_INFINITY)).toBe(false);
  });
});
