/** The code step outlives the round trip to the mail app, and not the code's own lifetime. */
import { describe, expect, it } from 'vitest';
import { clearPendingCode, readPendingCode, savePendingCode } from './pendingCode';

function memory() {
  const m = new Map<string, string>();
  return {
    getItem: (k: string) => m.get(k) ?? null,
    setItem: (k: string, v: string) => void m.set(k, v),
    removeItem: (k: string) => void m.delete(k),
  };
}

const T = Date.parse('2026-09-30T10:00:00Z');

describe('pending sign-in code', () => {
  it('comes back after a reload while the code still works', () => {
    const store = memory();
    savePendingCode({ email: 'a@example.com', sentAt: T }, store);
    expect(readPendingCode(600, T + 120_000, store)).toEqual({ email: 'a@example.com', sentAt: T });
  });

  it('is gone once the code has expired, and is removed on the way', () => {
    const store = memory();
    savePendingCode({ email: 'a@example.com', sentAt: T }, store);
    expect(readPendingCode(600, T + 601_000, store)).toBeNull();
    expect(readPendingCode(600, T + 1_000, store)).toBeNull();
  });

  it('is gone after sign-in or a change of address', () => {
    const store = memory();
    savePendingCode({ email: 'a@example.com', sentAt: T }, store);
    clearPendingCode(store);
    expect(readPendingCode(600, T, store)).toBeNull();
  });
});
