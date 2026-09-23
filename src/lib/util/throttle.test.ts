import { describe, expect, it, vi } from 'vitest';
import { throttled } from './throttle';

describe('throttled', () => {
  it('runs at most once per interval and drops calls inside it', () => {
    let clock = 1_000;
    const fn = vi.fn();
    const run = throttled(fn, 60_000, { now: () => clock });
    expect(run()).toBe(true);
    clock += 30_000;
    expect(run()).toBe(false);
    clock += 30_000;
    expect(run()).toBe(true);
    expect(fn).toHaveBeenCalledTimes(2);
  });

  it('a primed throttle waits a full interval before the first run', () => {
    let clock = 5_000;
    const fn = vi.fn();
    const run = throttled(fn, 60_000, { primed: true, now: () => clock });
    expect(run()).toBe(false);
    clock += 60_000;
    expect(run()).toBe(true);
    expect(fn).toHaveBeenCalledTimes(1);
  });
});
