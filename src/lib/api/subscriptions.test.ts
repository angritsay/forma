import { describe, expect, it } from 'vitest';
import { subscriptionFromDb, subscriptionLive, subscriptionRowFromDb } from './mappers';

const NOW = Date.parse('2026-09-09T12:00:00Z');

describe('subscriptionLive', () => {
  it('is true for active or cancelled rows whose paid period is not over', () => {
    expect(subscriptionLive('active', '2026-10-01T00:00:00Z', NOW)).toBe(true);
    expect(subscriptionLive('cancelled', '2026-10-01T00:00:00Z', NOW)).toBe(true);
  });
  it('is false once the period is over, for pending rows, and without a date', () => {
    expect(subscriptionLive('active', '2026-09-01T00:00:00Z', NOW)).toBe(false);
    expect(subscriptionLive('pending', '2026-10-01T00:00:00Z', NOW)).toBe(false);
    expect(subscriptionLive('active', null, NOW)).toBe(false);
    expect(subscriptionLive('active', 'not a date', NOW)).toBe(false);
  });
});

describe('subscriptionFromDb', () => {
  it('trusts the server verdict when present and falls back to the client rule', () => {
    expect(
      subscriptionFromDb({
        plan: 'annual',
        status: 'active',
        started_at: '2026-09-01T00:00:00Z',
        expires_at: '2027-09-01T00:00:00Z',
        is_live: true,
      }),
    ).toEqual({
      plan: 'annual',
      status: 'active',
      startedAt: '2026-09-01T00:00:00Z',
      expiresAt: '2027-09-01T00:00:00Z',
      isLive: true,
    });
    const fallback = subscriptionFromDb({
      plan: 'monthly',
      status: 'pending',
      started_at: null,
      expires_at: null,
      is_live: null,
    });
    expect(fallback.isLive).toBe(false);
    expect(fallback.plan).toBe('monthly');
  });
  it('never lets an unknown plan or status through', () => {
    const s = subscriptionFromDb({
      plan: 'weekly',
      status: 'weird',
      started_at: null,
      expires_at: null,
      is_live: null,
    });
    expect(s.plan).toBe('monthly');
    expect(s.status).toBe('pending');
  });
});

describe('subscriptionRowFromDb', () => {
  it('maps the admin row with nulls preserved', () => {
    expect(
      subscriptionRowFromDb({
        id: 's1',
        email: 'a@example.com',
        plan: 'monthly',
        status: 'cancelled',
        started_at: '2026-09-01T00:00:00Z',
        expires_at: '2026-10-01T00:00:00Z',
        source: 'prodamus',
        provider_ref: 'ord-1',
        locale: null,
        note: null,
        created_at: '2026-09-01T00:00:00Z',
        updated_at: '2026-09-02T00:00:00Z',
      }),
    ).toMatchObject({
      id: 's1',
      status: 'cancelled',
      providerRef: 'ord-1',
      locale: null,
      note: null,
    });
  });
});
