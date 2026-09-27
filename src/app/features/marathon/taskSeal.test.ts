import { describe, expect, it } from 'vitest';
import { isSealed } from './taskSeal';

const fresh = { done: false, opened: false, closed: false, reducedMotion: false };

describe('isSealed', () => {
  it('seals a task on the first look of the day', () => {
    expect(isSealed(fresh)).toBe(true);
  });

  it('stays open once opened', () => {
    expect(isSealed({ ...fresh, opened: true })).toBe(false);
  });

  it('never seals a task that is already done', () => {
    expect(isSealed({ ...fresh, done: true })).toBe(false);
  });

  it('never seals a task of a finished round', () => {
    expect(isSealed({ ...fresh, closed: true })).toBe(false);
  });

  it('never seals for somebody who asked for less motion', () => {
    expect(isSealed({ ...fresh, reducedMotion: true })).toBe(false);
  });
});
