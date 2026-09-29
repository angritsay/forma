/**
 * What the site (and the bot) can say in the app's query string, read once before the first render.
 *
 * The app is a hash-routed island: everything after `#` belongs to the router, and the part before
 * it — `/app/?lang=en&ref=…#/start` — is the one place a link can carry facts about the *visit*
 * rather than the screen. The site's `appHref(route, { locale, ref })` writes it; this module reads
 * it and then takes it out of the address bar.
 *
 * * `?lang=ru|en` — the language of the page the button was on. Used only when the person has not
 *   chosen one yet: a click on the English site is an answer to «which language?», but it must not
 *   overrule somebody who picked Russian in the app last week — on this device or on their
 *   profile. So it is applied as a hint (`useLocale.hint`): never written to storage, and replaced
 *   by the profile's language on sign-in unless the account is brand new.
 * * `?ref=<code>` — a referral code (0051), into the same long-lived cell as `#/ref/<code>`.
 * * `?startapp=…` / `?tgWebAppStartParam=…` — a Mini App launch parameter arriving in the URL
 *   rather than through Telegram's SDK (an in-app browser, a copied link). Same handling as the
 *   SDK's value in main.tsx.
 * * `?src=<slug>` — which page or campaign sent them. First touch only: the first source is the one
 *   that found the person; later ones are just the way back.
 *
 * The parse is pure and tested; {@link applyEntryParams} is the thin wrapper with the side effects.
 */
import { isLocale } from '@/i18n/index';
import type { Locale } from '@/content/schema';
import { useLocale } from '@/app/store/locale';
import { isReferralCode, stashReferral, stashStartParam } from '@/app/features/marathon/duoInvite';

export const SRC_KEY = 'forma.src';

/** Short, lower-case, URL-safe: a label for a report, never free text. */
const SRC_RE = /^[a-z0-9_-]{1,40}$/;
/** A launch parameter is 64 characters at most in Telegram; anything longer is not one. */
const START_RE = /^[A-Za-z0-9_-]{1,64}$/;

/** The keys this module reads — and the only ones it removes from the address. */
const OWN_KEYS = ['lang', 'ref', 'startapp', 'src'] as const;

export interface EntryParams {
  lang: Locale | null;
  ref: string | null;
  startParam: string | null;
  src: string | null;
}

/** Read the query string. Everything malformed comes back as `null`, never half-accepted. */
export function parseEntryParams(search: string): EntryParams {
  const q = new URLSearchParams(search);
  const lang = q.get('lang');
  const ref = q.get('ref');
  const start = q.get('startapp') ?? q.get('tgWebAppStartParam');
  const src = q.get('src');
  return {
    lang: isLocale(lang) ? lang : null,
    ref: isReferralCode(ref) ? ref : null,
    startParam: start && START_RE.test(start) ? start : null,
    src: src && SRC_RE.test(src) ? src : null,
  };
}

/**
 * The address without the keys read here: same path, same hash, any other query kept.
 *
 * Only our keys go. The rest — `tgWebApp*` for Telegram's SDK, a campaign's `utm_*` — belongs to
 * somebody else, and a query that was never ours is not ours to throw away.
 */
export function cleanedUrl(pathname: string, search: string, hash: string): string {
  const q = new URLSearchParams(search);
  for (const key of OWN_KEYS) q.delete(key);
  const rest = q.toString();
  return `${pathname}${rest ? `?${rest}` : ''}${hash}`;
}

type StorageLike = Pick<Storage, 'getItem' | 'setItem'>;

function localStore(): StorageLike | null {
  try {
    return typeof localStorage === 'undefined' ? null : localStorage;
  } catch {
    return null;
  }
}

/** First touch: the source is written once and never overwritten. */
export function rememberSource(src: string, store = localStore()): boolean {
  if (!store) return false;
  try {
    if (store.getItem(SRC_KEY)) return false;
    store.setItem(SRC_KEY, src);
    return true;
  } catch {
    return false;
  }
}

/**
 * Act on the query string and clear it. Called from main.tsx at module load — before the router
 * mounts, so the language is settled before anything with words on it is drawn and the hash is
 * still exactly what the link said.
 */
export function applyEntryParams(win: Window | undefined = globalThis.window): void {
  if (!win) return;
  const { pathname, search, hash } = win.location;
  if (!search) return;
  const params = parseEntryParams(search);
  // A hint, not a choice: an existing profile's language still wins on sign-in (store/locale.ts).
  if (params.lang) useLocale.getState().hint(params.lang);
  if (params.ref) stashReferral(params.ref);
  if (params.startParam) stashStartParam(params.startParam);
  if (params.src) rememberSource(params.src);
  const next = cleanedUrl(pathname, search, hash);
  if (next === `${pathname}${search}${hash}`) return;
  try {
    win.history.replaceState(win.history.state, '', next);
  } catch {
    /* A sandboxed frame may refuse; the query then simply stays in the address. */
  }
}
