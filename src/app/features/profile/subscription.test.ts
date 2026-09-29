import { describe, expect, it } from 'vitest';
import { t, type Locale } from '@/i18n/index';
import type { Subscription } from '@/lib/api/types';
import type { Translator } from '@/app/hooks/useT';
import { clubMonthlyLabel } from '@/app/features/marathon/clubPlan';
import { subscriptionDate, subscriptionLeadsToJoin, subscriptionSubtitle } from './subscription';

const tr = (locale: Locale): Translator => ({
  locale,
  t: (key, params) => t(locale, key, params),
  l: (value) => value?.[locale] ?? '',
});

// Midday, so no time zone the suite runs in moves the date across a day.
const NOW = Date.parse('2027-01-10T12:00:00Z');
const sub = (over: Partial<Subscription>): Subscription => ({
  plan: 'annual',
  status: 'active',
  startedAt: '2026-03-12T12:00:00Z',
  expiresAt: '2027-03-12T12:00:00Z',
  isLive: true,
  ...over,
});

describe('subscriptionDate', () => {
  it('drops the year when it is this one', () => {
    expect(subscriptionDate('ru', '2027-03-12T12:00:00Z', NOW)).toBe('12 марта');
    expect(subscriptionDate('en', '2027-03-12T12:00:00Z', NOW)).toBe('March 12');
  });

  it('keeps the year when it is another one', () => {
    expect(subscriptionDate('ru', '2028-03-12T12:00:00Z', NOW)).toMatch(/^12 марта 2028/);
  });

  it('is empty for a date that does not parse', () => {
    expect(subscriptionDate('ru', 'nope', NOW)).toBe('');
  });
});

describe('subscriptionSubtitle', () => {
  it('reads «до 12 марта» while it runs', () => {
    expect(subscriptionSubtitle(tr('ru'), sub({}), NOW)).toBe('до 12 марта');
    expect(subscriptionSubtitle(tr('en'), sub({}), NOW)).toBe('until March 12');
  });

  it('says a cancelled one still runs until its date', () => {
    expect(subscriptionSubtitle(tr('ru'), sub({ status: 'cancelled' }), NOW)).toBe(
      'Отменена · доступ до 12 марта',
    );
  });

  it('says when it ended and offers to renew', () => {
    const ended = sub({ expiresAt: '2027-01-02T12:00:00Z', isLive: false });
    expect(subscriptionSubtitle(tr('ru'), ended, NOW)).toBe('Закончилась 2 января · продлить');
    expect(subscriptionSubtitle(tr('ru'), sub({ expiresAt: null, isLive: false }), NOW)).toBe(
      'Закончилась · продлить',
    );
  });

  it('quotes the club’s own price when there is none', () => {
    const price = clubMonthlyLabel('ru');
    expect(price).not.toBeNull();
    expect(subscriptionSubtitle(tr('ru'), null, NOW)).toBe(`от ${price} в месяц`);
  });

  it('says a pending payment is pending', () => {
    expect(subscriptionSubtitle(tr('ru'), sub({ status: 'pending', isLive: false }), NOW)).toBe(
      'Ждёт оплаты',
    );
  });
});

describe('subscriptionLeadsToJoin', () => {
  it('leads to the payment before the first one and after the end, never while it runs', () => {
    expect(subscriptionLeadsToJoin(null)).toBe(true);
    expect(subscriptionLeadsToJoin(sub({ isLive: false }))).toBe(true);
    expect(subscriptionLeadsToJoin(sub({ status: 'refunded', isLive: false }))).toBe(true);
    expect(subscriptionLeadsToJoin(sub({}))).toBe(false);
    expect(subscriptionLeadsToJoin(sub({ status: 'cancelled' }))).toBe(false);
    // Money on its way: a second payment link beside it invites a double charge.
    expect(subscriptionLeadsToJoin(sub({ status: 'pending', isLive: false }))).toBe(false);
  });
});
