import { describe, expect, it } from 'vitest';
import { FEED_COMMIT_RATIO, feedDecision, feedOffset, releaseVelocity, rubberBand } from './feed';

const H = 800;
const BOTH = { next: true, prev: true };

/*
 * Letting go of the feed decides one of three things — the next movement, the one before, or
 * back where it was — and a wrong answer either loses the athlete's place or ignores them.
 */
describe('feedDecision', () => {
  it('turns the page once enough of the screen is covered, at any speed', () => {
    const far = H * FEED_COMMIT_RATIO + 1;
    expect(feedDecision(-far, 0, H, BOTH)).toBe('next');
    expect(feedDecision(far, 0, H, BOTH)).toBe('prev');
  });

  it('puts it back when the drag was short and slow', () => {
    expect(feedDecision(-60, -0.1, H, BOTH)).toBeNull();
    expect(feedDecision(60, 0.1, H, BOTH)).toBeNull();
  });

  it('turns it on a short, quick flick', () => {
    expect(feedDecision(-50, -0.8, H, BOTH)).toBe('next');
    expect(feedDecision(50, 0.8, H, BOTH)).toBe('prev');
  });

  it('ignores a twitch, however fast', () => {
    expect(feedDecision(-12, -2, H, BOTH)).toBeNull();
  });

  it('reads a flick back the other way as a change of mind', () => {
    // Dragged a long way up, then thrown back down: stay.
    expect(feedDecision(-300, 0.8, H, BOTH)).toBeNull();
  });

  it('never turns towards a page that is not there or is held', () => {
    expect(feedDecision(400, 1, H, { next: true, prev: false })).toBeNull();
    // A running AMRAP holds both ways: only its own button ends it.
    expect(feedDecision(-400, -1, H, { next: false, prev: false })).toBeNull();
  });
});

describe('feedOffset', () => {
  it('follows the finger one to one where the page can turn', () => {
    expect(feedOffset(-120, H, BOTH)).toBe(-120);
    expect(feedOffset(90, H, BOTH)).toBe(90);
    // …and not past a whole screen.
    expect(feedOffset(-2000, H, BOTH)).toBe(-H);
  });

  it('resists where it cannot, less and less the further it is pulled', () => {
    const held = { next: false, prev: false };
    const a = feedOffset(-100, H, held);
    const b = feedOffset(-400, H, held);
    expect(a).toBeLessThan(0);
    expect(Math.abs(a)).toBeLessThan(100);
    expect(Math.abs(b)).toBeGreaterThan(Math.abs(a));
    expect(Math.abs(b) - Math.abs(a)).toBeLessThan(300);
    expect(rubberBand(0, H)).toBe(0);
  });
});

describe('releaseVelocity', () => {
  it('measures the last stretch of the gesture, not its average', () => {
    const samples = [
      { y: 0, t: 0 },
      { y: -10, t: 200 },
      { y: -20, t: 400 },
      { y: -80, t: 460 },
      { y: -140, t: 500 },
    ];
    expect(releaseVelocity(samples)).toBeCloseTo(-120 / 100);
    expect(releaseVelocity([])).toBe(0);
  });
});
