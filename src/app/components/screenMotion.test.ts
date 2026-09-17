import { describe, expect, it } from 'vitest';
import { screenMotion } from './screenMotion';

/*
 * The screen has to move the way the tab bar's highlight moved, or the two contradict each other:
 * the chrome saying "you went right" while the content says "something was swapped". These pin
 * the agreement, and the two cases where there is no highlight to agree with.
 */
describe('screenMotion', () => {
  it('follows the tab bar between its seats', () => {
    expect(screenMotion('/', '/marathon')).toBe('right');
    expect(screenMotion('/marathon', '/book')).toBe('right');
    expect(screenMotion('/book', '/marathon')).toBe('left');
    expect(screenMotion('/marathon', '/')).toBe('left');
    // The admin's fourth seat is the rightmost of them, and it moves like one.
    expect(screenMotion('/book', '/admin')).toBe('right');
    expect(screenMotion('/admin', '/')).toBe('left');
  });

  it('pushes deeper from the right and comes back from the left', () => {
    // «Курсы» owns `/courses/*`, so both of these are one seat and the depth decides.
    expect(screenMotion('/', '/courses/start')).toBe('right');
    expect(screenMotion('/courses/start', '/courses/start/nodes/w1d1')).toBe('right');
    expect(screenMotion('/courses/start/nodes/w1d1', '/courses/start')).toBe('left');
    expect(screenMotion('/marathon/board', '/marathon')).toBe('left');
  });

  it('treats a screen outside the tabs by depth', () => {
    expect(screenMotion('/', '/steps')).toBe('right');
    expect(screenMotion('/steps', '/')).toBe('left');
    // Two screens at the same depth in no seat: no direction to borrow, so it rises.
    expect(screenMotion('/steps', '/leaderboard')).toBe('up');
  });

  it('rises when a screen is replaced by one at the same depth in the same tab', () => {
    expect(screenMotion('/courses/start', '/courses/engine')).toBe('up');
  });

  it('does not move the first screen, or a screen replaced by itself', () => {
    expect(screenMotion(null, '/')).toBe('none');
    expect(screenMotion('/marathon', '/marathon')).toBe('none');
  });
});
