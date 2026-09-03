import { describe, expect, it } from 'vitest';
import { COURSES } from '@/content/registry';
import type { PurchaseRow } from '@/lib/api/types';
import { courseName, nextStatuses, purchaseFilter, withStatus } from './model';

function purchase(id: string, status: PurchaseRow['status']): PurchaseRow {
  return {
    id,
    email: `${id}@example.com`,
    courseId: 'start',
    status,
    source: 'landing',
    locale: 'ru',
    note: null,
    createdAt: '2026-09-01T00:00:00Z',
    activatedAt: null,
    updatedAt: '2026-09-01T00:00:00Z',
  };
}

describe('purchaseFilter', () => {
  it('omits the "all" status and blank searches', () => {
    expect(purchaseFilter('all', '   ')).toEqual({});
    expect(purchaseFilter('pending', ' ann@ ')).toEqual({ status: 'pending', search: 'ann@' });
  });
});

describe('nextStatuses', () => {
  it('activates pending and refunded rows, refunds active ones', () => {
    expect(nextStatuses('pending')).toEqual(['active']);
    expect(nextStatuses('active')).toEqual(['refunded']);
    expect(nextStatuses('refunded')).toEqual(['active']);
  });
});

describe('courseName', () => {
  it('resolves known courses per locale and falls back to the id', () => {
    const course = COURSES[0]!;
    expect(courseName(course.id, 'en')).toBe(course.name.en);
    expect(courseName('missing_course', 'ru')).toBe('missing_course');
  });
});

describe('withStatus', () => {
  it('updates one row, stamping activated_at on first activation only', () => {
    const rows = [purchase('a', 'pending'), purchase('b', 'active')];
    const now = '2026-09-03T10:00:00Z';
    const activated = withStatus(rows, 'a', 'active', now);
    expect(activated[0]).toMatchObject({ status: 'active', activatedAt: now, updatedAt: now });
    expect(activated[1]).toBe(rows[1]);
    const refunded = withStatus(activated, 'a', 'refunded', '2026-09-04T00:00:00Z');
    expect(refunded[0]).toMatchObject({ status: 'refunded', activatedAt: now });
    const again = withStatus(refunded, 'a', 'active', '2026-09-05T00:00:00Z');
    expect(again[0]?.activatedAt).toBe(now);
  });
});
