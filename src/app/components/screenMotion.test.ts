import { describe, expect, it } from 'vitest';
import { screenMotion } from './screenMotion';

/*
 * The screen has to move the way the tab bar's highlight moved, or the two contradict each other:
 * the chrome saying "you went right" while the content says "something was swapped". These pin
 * the agreement, and the two cases where there is no highlight to agree with.
 */
describe('screenMotion', () => {
  it('follows the tab bar between its seats', () => {
    expect(screenMotion('/', '/courses')).toBe('right');
    expect(screenMotion('/courses', '/stats')).toBe('right');
    expect(screenMotion('/stats', '/marathon')).toBe('left');
    expect(screenMotion('/marathon', '/')).toBe('left');
  });

  it('pushes deeper from the right and comes back from the left', () => {
    expect(screenMotion('/courses', '/courses/start')).toBe('right');
    expect(screenMotion('/courses/start', '/courses/start/nodes/w1d1')).toBe('right');
    expect(screenMotion('/courses/start/nodes/w1d1', '/courses/start')).toBe('left');
    expect(screenMotion('/marathon/board', '/marathon')).toBe('left');
  });

  it('treats a screen outside the tabs by depth, so the profile is a push from Home', () => {
    expect(screenMotion('/', '/profile')).toBe('right');
    expect(screenMotion('/profile', '/')).toBe('left');
    // From «Прогресс», which is as deep as the profile: no direction to borrow, so it rises.
    expect(screenMotion('/stats', '/profile')).toBe('up');
  });

  it('rises when a screen is replaced by one at the same depth in the same tab', () => {
    expect(screenMotion('/courses/start', '/courses/engine')).toBe('up');
  });

  it('does not move the first screen, or a screen replaced by itself', () => {
    expect(screenMotion(null, '/')).toBe('none');
    expect(screenMotion('/stats', '/stats')).toBe('none');
  });
});
