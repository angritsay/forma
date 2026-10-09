/**
 * The account row and the club's renewal card under automatic monthly renewal (`RENEWAL`,
 * content/site/plans.ts — off today). The mode is passed explicitly, so the auto path is tested
 * while the switch stays `'manual'`; `subscription.test.ts` holds the manual path unchanged.
 */
import { describe, expect, it } from 'vitest';
import { t, type Locale } from '@/i18n/index';
import type { Subscription } from '@/lib/api/types';
import type { Translator } from '@/app/hooks/useT';
import { RENEWAL } from '@content/site/plans';
import {
  autoChargeLabel,
  subscriptionAutoChargeSoon,
  subscriptionAutoRenews,
  subscriptionChargeNote,
  subscriptionLeadsToJoin,
  subscriptionRenewDue,
  subscriptionSubtitle,
} from './subscription';

const tr = (locale: Locale): Translator => ({
  locale,
  t: (key, params) => t(locale, key, params),
  l: (value) => value?.[locale] ?? '',
});

const NOW = Date.parse('2027-01-10T12:00:00Z');
/** A monthly subscription with two days left. */
const sub = (over: Partial<Subscription>): Subscription => ({
  plan: 'monthly',
  status: 'active',
  startedAt: '2026-12-14T12:00:00Z',
  expiresAt: '2027-01-12T12:00:00Z',
  isLive: true,
  ...over,
});

describe('a monthly subscription that renews by itself (auto mode)', () => {
  it('is never offered «renew» — that would charge twice', () => {
    expect(subscriptionAutoRenews(sub({}), 'auto')).toBe(true);
    expect(subscriptionRenewDue(sub({}), NOW, 'auto')).toBe(false);
    expect(subscriptionLeadsToJoin(sub({}), NOW, 'auto')).toBe(false);
    expect(subscriptionChargeNote(tr('ru'), sub({}), NOW, 'auto')).toBe('');
  });

  it('shows the date and the amount of the next charge instead', () => {
    const rub = autoChargeLabel('ru', sub({}));
    expect(rub).toMatch(/^1\s990\s₽$/u);
    expect(subscriptionSubtitle(tr('ru'), sub({}), NOW, 'auto')).toBe(
      `продление 12 января · ${rub}`,
    );
    expect(subscriptionSubtitle(tr('en'), sub({}), NOW, 'auto')).toBe('renews January 12 · $19');
    expect(subscriptionAutoChargeSoon(sub({}), NOW, 'auto')).toBe(true);
  });

  it('is not «soon» with weeks left', () => {
    const far = sub({ expiresAt: '2027-02-01T12:00:00Z' });
    expect(subscriptionAutoChargeSoon(far, NOW, 'auto')).toBe(false);
    expect(subscriptionSubtitle(tr('en'), far, NOW, 'auto')).toBe('renews February 1 · $19');
  });
});

describe('what keeps the manual path in auto mode', () => {
  it('a cancelled monthly subscription: it will not be charged again', () => {
    const cancelled = sub({ status: 'cancelled' });
    expect(subscriptionAutoRenews(cancelled, 'auto')).toBe(false);
    expect(subscriptionRenewDue(cancelled, NOW, 'auto')).toBe(true);
    expect(subscriptionAutoChargeSoon(cancelled, NOW, 'auto')).toBe(false);
  });

  it('the annual plan: it stays one payment', () => {
    const year = sub({ plan: 'annual' });
    expect(subscriptionAutoRenews(year, 'auto')).toBe(false);
    expect(subscriptionRenewDue(year, NOW, 'auto')).toBe(true);
    expect(subscriptionSubtitle(tr('ru'), year, NOW, 'auto')).toBe('до 12 января · продлить');
  });

  it('an ended or missing subscription', () => {
    expect(subscriptionAutoRenews(sub({ isLive: false }), 'auto')).toBe(false);
    expect(subscriptionAutoRenews(null, 'auto')).toBe(false);
  });
});

describe('manual mode', () => {
  it('offers «renew» to the same monthly subscription, as it always has', () => {
    expect(subscriptionAutoRenews(sub({}), 'manual')).toBe(false);
    expect(subscriptionRenewDue(sub({}), NOW, 'manual')).toBe(true);
    expect(subscriptionSubtitle(tr('ru'), sub({}), NOW, 'manual')).toBe('до 12 января · продлить');
    expect(subscriptionAutoChargeSoon(sub({}), NOW, 'manual')).toBe(false);
  });
});

describe('by default', () => {
  it('follows the switch', () => {
    expect(subscriptionAutoRenews(sub({}))).toBe(subscriptionAutoRenews(sub({}), RENEWAL));
    expect(subscriptionRenewDue(sub({}), NOW)).toBe(subscriptionRenewDue(sub({}), NOW, RENEWAL));
    expect(subscriptionSubtitle(tr('ru'), sub({}), NOW)).toBe(
      subscriptionSubtitle(tr('ru'), sub({}), NOW, RENEWAL),
    );
  });
});
