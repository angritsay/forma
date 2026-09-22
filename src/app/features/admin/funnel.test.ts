import { describe, expect, it } from 'vitest';
import type { FunnelWeek } from '@/lib/api/types';
import { closedWeeks, formatPercent, isCurrentWeek, overallRate, stepRate, totals } from './funnel';

function week(weekStart: string, n: Partial<Omit<FunnelWeek, 'weekStart'>> = {}): FunnelWeek {
  return {
    weekStart,
    signedUp: 0,
    onboarded: 0,
    trained: 0,
    repeated: 0,
    paid: 0,
    ...n,
  };
}

describe('isCurrentWeek', () => {
  it('holds from the Monday through the Sunday', () => {
    expect(isCurrentWeek('2026-09-21', '2026-09-21')).toBe(true);
    expect(isCurrentWeek('2026-09-21', '2026-09-27')).toBe(true);
  });

  it('is over on the next Monday', () => {
    expect(isCurrentWeek('2026-09-21', '2026-09-28')).toBe(false);
  });

  it('is not yet true for a week that has not started', () => {
    expect(isCurrentWeek('2026-09-28', '2026-09-27')).toBe(false);
  });

  it('answers false rather than throwing on nonsense', () => {
    expect(isCurrentWeek('', '2026-09-21')).toBe(false);
    expect(isCurrentWeek('2026-09-21', 'вчера')).toBe(false);
  });
});

describe('closedWeeks', () => {
  /*
   * The point of the split: the running week is shown but never averaged in. Its people have not
   * had time to buy, so including it would make every rate sag on a Monday and recover by Sunday.
   */
  it('drops the week that is still running', () => {
    const rows = [week('2026-09-21'), week('2026-09-14'), week('2026-09-07')];
    expect(closedWeeks(rows, '2026-09-23').map((w) => w.weekStart)).toEqual([
      '2026-09-14',
      '2026-09-07',
    ]);
  });

  it('keeps every week when nobody signed up in the running one', () => {
    const rows = [week('2026-09-14'), week('2026-09-07')];
    expect(closedWeeks(rows, '2026-09-23')).toHaveLength(2);
  });
});

describe('totals', () => {
  it('sums the columns', () => {
    const rows = [
      week('2026-09-14', { signedUp: 10, onboarded: 8, trained: 6, repeated: 3, paid: 2 }),
      week('2026-09-07', { signedUp: 5, onboarded: 5, trained: 4, repeated: 2, paid: 1 }),
    ];
    expect(totals(rows)).toEqual({
      signedUp: 15,
      onboarded: 13,
      trained: 10,
      repeated: 5,
      paid: 3,
    });
  });

  it('is all zeroes for no weeks', () => {
    expect(totals([])).toEqual({
      signedUp: 0,
      onboarded: 0,
      trained: 0,
      repeated: 0,
      paid: 0,
    });
  });
});

describe('rates', () => {
  const t = totals([
    week('2026-09-14', { signedUp: 20, onboarded: 10, trained: 5, repeated: 2, paid: 1 }),
  ]);

  it('reads a step against the step before it', () => {
    expect(stepRate(t, 'onboarded')).toBe(0.5);
    expect(stepRate(t, 'trained')).toBe(0.5);
    expect(stepRate(t, 'paid')).toBe(0.5);
  });

  it('has nothing to say about the first step', () => {
    expect(stepRate(t, 'signedUp')).toBeNull();
  });

  it('reads a step against everybody who signed in', () => {
    expect(overallRate(t, 'paid')).toBe(0.05);
    expect(overallRate(t, 'signedUp')).toBe(1);
  });

  /* «0 из 0» — отсутствие ответа, а не ноль процентов: рисовать его провалом нельзя. */
  it('answers null instead of zero when there is nobody to divide by', () => {
    const empty = totals([]);
    expect(stepRate(empty, 'paid')).toBeNull();
    expect(overallRate(empty, 'paid')).toBeNull();
  });
});

describe('formatPercent', () => {
  it('rounds to whole percents', () => {
    expect(formatPercent('ru', 0.125)).toBe('13%');
    expect(formatPercent('ru', 1)).toBe('100%');
    expect(formatPercent('ru', 0)).toBe('0%');
  });

  it('shows a dash when there is no rate', () => {
    expect(formatPercent('ru', null)).toBe('—');
  });
});
