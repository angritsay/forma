/**
 * A payment in flight for a held slot, remembered past a reload.
 *
 * `sent` — «the payment page was opened from here» — used to live in the screen's state only, so
 * a reload, or Telegram killing the Mini App while the person paid in the browser, forgot it.
 * The hold then ran out as a plain «время вышло, выбери снова», which is the one sentence that
 * invites a second payment (0056). So the moment the till opens, the screen writes down which
 * hold it was for, when, and which sessions the person already had; the record goes when a
 * session appears or the person says they did not pay.
 *
 * What was already booked is part of the record because the payment does not always confirm the
 * hold it was opened for: a claim from another address, the admin booking it by hand (0056) or a
 * second device can each end in a session with another id. Any active session that was not there
 * when the till opened is the payment landing.
 *
 * Pure, with the storage passed in, so it is tested without a browser; every storage call is
 * wrapped, because private mode and blocked site data throw.
 */
import type { CoachBooking } from '@/lib/api/types';
import { localStore } from '@/lib/referral/pending';
import { holdLapse, type HoldLapse } from './slots';

/** Where the record waits. One per device: a person pays for one slot at a time. */
export const PAYING_KEY = 'forma.book.paying';

/** After this long past the hold's end the record is forgotten, answered or not. */
export const PAYING_FORGET_MS = 24 * 3_600_000;

export interface PayingRecord {
  /** The account it belongs to: a second account on the same phone is somebody else. */
  user: string;
  holdId: string;
  /** When the till was opened, on this device's clock. */
  sentAt: number;
  /** When the hold runs out, on this device's clock (`holdDeadline`). */
  deadline: number;
  /** The held start, for the message to the coach while the payment is checked. */
  startsAt: string;
  /**
   * Active sessions the person had when the till opened; null when the list could not be read
   * then. Without it a session the person already had would read as the payment landing, so only
   * the held slot's own id counts.
   */
  known: string[] | null;
}

type StorageLike = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>;

function isRecord(v: unknown): v is PayingRecord {
  if (typeof v !== 'object' || v === null) return false;
  const r = v as Record<string, unknown>;
  return (
    typeof r.user === 'string' &&
    typeof r.holdId === 'string' &&
    typeof r.sentAt === 'number' &&
    Number.isFinite(r.sentAt) &&
    typeof r.deadline === 'number' &&
    Number.isFinite(r.deadline) &&
    typeof r.startsAt === 'string' &&
    (r.known === null || (Array.isArray(r.known) && r.known.every((x) => typeof x === 'string')))
  );
}

/** The record for `user`, or null: none, another account's, unreadable, or long forgotten. */
export function readPaying(
  user: string,
  now: number,
  store: StorageLike | null = localStore(),
): PayingRecord | null {
  if (!store || !user) return null;
  try {
    const raw = store.getItem(PAYING_KEY);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    if (!isRecord(parsed) || parsed.user !== user) return null;
    if (now - parsed.deadline > PAYING_FORGET_MS) {
      store.removeItem(PAYING_KEY);
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export function writePaying(record: PayingRecord, store: StorageLike | null = localStore()): void {
  try {
    store?.setItem(PAYING_KEY, JSON.stringify(record));
  } catch {
    /* Private mode: the screen still knows until it is closed. */
  }
}

export function clearPaying(store: StorageLike | null = localStore()): void {
  try {
    store?.removeItem(PAYING_KEY);
  } catch {
    /* Nothing to remove. */
  }
}

/** The ids of the active sessions in a list — what `known` is made of. */
export function activeIds(list: readonly Pick<CoachBooking, 'id' | 'status'>[]): string[] {
  return list.filter((b) => b.status === 'active').map((b) => b.id);
}

/**
 * The payment landed: the held slot became a session, or an active session appeared that was not
 * there when the till opened (a claim, the admin, another device). With `known` unread (null) only
 * the held slot counts: any session could be one the person already had.
 */
export function paymentLanded(
  list: readonly Pick<CoachBooking, 'id' | 'status'>[],
  paying: Pick<PayingRecord, 'holdId' | 'known'>,
): boolean {
  return list.some(
    (b) =>
      b.status === 'active' &&
      (b.id === paying.holdId || (paying.known !== null && !paying.known.includes(b.id))),
  );
}

/**
 * Where a reloaded screen stands with a remembered payment, given the live hold the server
 * returned (or null) at `now`:
 *
 *   * `holding` — the same hold is still live: its panel shows, as «оплата открылась»;
 *   * `checking` / `unconfirmed` — it is gone: the money may be on its way (`holdLapse`), counted
 *     from the hold's end, not from the reload;
 *   * `stale` — another hold is live now: the record is about a slot the person moved away from.
 */
export type PayingState = 'holding' | 'stale' | Exclude<HoldLapse, 'expired'>;

export function payingState(
  paying: Pick<PayingRecord, 'holdId' | 'deadline'>,
  hold: { id: string } | null,
  now: number,
): PayingState {
  if (hold) return hold.id === paying.holdId ? 'holding' : 'stale';
  const lapse = holdLapse(true, Math.min(paying.deadline, now), now);
  return lapse === 'expired' ? 'checking' : lapse;
}
