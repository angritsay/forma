import { describe, expect, it } from 'vitest';
import {
  adminTodayFromDb,
  paymentFromDb,
  paymentPageFromDb,
  type DbPaymentRow,
} from './adminPayments';

const dbRow = (over: Partial<DbPaymentRow> = {}): DbPaymentRow => ({
  id: 'p1',
  email: 'buyer@example.com',
  amount: '3990.00',
  currency: 'RUB',
  intent: 'course',
  provider: 'prodamus',
  provider_ref: 'R-1',
  paid_at: '2026-09-23T10:00:00Z',
  applied: false,
  claimed_at: null,
  account_email: null,
  resolution: null,
  resolved_at: null,
  bound_email: null,
  resolve_note: null,
  course_id: null,
  has_account: false,
  total: '7',
  ...over,
});

describe('paymentFromDb', () => {
  it('turns numeric strings into numbers and keeps the checkout address as typed', () => {
    const r = paymentFromDb(dbRow());
    expect(r.amount).toBe(3990);
    expect(r.email).toBe('buyer@example.com');
    expect(r.intent).toBe('course');
    expect(r.resolution).toBeNull();
    expect(r.hasAccount).toBe(false);
  });

  it('reads empty strings as nothing and unknown values safely', () => {
    const r = paymentFromDb(
      dbRow({ currency: '', provider: '', amount: null, resolution: 'weird', intent: 'x' }),
    );
    expect(r.currency).toBeNull();
    expect(r.provider).toBeNull();
    expect(r.amount).toBeNull();
    expect(r.resolution).toBeNull();
    expect(r.intent).toBe('course');
  });

  it('keeps a bind: who, when, which course', () => {
    const r = paymentFromDb(
      dbRow({
        applied: true,
        resolution: 'bound',
        bound_email: 'anna@example.com',
        course_id: 'start',
        has_account: true,
      }),
    );
    expect(r.applied).toBe(true);
    expect(r.resolution).toBe('bound');
    expect(r.boundEmail).toBe('anna@example.com');
    expect(r.courseId).toBe('start');
  });
});

describe('paymentPageFromDb', () => {
  it('takes the total from the window count', () => {
    expect(paymentPageFromDb([dbRow(), dbRow({ id: 'p2' })]).total).toBe(7);
    expect(paymentPageFromDb([])).toEqual({ rows: [], total: 0 });
  });
});

describe('adminTodayFromDb', () => {
  it('maps every section, counts from bigint strings', () => {
    const t = adminTodayFromDb({
      signups: {
        count: '2',
        latest: [{ email: 'a@x.co', name: 'Аня', at: '2026-09-23T09:00:00Z' }],
      },
      payments: {
        count: 1,
        latest: [
          {
            id: 'p1',
            email: 'b@x.co',
            amount: 19,
            currency: 'USD',
            intent: 'monthly',
            provider: 'lava',
            at: '2026-09-23T08:00:00Z',
          },
        ],
      },
      clubJoins: {
        count: 1,
        latest: [{ email: 'c@x.co', marathonId: 'm1', duo: true, at: '2026-09-23T07:00:00Z' }],
      },
      proofs: {
        count: 3,
        marathonId: 'm1',
        latest: [{ email: 'd@x.co', marathonId: 'm1', day: 4, at: '2026-09-23T06:00:00Z' }],
      },
      unclaimed: { count: 0, latest: [] },
      support: { count: 5, mode: 'recent' },
      bookings: { count: 1, latest: [{ email: 'e@x.co', at: '2026-09-23T15:00:00Z' }] },
    });
    expect(t.signups.count).toBe(2);
    expect(t.signups.latest[0]?.name).toBe('Аня');
    expect(t.payments.latest[0]).toMatchObject({ amount: 19, currency: 'USD', intent: 'monthly' });
    expect(t.clubJoins.latest[0]?.duo).toBe(true);
    expect(t.proofs.marathonId).toBe('m1');
    expect(t.proofs.latest[0]?.day).toBe(4);
    expect(t.support).toEqual({ count: 5, mode: 'recent' });
    expect(t.bookings.count).toBe(1);
  });

  /* База без какого-то раздела (или совсем пустой ответ) — нули, а не падение главной. */
  it('reads missing sections and broken items as zero', () => {
    const t = adminTodayFromDb(null);
    expect(t.unclaimed).toEqual({ count: 0, latest: [] });
    expect(t.proofs.marathonId).toBeNull();
    expect(t.support.mode).toBe('none');
    const u = adminTodayFromDb({ signups: { count: 1, latest: [{ name: 'без почты' }, 'x'] } });
    expect(u.signups.latest).toEqual([]);
  });
});
