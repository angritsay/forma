import { describe, expect, it } from 'vitest';
import { DELAY_MS } from './ScreenLoader';

/**
 * The delay is the whole design, so it is the thing worth pinning.
 *
 * `ScreenLoader` itself is four lines of JSX around a timer; what can regress is the number, and
 * both directions of a wrong number are a visible bug:
 *
 *   • at 0 every navigation flashes a wordmark for a frame or two, which is the flicker the
 *     component was written to remove, only with different pixels;
 *   • much above ~200ms the screen sits blank long enough to read as broken before anything
 *     admits it is loading.
 */
describe('ScreenLoader delay', () => {
  it('sits inside the window where an indicator helps rather than distracts', () => {
    // Below ~100ms a change still reads as instantaneous, so anything drawn there is noise.
    expect(DELAY_MS).toBeGreaterThanOrEqual(100);
    // By ~200ms an empty screen has started to read as a fault rather than as a wait.
    expect(DELAY_MS).toBeLessThanOrEqual(200);
  });

  it('is longer than a frame, so a cached screen never draws it at all', () => {
    // Two frames at 60fps. A navigation that resolves from memory must finish inside the delay,
    // which is what makes the fast path show nothing — not a loader that appears and vanishes.
    expect(DELAY_MS).toBeGreaterThan(2 * (1000 / 60));
  });
});
