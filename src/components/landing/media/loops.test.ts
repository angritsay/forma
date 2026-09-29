import { describe, expect, it } from 'vitest';
import { MAX_PLAYING, VISIBLE_RATIO, loopsAllowed, pickPlaying } from './loops';

describe('loopsAllowed', () => {
  it('plays only without reduced motion and without data saver', () => {
    expect(loopsAllowed({ reducedMotion: false, saveData: false })).toBe(true);
    expect(loopsAllowed({ reducedMotion: true, saveData: false })).toBe(false);
    expect(loopsAllowed({ reducedMotion: false, saveData: true })).toBe(false);
  });
});

describe('pickPlaying', () => {
  it('plays what is at least 40% visible and nothing else', () => {
    const picked = pickPlaying([
      { order: 0, ratio: VISIBLE_RATIO },
      { order: 1, ratio: 0.39 },
      { order: 2, ratio: 0 },
    ]);
    expect([...picked]).toEqual([0]);
  });

  it('never plays more than four, preferring the most visible then document order', () => {
    const all = Array.from({ length: 7 }, (_, order) => ({ order, ratio: order === 5 ? 1 : 0.5 }));
    const picked = pickPlaying(all);
    expect(picked.size).toBe(MAX_PLAYING);
    expect([...picked]).toEqual([5, 0, 1, 2]);
  });

  it('skips a loop whose clip failed', () => {
    expect([
      ...pickPlaying([
        { order: 0, ratio: 1, failed: true },
        { order: 1, ratio: 0.5 },
      ]),
    ]).toEqual([1]);
  });
});
