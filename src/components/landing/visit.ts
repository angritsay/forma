/**
 * What the static site remembers about a visit, and how its links carry it into the app.
 *
 * The layout's one client script (`src/layouts/Landing.astro`) runs this on every page:
 *
 * - `?ref=<code>` → `localStorage['forma.referral']`, by the app's rule (`stashReferral` in
 *   `duoInvite.ts`): the pattern of `referral_codes.code` (0051) and *first code wins* — a second
 *   friend's link does not take the reward away from the first one. The rule is repeated here, not
 *   imported: `duoInvite` pulls in `@/lib/api/errors` (zod, Supabase error codes), ~65 KB that
 *   every site page would load for two tiny functions. `visit.test.ts` runs both copies side by
 *   side so they cannot drift.
 * - First touch → `localStorage['forma.src']`: `utm_source` (+ `utm_campaign`), else `?src=`, else
 *   the page the person landed on (`site`, `site-courses-…`). Lower-case, `[a-z0-9_-]`, at most 40
 *   characters — the same shape the app's `?src=` reader accepts (`src/app/features/entry/params.ts`)
 *   and the order RPCs keep (`create_order` cuts `p_source` at 40). Written once, never overwritten:
 *   the first source is the one that found the person; the next ones are just the way back.
 * - `[data-goal]` clicks → a Metrika goal and a GA event, **only** when the counters are on the
 *   page. Nothing is queued for a counter that was never loaded.
 * - With a referral pending, every `[data-app-link]` gets `ref=<code>` in its query (before the
 *   hash, where `appHref` puts it), and every `[data-club-join]` is sent through the app's club
 *   screen instead of the pay-first form: `/app/?lang&ref#/marathon`. The code has to be attached
 *   to an account *before* the payment for the +30 days to happen (site synthesis §1).
 *
 * The parsing is pure and tested (`visit.test.ts`); {@link bindVisit} is the thin DOM wrapper.
 */
import { appHref, parsePath } from '@/lib/util/paths';

/** The app's key (`REFERRAL_KEY` in marathon/duoInvite.ts), repeated to keep the app out of the site bundle. */
export const REFERRAL_KEY = 'forma.referral';

/** The pattern of `referral_codes.code` (0051), as `CODE_RE` in duoInvite.ts. */
const REFERRAL_RE = /^[a-z0-9]{8}$/;

/** The app's key (`SRC_KEY` in entry/params.ts), repeated so the site bundle skips the app store. */
export const SRC_KEY = 'forma.src';

const SRC_MAX = 40;

type StorageLike = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>;

function localStore(): StorageLike | null {
  try {
    return typeof localStorage === 'undefined' ? null : localStorage;
  } catch {
    return null;
  }
}

function isReferralCode(code: string | null | undefined): code is string {
  return typeof code === 'string' && REFERRAL_RE.test(code);
}

/** A friend's code from `?ref=`, kept until the app attaches it. First code wins. */
export function stashReferral(code: string | undefined, store = localStore()): boolean {
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

/** Any text → a report label: lower-case, `[a-z0-9_-]`, dashes collapsed, ≤ 40, or '' if nothing is left. */
export function slugSource(raw: string): string {
  return raw
    .toLowerCase()
    .replace(/[^a-z0-9_-]+/g, '-')
    .replace(/-{2,}/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, SRC_MAX)
    .replace(/-+$/, '');
}

/**
 * Where this visit came from, as one label. A campaign says so itself (`utm_*`), a link built by us
 * says it with `?src=`, and a visit with neither is named after the page it started on.
 */
export function visitSource(search: string, pathname: string): string {
  const q = new URLSearchParams(search);
  const utm = [q.get('utm_source'), q.get('utm_campaign')].filter(Boolean).join('-');
  const fromUtm = slugSource(utm);
  if (fromUtm) return fromUtm;
  const fromSrc = slugSource(q.get('src') ?? '');
  if (fromSrc) return fromSrc;
  const { locale, path } = parsePath(pathname);
  const page = slugSource(path.replace(/\//g, '-'));
  return slugSource(['site', locale === 'ru' ? '' : locale, page].filter(Boolean).join('-'));
}

/** First touch: written once, never overwritten. */
export function rememberSource(src: string, store = localStore()): boolean {
  if (!store || !src) return false;
  try {
    if (store.getItem(SRC_KEY)) return false;
    store.setItem(SRC_KEY, src);
    return true;
  } catch {
    return false;
  }
}

/** The remembered first-touch label, or null (no storage, nothing written, or not our shape). */
export function rememberedSource(store = localStore()): string | null {
  if (!store) return null;
  try {
    const src = store.getItem(SRC_KEY);
    return src && src === slugSource(src) ? src : null;
  } catch {
    return null;
  }
}

/**
 * An app link with the referral code added to its query — before the hash, which belongs to the
 * app's router. Any query already there (`lang`, `len`) is kept; a `ref` already there is replaced.
 */
export function withRef(link: string, code: string): string {
  const hashAt = link.indexOf('#');
  const head = hashAt === -1 ? link : link.slice(0, hashAt);
  const hash = hashAt === -1 ? '' : link.slice(hashAt);
  const queryAt = head.indexOf('?');
  const path = queryAt === -1 ? head : head.slice(0, queryAt);
  const q = new URLSearchParams(queryAt === -1 ? '' : head.slice(queryAt + 1));
  q.set('ref', code);
  return `${path}?${q.toString()}${hash}`;
}

/** Where a club button goes for a visitor who came with a friend's code: the app's club screen. */
export function clubJoinWithRef(pathname: string, code: string): string {
  return appHref('/marathon', { locale: parsePath(pathname).locale, ref: code });
}

/** The pieces of `window` the goal reporter needs; both are optional by nature. */
interface Counters {
  ym?: (id: number, method: 'reachGoal', goal: string) => void;
  gtag?: (command: 'event', goal: string) => void;
}

/** Report a goal to whichever counters are actually loaded. */
export function reachGoal(goal: string, metrikaId: number | null, win: Counters): void {
  try {
    if (metrikaId !== null && typeof win.ym === 'function') win.ym(metrikaId, 'reachGoal', goal);
    if (typeof win.gtag === 'function') win.gtag('event', goal);
  } catch {
    /* A blocked or half-loaded counter must never break the click it is only watching. */
  }
}

/** The Metrika counter id, from the same env variable and pattern as Analytics.astro. */
function metrikaCounter(): number | null {
  const raw = String(import.meta.env.PUBLIC_YANDEX_METRIKA_ID ?? '').trim();
  return /^\d{4,12}$/.test(raw) ? Number(raw) : null;
}

/** Run once per page load, from the layout's script. */
export function bindVisit(win: Window = window): void {
  const { search, pathname } = win.location;
  const ref = new URLSearchParams(search).get('ref');
  stashReferral(ref ?? undefined);
  rememberSource(visitSource(search, pathname));

  const code = pendingReferral();
  if (code) {
    win.document.querySelectorAll<HTMLAnchorElement>('a[data-app-link]').forEach((a) => {
      const link = a.getAttribute('href');
      if (link) a.setAttribute('href', withRef(link, code));
    });
    win.document.querySelectorAll<HTMLAnchorElement>('a[data-club-join]').forEach((a) => {
      a.setAttribute('href', clubJoinWithRef(pathname, code));
    });
  }

  const metrikaId = metrikaCounter();
  win.document.addEventListener('click', (e) => {
    const el = e.target instanceof Element ? e.target.closest<HTMLElement>('[data-goal]') : null;
    const goal = el?.dataset.goal;
    if (goal) reachGoal(goal, metrikaId, win as unknown as Counters);
  });
}
