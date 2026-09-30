import { describe, expect, it, vi } from 'vitest';
import { backTarget, isRootRoute, runBack } from './useTelegramBack';

describe('isRootRoute', () => {
  it('treats the tabs and the entry flows as starting points', () => {
    for (const path of ['/', '/marathon', '/book', '/admin', '/auth', '/onboarding']) {
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
      '/achievements',
      '/marathon/board',
      '/admin/courses',
      // The stories replay is opened from the account sheet and closes back to «Курсы».
      '/intro',
    ]) {
      expect(isRootRoute(path)).toBe(false);
    }
  });
});

describe('what a press does', () => {
  it('steps back through the app, or home from a screen opened by a link', () => {
    expect(backTarget('k3j2x1')).toBe(-1);
    expect(backTarget('default')).toBe('/');
    expect(backTarget(undefined)).toBe('/');
  });

  it('runs the handler a screen claimed it with (the player’s leave dialog)', () => {
    const fallback = vi.fn();
    runBack(fallback);
    expect(fallback).toHaveBeenCalledTimes(1);
  });
});
