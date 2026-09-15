import { describe, expect, it } from 'vitest';
import { activeTabIndex } from './BottomNav';

/*
 * The travelling mark is only as honest as this function: it does not fail loudly when it is
 * wrong, it just slides under the wrong word. `NavLink` decides the same question for its own
 * highlight, so a disagreement between the two shows up as a lit tab with the rule somewhere else.
 */
describe('activeTabIndex', () => {
  it('finds each tab by its own path', () => {
    expect(activeTabIndex('/')).toBe(0);
    expect(activeTabIndex('/courses')).toBe(1);
    expect(activeTabIndex('/marathon')).toBe(2);
    expect(activeTabIndex('/stats')).toBe(3);
  });

  it('keeps a tab lit for the screens inside it', () => {
    expect(activeTabIndex('/courses/start')).toBe(1);
    expect(activeTabIndex('/courses/start/nodes/w1d1')).toBe(1);
    expect(activeTabIndex('/marathon/board')).toBe(2);
  });

  it('matches on a path segment, not on a string prefix', () => {
    // The reason the `/` is in the prefix: without it this would light «Программы».
    expect(activeTabIndex('/coursesomething')).toBe(-1);
    expect(activeTabIndex('/statsy')).toBe(-1);
  });

  it('claims nothing for a screen that is in no tab', () => {
    // All three show the bar and belong to none of its four seats; the mark hides instead of
    // pointing at one of them.
    expect(activeTabIndex('/profile')).toBe(-1);
    expect(activeTabIndex('/book')).toBe(-1);
    expect(activeTabIndex('/steps')).toBe(-1);
  });

  it('does not let the root swallow every path', () => {
    // `end: true` on the first item is what keeps this from being 0 for everything.
    expect(activeTabIndex('/leaderboard')).toBe(-1);
  });
});
