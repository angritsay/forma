/**
 * The coach tab's switch by person (design/CHANGELOG.md §23): which card the strip rests on.
 * Prices and payment are shared and not tested here.
 */
import { describe, expect, it } from 'vitest';
import { NASTIA } from '@content/site/nastia';
import { activeFromScroll } from './person';

describe('activeFromScroll', () => {
  it('reads the resting card from the scroll position', () => {
    expect(activeFromScroll({ scrollLeft: 0, maxScroll: 270, step: 320, count: 2 })).toBe(0);
    expect(activeFromScroll({ scrollLeft: 100, maxScroll: 270, step: 320, count: 2 })).toBe(0);
    expect(activeFromScroll({ scrollLeft: 270, maxScroll: 270, step: 320, count: 2 })).toBe(1);
  });

  it('takes the last card at the far end even short of a full step', () => {
    expect(activeFromScroll({ scrollLeft: 120, maxScroll: 120, step: 432, count: 2 })).toBe(1);
  });

  it('says nothing when the strip cannot scroll', () => {
    expect(activeFromScroll({ scrollLeft: 0, maxScroll: 0, step: 432, count: 2 })).toBe(null);
  });
});

describe('her header card', () => {
  it('carries the owner’s three stickers', () => {
    expect(NASTIA.roles).toEqual([
      { ru: 'Йога', en: 'Yoga' },
      { ru: 'Питание', en: 'Nutrition' },
      { ru: 'Сооснователь Forma', en: 'Co-founder of Forma' },
    ]);
  });
});
