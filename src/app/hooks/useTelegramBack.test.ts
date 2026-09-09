import { describe, expect, it } from 'vitest';
import { isRootRoute } from './useTelegramBack';

describe('isRootRoute', () => {
  it('treats the tabs and the entry flows as starting points', () => {
    for (const path of ['/', '/courses', '/stats', '/profile', '/auth', '/onboarding']) {
      expect(isRootRoute(path)).toBe(true);
    }
    // Onboarding is a wizard with its own steps and its own back control.
    expect(isRootRoute('/onboarding/tests')).toBe(true);
  });

  it('treats everything reached from a tab as a step back', () => {
    for (const path of [
      '/courses/start',
      '/courses/start/nodes/w1',
      '/play',
      '/summary/abc',
      '/leaderboard',
      '/steps',
      '/book',
      '/admin',
    ]) {
      expect(isRootRoute(path)).toBe(false);
    }
  });
});
