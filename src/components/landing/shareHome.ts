/**
 * «Позвать с собой» on the static site: a behaviour bound to data attributes, so any Astro
 * component can offer it without hydrating an island.
 *
 * - `[data-share-home]` shares the invite with the system sheet (`navigator.share`) **inside the
 *   tap** — iOS Safari refuses a share that is not the direct result of a gesture, so nothing is
 *   awaited before the call. With `data-share-invite` (the templates `inviteShareAttrs` writes at
 *   build time) the text is the Monday message and the link is `/together/` — the same words the
 *   `ShareInvite` card sends, composed by the same `composeInvite`, with the sender's cached code
 *   and name when this browser has them (`forma.myRef`, `mine.ts`). A missing or malformed
 *   `data-share-invite` shares nothing and takes the fallback below.
 *
 *   Where there is no share sheet (most desktops) the button scrolls to the together block
 *   (`data-share-fallback`, default `#together`), whose card has Telegram, WhatsApp and copy.
 *   On a page without one it opens `data-share-path` — the `/together/` page — instead; a link
 *   simply follows its own `href`.
 * - {@link copyText} is the clipboard with a fallback, for the page scripts that copy a line.
 *
 * Buttons bind once per element (`data-bound`), so the script can be included by several
 * components on one page. Paths are built at build time with `withBase(localePath(…))`; only the origin is
 * read in the browser, which keeps a preview deploy's links on the preview.
 */
import type { Locale } from '@/content/schema';
import { myRef } from '@/lib/referral/mine';
import { composeInvite, type ComposeCopy } from '@/lib/share/compose';

const COPY_KEYS = [
  'when',
  'whenTomorrow',
  'whenToday',
  'whenSoon',
  'soonLabel',
  'text',
  'refLine',
] as const satisfies readonly (keyof ComposeCopy)[];

/** The templates from `data-share-invite`, or null when any is missing or not a string. */
export function parseInviteCopy(json: string | undefined): ComposeCopy | null {
  if (!json) return null;
  try {
    const raw = JSON.parse(json) as Record<string, unknown>;
    const out: Partial<Record<keyof ComposeCopy, string>> = {};
    for (const k of COPY_KEYS) {
      const v = raw[k];
      if (typeof v !== 'string') return null;
      out[k] = v;
    }
    return out as ComposeCopy;
  } catch {
    return null;
  }
}

function once(el: HTMLElement): boolean {
  if (el.dataset.bound === 'true') return false;
  el.dataset.bound = 'true';
  return true;
}

function scrollToTarget(target: HTMLElement): void {
  const still = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
  target.scrollIntoView({ behavior: still ? 'auto' : 'smooth', block: 'start' });
}

export function bindShareHome(root: ParentNode = document): void {
  root.querySelectorAll<HTMLElement>('[data-share-home]').forEach((el) => {
    if (!once(el)) return;
    el.addEventListener('click', (event) => {
      const path = el.dataset.sharePath ?? '/';
      // Without valid templates there is nothing to share: fall through to the card or the page.
      const copy = parseInviteCopy(el.dataset.shareInvite);
      if (copy && typeof navigator.share === 'function') {
        event.preventDefault();
        const locale: Locale = el.dataset.shareLocale === 'en' ? 'en' : 'ru';
        const text = composeInvite({
          locale,
          copy,
          origin: location.origin,
          now: new Date(),
          mine: myRef(),
        }).text;
        // Called synchronously in the tap; a dismissed sheet rejects with AbortError — not an error.
        navigator.share({ title: el.dataset.shareTitle, text }).catch(() => undefined);
        return;
      }
      const target = document.querySelector<HTMLElement>(el.dataset.shareFallback ?? '#together');
      if (target) {
        event.preventDefault();
        scrollToTarget(target);
        return;
      }
      // No together block on this page: a link follows its href, a button opens the invite page.
      if (!(el instanceof HTMLAnchorElement)) location.assign(path);
    });
  });
}

/** Copy text to the clipboard, with the legacy command for older WebViews. */
export async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    // Older WebViews: a selected textarea and the legacy command.
    const area = document.createElement('textarea');
    area.value = text;
    area.setAttribute('readonly', '');
    area.style.position = 'fixed';
    area.style.opacity = '0';
    document.body.append(area);
    area.select();
    const ok = document.execCommand('copy');
    area.remove();
    return ok;
  }
}
