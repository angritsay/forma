/**
 * The sign-in code on its way: which address it went to and when.
 *
 * Reading the code means leaving the app for the mail app, and a Telegram WebView or a phone short
 * on memory reloads the page on the way back. The screen then opened on the empty address field,
 * the code in hand was useless, and asking for a new one cost another minute of waiting. Kept
 * here, the code step comes back as it was — for as long as the code can still work.
 *
 * localStorage, because the reload that matters can drop sessionStorage along with the page; the
 * record carries its own expiry and is removed on sign-in or when the address is changed.
 *
 * Pure module, no React: tested in node with an in-memory store.
 */
export const PENDING_CODE_KEY = 'forma.authPending';

export interface PendingCode {
  email: string;
  /** `Date.now()` when the code was asked for. */
  sentAt: number;
}

type StorageLike = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>;

function local(): StorageLike | null {
  try {
    return typeof localStorage === 'undefined' ? null : localStorage;
  } catch {
    return null;
  }
}

export function savePendingCode(p: PendingCode, store = local()): void {
  try {
    store?.setItem(PENDING_CODE_KEY, JSON.stringify(p));
  } catch {
    /* Without storage the code step lasts as long as the page does. */
  }
}

/** The code step to come back to, or null when there is none or its code has expired. */
export function readPendingCode(
  ttlSec: number,
  now = Date.now(),
  store = local(),
): PendingCode | null {
  if (!store) return null;
  try {
    const raw = store.getItem(PENDING_CODE_KEY);
    if (!raw) return null;
    const v = JSON.parse(raw) as Partial<PendingCode>;
    if (typeof v.email !== 'string' || !v.email || typeof v.sentAt !== 'number') return null;
    if (v.sentAt > now || now - v.sentAt > ttlSec * 1000) {
      store.removeItem(PENDING_CODE_KEY);
      return null;
    }
    return { email: v.email, sentAt: v.sentAt };
  } catch {
    return null;
  }
}

export function clearPendingCode(store = local()): void {
  try {
    store?.removeItem(PENDING_CODE_KEY);
  } catch {
    /* Nothing to clean. */
  }
}
