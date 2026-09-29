/**
 * Where a link was going, kept across the detours the app puts in front of it.
 *
 * A deep link into the app (`/app/#/book`, `/app/#/courses/start/nodes/…`) is usually opened by
 * somebody who is signed out or not through onboarding yet. The guards send them to `/auth` and
 * `/onboarding`, and both of those used to end on `/` — so the link that brought them here was
 * forgotten by the time they could use it. The guards now set the destination aside
 * ({@link rememberNext}) and the two screens that end the detours take it back
 * ({@link consumeNext}).
 *
 * ## Why a whitelist
 *
 * The value ends up in `navigate()`. Anything a stranger can put in a link can end up here, so it
 * must never be a place the app would not send somebody on its own: another origin (`//evil.com`,
 * `https://…`), the admin panel, a screen that only makes sense mid-flow (`/play`, `/summary/…`).
 * The list is the handful of places the site and the bot actually link to, and the check is a
 * single anchored pattern rather than a parser, so there is nothing to be clever around.
 *
 * ## Why sessionStorage
 *
 * The detour is one visit: the sign-in code arrives in the same tab, onboarding happens in the
 * same tab. A destination that outlived the tab would ambush the person the next time they open
 * the app for an unrelated reason.
 *
 * Pure module, no React: tested in node with an in-memory store.
 */

export const NEXT_KEY = 'forma.next';

/**
 * The places a link may land after sign-in or onboarding. Kept exactly in step with the routes in
 * `router.tsx` that the site and the bot link to; everything else falls back to `/`.
 */
const NEXT_RE =
  /^\/(start|marathon|invite|duo|book(\?len=(half|hour))?|courses\/[a-z0-9-]+(\/nodes\/[A-Za-z0-9_-]+)?)$/;

type StorageLike = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>;

function sessionStore(): StorageLike | null {
  try {
    return typeof sessionStorage === 'undefined' ? null : sessionStorage;
  } catch {
    return null;
  }
}

/** Is this a destination the app may be sent to on a link's say-so? */
export function isNextPath(path: string | null | undefined): path is string {
  return typeof path === 'string' && NEXT_RE.test(path);
}

/**
 * Set a destination aside until the detour ends. Anything off the list is not stored — and it
 * clears whatever an earlier detour left, because only the newest redirect speaks for what the
 * person wants now: a `/book` set aside an hour ago must not beat the plain «open app» they just
 * clicked.
 */
export function rememberNext(path: string, store = sessionStore()): boolean {
  if (!store) return false;
  try {
    if (!isNextPath(path)) {
      store.removeItem(NEXT_KEY);
      return false;
    }
    store.setItem(NEXT_KEY, path);
    return true;
  } catch {
    return false;
  }
}

/**
 * Take the destination back — once. The key is removed whatever it held, so a stale or tampered
 * value cannot come back on the next sign-in; `null` means «go to the default».
 */
export function consumeNext(store = sessionStore()): string | null {
  if (!store) return null;
  try {
    const path = store.getItem(NEXT_KEY);
    store.removeItem(NEXT_KEY);
    return isNextPath(path) ? path : null;
  } catch {
    return null;
  }
}
