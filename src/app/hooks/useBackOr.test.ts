import { describe, expect, it } from 'vitest';
import { hasInAppHistory } from './useBackOr';

describe('hasInAppHistory', () => {
  it('goes back only from an entry the app pushed itself', () => {
    expect(hasInAppHistory('k3j2x1')).toBe(true);
    // The first entry — opened from a link or a reload — has nowhere in the app to go back to.
    expect(hasInAppHistory('default')).toBe(false);
    expect(hasInAppHistory(undefined)).toBe(false);
  });
});
