/**
 * The coach tab's switch by person (design/CHANGELOG.md §23): which card the strip rests on, and
 * whose slot page the step after payment opens. Prices and payment are shared and not tested here.
 */
import { describe, expect, it } from 'vitest';
import { BOOKING } from '@content/site/booking';
import { NASTIA } from '@content/site/nastia';
import { activeFromScroll, scheduleUrlFor } from './person';

describe('scheduleUrlFor', () => {
  const half = BOOKING.options.find((o) => o.id === 'half');
  const hour = BOOKING.options.find((o) => o.id === 'hour');

  it('resolves Sergey exactly as before: the length’s page, else the shared one', () => {
    expect(scheduleUrlFor('sergey', half)).toBe(
      half?.scheduleUrl || BOOKING.scheduleUrl || undefined,
    );
    expect(scheduleUrlFor('sergey', hour)).toBe(
      hour?.scheduleUrl || BOOKING.scheduleUrl || undefined,
    );
    expect(scheduleUrlFor('sergey', {}, { shared: 'https://a.example/', nastia: '' })).toBe(
      'https://a.example/',
    );
    expect(
      scheduleUrlFor('sergey', { scheduleUrl: 'https://b.example/' }, { shared: '', nastia: '' }),
    ).toBe('https://b.example/');
  });

  it('gives Anastasia no slot page while hers is empty — never Sergey’s', () => {
    expect(scheduleUrlFor('nastia', half, { shared: 'https://a.example/', nastia: '' })).toBe(
      undefined,
    );
    if (!NASTIA.scheduleUrl) expect(scheduleUrlFor('nastia', half)).toBe(undefined);
  });

  it('gives Anastasia her own page for either length once it is set', () => {
    const sources = { shared: 'https://a.example/', nastia: 'https://n.example/' };
    expect(scheduleUrlFor('nastia', half, sources)).toBe('https://n.example/');
    expect(scheduleUrlFor('nastia', hour, sources)).toBe('https://n.example/');
  });
});

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
