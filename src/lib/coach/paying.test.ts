import { describe, expect, it } from 'vitest';
import {
  activeIds,
  clearPaying,
  PAYING_FORGET_MS,
  PAYING_KEY,
  payingState,
  paymentLanded,
  readPaying,
  writePaying,
  type PayingRecord,
} from './paying';
import { PAYMENT_CHECK_MINUTES } from './slots';

function memory(): Pick<Storage, 'getItem' | 'setItem' | 'removeItem'> & {
  data: Map<string, string>;
} {
  const data = new Map<string, string>();
  return {
    data,
    getItem: (k) => data.get(k) ?? null,
    setItem: (k, v) => void data.set(k, v),
    removeItem: (k) => void data.delete(k),
  };
}

const T = Date.parse('2026-10-05T07:00:00Z');
const record: PayingRecord = {
  user: 'u1',
  holdId: 'h1',
  sentAt: T,
  deadline: T + 15 * 60_000,
  startsAt: '2026-10-07T07:00:00Z',
  known: ['b0'],
};

describe('the payment in flight survives a reload', () => {
  it('is read back for the same account only', () => {
    const store = memory();
    writePaying(record, store);
    expect(readPaying('u1', T, store)).toEqual(record);
    expect(readPaying('u2', T, store)).toBeNull();
    clearPaying(store);
    expect(readPaying('u1', T, store)).toBeNull();
  });

  it('is forgotten a day after the hold ended, and never trusted when malformed', () => {
    const store = memory();
    writePaying(record, store);
    expect(readPaying('u1', record.deadline + PAYING_FORGET_MS + 1, store)).toBeNull();
    expect(store.data.has(PAYING_KEY)).toBe(false);
    store.setItem(PAYING_KEY, '{"user":"u1","holdId":1}');
    expect(readPaying('u1', T, store)).toBeNull();
    store.setItem(PAYING_KEY, 'not json');
    expect(readPaying('u1', T, store)).toBeNull();
  });

  it('works without storage at all (private mode)', () => {
    const broken = {
      getItem: () => {
        throw new Error('blocked');
      },
      setItem: () => {
        throw new Error('blocked');
      },
      removeItem: () => {
        throw new Error('blocked');
      },
    };
    expect(() => writePaying(record, broken)).not.toThrow();
    expect(readPaying('u1', T, broken)).toBeNull();
    expect(() => clearPaying(broken)).not.toThrow();
    expect(readPaying('u1', T, null)).toBeNull();
  });
});

describe('where a reloaded screen stands', () => {
  it('shows the live hold as paid-for, and checks once it is gone', () => {
    expect(payingState(record, { id: 'h1' }, T)).toBe('holding');
    expect(payingState(record, null, record.deadline + 60_000)).toBe('checking');
    // Counted from the hold's end, not from the reload.
    expect(payingState(record, null, record.deadline + PAYMENT_CHECK_MINUTES * 60_000 + 1)).toBe(
      'unconfirmed',
    );
  });

  it('is stale when another hold is live now', () => {
    expect(payingState(record, { id: 'h2' }, T)).toBe('stale');
  });
});

describe('the payment landed', () => {
  it('when the held slot became a session', () => {
    expect(paymentLanded([{ id: 'h1', status: 'active' }], record)).toBe(true);
  });

  it('when a session appeared under another id (a claim, the admin, another device)', () => {
    expect(
      paymentLanded(
        [
          { id: 'b0', status: 'active' },
          { id: 'b9', status: 'active' },
        ],
        record,
      ),
    ).toBe(true);
  });

  it('not when only what was already booked is there, or a new one is cancelled', () => {
    expect(paymentLanded([{ id: 'b0', status: 'active' }], record)).toBe(false);
    expect(paymentLanded([{ id: 'b9', status: 'cancelled' }], record)).toBe(false);
  });

  it('knows the active ids a record starts from', () => {
    expect(
      activeIds([
        { id: 'a', status: 'active' },
        { id: 'c', status: 'cancelled' },
      ]),
    ).toEqual(['a']);
  });
});
