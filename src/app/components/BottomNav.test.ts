import { describe, expect, it } from 'vitest';
import { activeTabIndex, tabItems } from './BottomNav';

/*
 * The travelling mark is only as honest as this function: it does not fail loudly when it is
 * wrong, it just slides under the wrong word. `NavLink` decides the same question for its own
 * highlight, so a disagreement between the two shows up as a lit tab with the rule somewhere else.
 *
 * Since the bar has three seats for most people and four for an admin, the count is now part of
 * the answer: the highlight's width is a share of `tabItems(admin).length` and it travels in
 * multiples of that width, so an index that did not come from the same list is a mark in the wrong
 * place — or a whole seat past the end of the capsule.
 */
describe('activeTabIndex', () => {
  it('finds each tab by its own path', () => {
    expect(activeTabIndex('/')).toBe(0);
    expect(activeTabIndex('/marathon')).toBe(1);
    expect(activeTabIndex('/book')).toBe(2);
  });

  it('gives the admin a fourth seat, and nobody else', () => {
    expect(tabItems(false)).toHaveLength(3);
    expect(tabItems(true)).toHaveLength(4);
    expect(activeTabIndex('/admin', true)).toBe(3);
    expect(activeTabIndex('/admin/courses', true)).toBe(3);
    // Without the seat there is nothing to light.
    expect(activeTabIndex('/admin')).toBe(-1);
    // And the three the product is keep their index either way.
    expect(activeTabIndex('/', true)).toBe(0);
    expect(activeTabIndex('/book', true)).toBe(2);
  });

  it('keeps a tab lit for the screens inside it', () => {
    expect(activeTabIndex('/marathon/board')).toBe(1);
    expect(activeTabIndex('/admin/marathons/xyz', true)).toBe(3);
  });

  it('lets «Курсы» keep the screens it owns but does not sit under', () => {
    // `/` matched exactly is lit by nothing but itself, and a course path, a day inside it and the
    // achievements catalogue are all opened from «Курсы».
    expect(activeTabIndex('/courses/start')).toBe(0);
    expect(activeTabIndex('/courses/start/nodes/w1d1')).toBe(0);
    expect(activeTabIndex('/achievements')).toBe(0);
  });

  it('matches on a path segment, not on a string prefix', () => {
    // The reason the `/` is in the prefix: without it this would light «Клуб».
    expect(activeTabIndex('/marathonish')).toBe(-1);
    expect(activeTabIndex('/booking')).toBe(-1);
  });

  it('claims nothing for a screen that is in no tab', () => {
    // Both show the bar and belong to none of its seats; the mark hides instead of pointing at
    // one of them.
    expect(activeTabIndex('/leaderboard')).toBe(-1);
    expect(activeTabIndex('/steps')).toBe(-1);
  });

  it('does not let the root swallow every path', () => {
    // `end: true` on the first item is what keeps this from being 0 for everything; what «Курсы»
    // claims beyond itself is the `owns` list and nothing else.
    expect(activeTabIndex('/summary/abc')).toBe(-1);
    expect(activeTabIndex('/play')).toBe(-1);
  });
});
