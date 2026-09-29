/**
 * A friend's referral code (0051) waiting to be attached: one rule for the site and the app.
 *
 * The code arrives in a link — `?ref=<code>` on the site or the app, `?startapp=ref_<code>` in
 * Telegram — often days before the person signs up and pays. It waits in
 * `localStorage['forma.referral']` (not the session: the tab that opened the link is long closed by
 * then) and is removed right after the app's first attempt to attach it (`referral_attach`).
 *
 * Two rules, the server's own:
 *
 * - the shape of `referral_codes.code` (0051), `^[a-z0-9]{8}$` — anything else is not ours and is
 *   never stored;
 * - *first code wins*: a code already waiting is not overwritten, so a second friend's link does
 *   not take the reward away from the first one (the same rule `referrals` keys on).
 *
 * This module is the single copy. The app re-exports it from `marathon/duoInvite.ts`, and the
 * site's layout script (`components/landing/visit.ts`) imports it directly — which is why it
 * imports nothing at all: anything from `@/app` or `@/lib/api` would ride along into every static
 * page (`visit.test.ts` checks both).
 */

/** Where the code waits until the app attaches it. */
export const REFERRAL_KEY = 'forma.referral';

/** The pattern of `referral_codes.code` (0051). */
export const REFERRAL_CODE_RE = /^[a-z0-9]{8}$/;

type StorageLike = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>;

/** `localStorage`, or null where there is none or it throws (private mode, blocked site data). */
export function localStore(): StorageLike | null {
  try {
    return typeof localStorage === 'undefined' ? null : localStorage;
  } catch {
    return null;
  }
}

/** A referral code in the shape of `referral_codes.code`, and nothing else. */
export function isReferralCode(code: string | null | undefined): code is string {
  return typeof code === 'string' && REFERRAL_CODE_RE.test(code);
}

/** Set a code aside until sign-in. A code already waiting stays: the first code wins. */
export function stashReferral(code: string | null | undefined, store = localStore()): boolean {
  if (!store || !isReferralCode(code)) return false;
  try {
    if (isReferralCode(store.getItem(REFERRAL_KEY))) return false;
    store.setItem(REFERRAL_KEY, code);
    return true;
  } catch {
    return false;
  }
}

/** The code waiting to be attached, or null. */
export function pendingReferral(store = localStore()): string | null {
  if (!store) return null;
  try {
    const code = store.getItem(REFERRAL_KEY);
    return isReferralCode(code) ? code : null;
  } catch {
    return null;
  }
}

/** Drop the waiting code — after the first attempt to attach it, whatever the answer. */
export function clearReferral(store = localStore()): void {
  try {
    store?.removeItem(REFERRAL_KEY);
  } catch {
    /* Private mode: nothing to remove. */
  }
}
