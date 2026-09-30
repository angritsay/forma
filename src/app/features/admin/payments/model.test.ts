import { describe, expect, it } from 'vitest';
import type { AdminToday, PaymentRow } from '@/lib/api/adminPayments';
import { AppError } from '@/lib/api/errors';
import {
  adminHref,
  adminTabFrom,
  bindErrorKey,
  bookErrorKey,
  canBind,
  canBookAsSession,
  canBookSession,
  canDismiss,
  canRefundSession,
  likelyPerson,
  needsPerson,
  formatMoney,
  paymentFilterFrom,
  paymentIdFrom,
  paymentState,
  sessionOptionOf,
  todayRows,
} from './model';

const pay = (over: Partial<PaymentRow> = {}): PaymentRow => ({
  id: 'p1',
  email: 'buyer@example.com',
  amount: 3990,
  currency: 'RUB',
  intent: 'course',
  provider: 'prodamus',
  providerRef: 'R-1',
  paidAt: '2026-09-23T10:00:00Z',
  applied: false,
  claimedAt: null,
  accountEmail: null,
  resolution: null,
  resolvedAt: null,
  boundEmail: null,
  resolveNote: null,
  courseId: null,
  hasAccount: false,
  sessionOption: null,
  ...over,
});

describe('URL state', () => {
  it('falls back on anything it does not know', () => {
    expect(adminTabFrom('payments', true)).toBe('payments');
    expect(adminTabFrom('nonsense', true)).toBe('purchases');
    expect(adminTabFrom(null, true)).toBe('purchases');
    // Без тарифов вкладки подписок нет — ссылка на неё открывает покупки.
    expect(adminTabFrom('subscriptions', false)).toBe('purchases');
    expect(paymentFilterFrom('sessions')).toBe('sessions');
    expect(paymentFilterFrom('drop table')).toBe('unclaimed');
    expect(paymentIdFrom('0B6A3F7E-1C2D-4E5F-8A9B-0C1D2E3F4A5B')).toBe(
      '0b6a3f7e-1c2d-4e5f-8a9b-0c1d2e3f4a5b',
    );
    expect(paymentIdFrom('1; select')).toBeNull();
  });

  it('builds the links the stats screen and «Сегодня» use', () => {
    expect(adminHref('payments', { filter: 'unclaimed' })).toBe(
      '/admin?tab=payments&filter=unclaimed',
    );
    expect(adminHref('people')).toBe('/admin?tab=people');
  });
});

describe('payment state and buttons', () => {
  it('offers bind and dismiss only for an unmatched payment for something that opens', () => {
    expect(paymentState(pay())).toBe('unclaimed');
    expect(canBind(pay())).toBe(true);
    expect(canDismiss(pay())).toBe(true);

    const session = pay({ intent: 'session', applied: true });
    expect(paymentState(session)).toBe('session');
    expect(canBind(session)).toBe(false);

    const dismissed = pay({ resolution: 'dismissed' });
    expect(paymentState(dismissed)).toBe('dismissed');
    // Разобранный можно привязать потом, но разобрать второй раз — нечего.
    expect(canBind(dismissed)).toBe(true);
    expect(canDismiss(dismissed)).toBe(false);

    const bound = pay({ applied: true, resolution: 'bound' });
    expect(paymentState(bound)).toBe('bound');
    expect(canBind(bound)).toBe(false);
    expect(paymentState(pay({ applied: true }))).toBe('applied');
  });
});

/*
 * 0056: a session payment that became no booking is money with no time on the calendar. It used
 * to read «Оплачено» like a booked one, and the admin had no way to see it or act on it.
 */
describe('a paid session with no time', () => {
  it('reads «Оплачено, время не выбрано» and offers «Записать на время»', () => {
    const unbooked = pay({ intent: 'session', applied: false });
    expect(paymentState(unbooked)).toBe('sessionUnbooked');
    expect(canBookSession(unbooked)).toBe(true);
    // Still nothing to bind: a session opens no access.
    expect(canBind(unbooked)).toBe(false);
    expect(canDismiss(unbooked)).toBe(false);
  });

  it('is plain «Оплачено» once booked, and «Закрыт без записи» once refunded', () => {
    const booked = pay({ intent: 'session', applied: true });
    expect(paymentState(booked)).toBe('session');
    expect(canBookSession(booked)).toBe(false);
    expect(canRefundSession(booked)).toBe(false);
    const closed = pay({ intent: 'session', applied: false, resolution: 'dismissed' });
    expect(paymentState(closed)).toBe('sessionClosed');
    expect(canBookSession(closed)).toBe(false);
    expect(canRefundSession(closed)).toBe(false);
    expect(canRefundSession(pay({ intent: 'session' }))).toBe(true);
  });

  /* 0058: money that opened nothing at a price nobody sells may be a session at the wrong amount. */
  it('offers «Это занятие» only for an unmatched course payment', () => {
    expect(canBookAsSession(pay())).toBe(true);
    expect(canBookAsSession(pay({ courseId: 'start' }))).toBe(false);
    expect(canBookAsSession(pay({ applied: true }))).toBe(false);
    expect(canBookAsSession(pay({ resolution: 'dismissed' }))).toBe(false);
    expect(canBookAsSession(pay({ intent: 'monthly' }))).toBe(false);
    expect(canBookAsSession(pay({ intent: 'session' }))).toBe(false);
  });

  /* 0058: with nobody behind the payment the admin must pick the person. */
  it('asks for the person only when no account stands behind the payment', () => {
    const stranger = pay({ intent: 'session' });
    expect(needsPerson(stranger)).toBe(true);
    expect(likelyPerson(stranger)).toBe('');
    const own = pay({ intent: 'session', hasAccount: true });
    expect(needsPerson(own)).toBe(false);
    expect(likelyPerson(own)).toBe('buyer@example.com');
    const claimed = pay({ intent: 'session', accountEmail: 'anna@example.com' });
    expect(needsPerson(claimed)).toBe(false);
    expect(likelyPerson(claimed)).toBe('anna@example.com');
  });

  it('only a session payment is ever booked', () => {
    expect(canBookSession(pay())).toBe(false);
    expect(canBookSession(pay({ intent: 'monthly' }))).toBe(false);
  });

  it('starts on the recorded length, whatever the amount says', () => {
    expect(sessionOptionOf(pay({ intent: 'session', amount: 2500, sessionOption: 'hour' }))).toBe(
      'hour',
    );
  });

  it('guesses the length from the amount, and says nothing when it cannot', () => {
    expect(sessionOptionOf(pay({ intent: 'session', amount: 2500 }))).toBe('half');
    expect(sessionOptionOf(pay({ intent: 'session', amount: 3500 }))).toBe('hour');
    expect(sessionOptionOf(pay({ intent: 'session', amount: 39, currency: 'USD' }))).toBe('hour');
    expect(sessionOptionOf(pay({ intent: 'session', amount: 1 }))).toBeNull();
    expect(sessionOptionOf(pay({ intent: 'session', amount: null }))).toBeNull();
  });

  it('names the refusals of the booking', () => {
    expect(bookErrorKey(new AppError('validation', 'slot_taken'))).toBe('app.adminPayBookErrTaken');
    expect(bookErrorKey(new AppError('validation', 'person_required'))).toBe(
      'app.adminPayBookErrPerson',
    );
    expect(bookErrorKey(new AppError('validation', 'invalid_times'))).toBe(
      'app.adminPayBookErrTime',
    );
    expect(bookErrorKey(new AppError('validation', 'already_applied'))).toBe(
      'app.adminPayBookErrApplied',
    );
    expect(bookErrorKey(new AppError('validation', 'invalid_option'))).toBe(
      'app.adminPayBookErrOption',
    );
    expect(bookErrorKey(new AppError('validation', 'option_mismatch'))).toBe(
      'app.adminPayBookErrLength',
    );
    expect(bookErrorKey(new AppError('network', 'fetch failed'))).toBeNull();
  });
});

describe('formatMoney', () => {
  it('prints the currency, and roubles for old Prodamus rows without one', () => {
    expect(formatMoney('ru', 3990, 'RUB')).toMatch(/3\s990\s₽/);
    expect(formatMoney('en', 19, 'USD')).toBe('$19');
    expect(formatMoney('ru', 3990, null, 'prodamus')).toMatch(/₽/);
    // lava.top без валюты — число без догадок.
    expect(formatMoney('en', 19, null, 'lava')).toBe('19');
    expect(formatMoney('ru', null, 'RUB')).toBe('—');
  });
});

describe('bindErrorKey', () => {
  it('names the refusals the person can act on', () => {
    expect(bindErrorKey(new AppError('validation', 'no_order'))).toBe('app.adminPayErrNoOrder');
    expect(bindErrorKey(new AppError('validation', 'already_applied'))).toBe(
      'app.adminPayErrApplied',
    );
    expect(bindErrorKey(new AppError('network', 'fetch failed'))).toBeNull();
    expect(bindErrorKey('nope')).toBeNull();
  });
});

describe('todayRows', () => {
  const empty = { count: 0, latest: [] };
  const today = (over: Partial<AdminToday> = {}): AdminToday => ({
    signups: empty,
    payments: empty,
    clubJoins: empty,
    proofs: { ...empty, marathonId: null },
    unclaimed: empty,
    support: { count: 0, mode: 'none' },
    bookings: empty,
    ...over,
  });

  it('lists tasks first and links each row to its list', () => {
    const rows = todayRows(today({ unclaimed: { count: 2, latest: [] } }));
    expect(rows.map((r) => r.key)).toEqual([
      'unclaimed',
      'proofs',
      'support',
      'bookings',
      'payments',
      'signups',
      'clubJoins',
    ]);
    expect(rows[0]).toMatchObject({
      count: 2,
      task: true,
      to: '/admin?tab=payments&filter=unclaimed',
    });
    expect(rows.find((r) => r.key === 'support')?.to).toBe('/admin/support');
    expect(rows.find((r) => r.key === 'bookings')?.to).toBe('/admin/bookings');
  });

  it('opens the one club the proofs are in, else the club list', () => {
    const one = todayRows(today({ proofs: { count: 1, latest: [], marathonId: 'm1' } }));
    expect(one.find((r) => r.key === 'proofs')?.to).toBe('/admin/marathons/m1?tab=proofs');
    const many = todayRows(today());
    expect(many.find((r) => r.key === 'proofs')?.to).toBe('/admin/marathons');
  });

  /* «Обращения за сутки» — не задача: без 0045 не видно, отвечены ли они. */
  it('lights support only when it counts unanswered messages', () => {
    const recent = todayRows(today({ support: { count: 3, mode: 'recent' } }));
    expect(recent.find((r) => r.key === 'support')?.task).toBe(false);
    const inbox = todayRows(today({ support: { count: 3, mode: 'unanswered' } }));
    expect(inbox.find((r) => r.key === 'support')?.task).toBe(true);
  });
});
