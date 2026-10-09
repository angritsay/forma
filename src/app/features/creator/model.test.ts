import { describe, expect, it } from 'vitest';
import type { CreatorStatementRow } from '@/lib/api/types';
import {
  balanceSide,
  canUnlist,
  creatorAddress,
  creatorPageLive,
  creatorStage,
  salesCount,
  statementMonths,
} from './model';

const row = (
  month: string,
  currency: string,
  sales: number,
  balance: number,
  sessionSales = 0,
): CreatorStatementRow => ({
  month,
  currency,
  tier: 'pro',
  feePct: 0,
  sales,
  gross: sales * 100,
  sessionSales,
  sessionGross: sessionSales * 50,
  formaShare: sales * 10,
  creatorShare: sales * 90,
  monthlyFee: 0,
  balance,
});

describe('statementMonths', () => {
  it('groups by month, newest first, roubles leading', () => {
    const lines = statementMonths([
      row('2026-08-01', 'RUB', 1, 10),
      row('2026-09-01', 'USD', 2, 20),
      row('2026-09-01', 'RUB', 3, 5020),
    ]);
    expect(lines.map((l) => l.month)).toEqual(['2026-09-01', '2026-08-01']);
    expect(lines[0]!.rows.map((r) => r.currency)).toEqual(['RUB', 'USD']);
    expect(salesCount(lines[0])).toBe(5);
    expect(salesCount(undefined)).toBe(0);
  });

  it('counts paid sessions as sales of the month', () => {
    const lines = statementMonths([
      row('2026-09-01', 'RUB', 1, 10, 2),
      row('2026-09-01', 'XTS', 0, 0, 1),
    ]);
    expect(salesCount(lines[0])).toBe(4);
  });
});

describe('balanceSide', () => {
  it('reads the sign, and ignores rounding', () => {
    expect(balanceSide(4990)).toBe('creatorOwes');
    expect(balanceSide(-1200)).toBe('formaOwes');
    expect(balanceSide(0.4)).toBe('even');
  });
});

describe('creatorStage', () => {
  it('maps a status to what the screen draws', () => {
    expect(creatorStage(null)).toBe('none');
    expect(creatorStage('applied')).toBe('applied');
    expect(creatorStage('declined')).toBe('declined');
    expect(creatorStage('active')).toBe('open');
    expect(creatorStage('paused')).toBe('open');
  });
});

describe('creatorAddress', () => {
  it('builds the page address', () => {
    expect(creatorAddress('forma-app.co/', 'alla-yoga')).toBe('forma-app.co/c/alla-yoga');
  });
});

describe('creatorPageLive', () => {
  it('links the page only for an open creator with a published course', () => {
    expect(creatorPageLive({ status: 'active', published: 1 })).toBe(true);
    expect(creatorPageLive({ status: 'active', published: 0 })).toBe(false);
    expect(creatorPageLive({ status: 'paused', published: 2 })).toBe(false);
    expect(creatorPageLive({ status: 'applied', published: 1 })).toBe(false);
    expect(creatorPageLive(null)).toBe(false);
  });
});

describe('canUnlist', () => {
  it('lets only Pro leave the catalogue', () => {
    expect(canUnlist('pro')).toBe(true);
    expect(canUnlist('start')).toBe(false);
  });
});
