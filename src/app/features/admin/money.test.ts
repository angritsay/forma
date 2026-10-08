import { describe, expect, it } from 'vitest';
import {
  formatAmounts,
  formatMoney,
  memberMonths,
  moneyMonths,
  previousMonth,
  sourceTotals,
} from './money';

describe('moneyMonths', () => {
  it('folds a month, keeps currencies apart and counts new payers', () => {
    const [m, older] = moneyMonths([
      {
        month: '2026-09-01',
        currency: 'RUB',
        intent: 'monthly',
        payments: 3,
        amount: 5970,
        firstPayments: 1,
      },
      {
        month: '2026-09-01',
        currency: 'USD',
        intent: 'annual',
        payments: 1,
        amount: 79,
        firstPayments: 1,
      },
      {
        month: '2026-09-01',
        currency: 'RUB',
        intent: 'annual',
        payments: 1,
        amount: 7990,
        firstPayments: 1,
      },
      {
        month: '2026-08-01',
        currency: 'RUB',
        intent: 'course',
        payments: 1,
        amount: 2990,
        firstPayments: 1,
      },
    ]);
    expect(m!.month).toBe('2026-09-01');
    expect(m!.amounts).toEqual([
      { currency: 'RUB', amount: 13960 },
      { currency: 'USD', amount: 79 },
    ]);
    expect(m!.payments).toBe(5);
    expect(m!.newPayers).toBe(3);
    expect(m!.homeByIntent).toEqual({ monthly: 5970, annual: 7990 });
    expect(older!.month).toBe('2026-08-01');
  });

  it('puts roubles first whatever order the rows came in', () => {
    const [m] = moneyMonths([
      {
        month: '2026-09-01',
        currency: 'EUR',
        intent: 'course',
        payments: 1,
        amount: 30,
        firstPayments: 0,
      },
      {
        month: '2026-09-01',
        currency: 'RUB',
        intent: 'course',
        payments: 1,
        amount: 2990,
        firstPayments: 0,
      },
    ]);
    expect(m!.amounts.map((a) => a.currency)).toEqual(['RUB', 'EUR']);
  });
});

describe('memberMonths', () => {
  it('adds members across currencies and measures churn against the month before', () => {
    const [sep, aug] = memberMonths([
      {
        month: '2026-08-01',
        currency: 'RUB',
        members: 18,
        monthly: 10,
        annual: 8,
        mrr: 25226,
        lost: 0,
      },
      { month: '2026-08-01', currency: 'USD', members: 2, monthly: 2, annual: 0, mrr: 38, lost: 0 },
      {
        month: '2026-09-01',
        currency: 'RUB',
        members: 20,
        monthly: 11,
        annual: 9,
        mrr: 27880,
        lost: 3,
      },
      {
        month: '2026-09-01',
        currency: 'USD',
        members: 2,
        monthly: 1,
        annual: 1,
        mrr: 25.58,
        lost: 1,
      },
    ]);
    expect(sep!.members).toBe(22);
    expect(sep!.lost).toBe(4);
    expect(sep!.churn).toBeCloseTo(4 / 20);
    expect(sep!.mrr.map((x) => x.currency)).toEqual(['RUB', 'USD']);
    expect(aug!.churn).toBeNull();
  });

  it('has no churn, not zero churn, after a month with nobody', () => {
    const [m] = memberMonths([
      {
        month: '2026-09-01',
        currency: 'RUB',
        members: 1,
        monthly: 1,
        annual: 0,
        mrr: 1990,
        lost: 0,
      },
      { month: '2026-08-01', currency: 'RUB', members: 0, monthly: 0, annual: 0, mrr: 0, lost: 0 },
    ]);
    expect(m!.churn).toBeNull();
  });
});

describe('previousMonth', () => {
  it('steps back across a year', () => {
    expect(previousMonth('2026-03-01')).toBe('2026-02-01');
    expect(previousMonth('2026-01-01')).toBe('2025-12-01');
  });
});

describe('sourceTotals', () => {
  it('takes a channel’s counts once and its money per currency', () => {
    const [ads, site] = sourceTotals([
      { source: 'tgads-oct', people: 40, trained: 20, paid: 4, currency: 'RUB', amount: 15960 },
      { source: 'tgads-oct', people: 40, trained: 20, paid: 4, currency: 'USD', amount: 19 },
      { source: 'site', people: 10, trained: 3, paid: 0, currency: null, amount: 0 },
    ]);
    expect(ads).toMatchObject({ source: 'tgads-oct', people: 40, paid: 4, conversion: 0.1 });
    expect(ads!.amounts).toEqual([
      { currency: 'RUB', amount: 15960 },
      { currency: 'USD', amount: 19 },
    ]);
    expect(site).toMatchObject({ source: 'site', conversion: 0, amounts: [] });
  });
});

describe('formatMoney', () => {
  it('prints a known currency and survives an unknown one', () => {
    expect(formatMoney('en', 79, 'USD')).toBe('$79');
    expect(formatMoney('en', 1200, '???')).toBe('1,200 ???');
    expect(formatAmounts('en', [])).toBe('—');
  });
});
