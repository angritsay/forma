/**
 * «Позвать с собой» and «Скопировать ссылку» on the static site: two small behaviours bound to data
 * attributes, so any Astro component can offer them without hydrating an island.
 *
 * - `[data-share-home]` shares the page's link with the system sheet (`navigator.share`) **inside
 *   the tap** — iOS Safari refuses a share that is not the direct result of a gesture, so nothing
 *   is awaited before the call. Where there is no share sheet (most desktops) it scrolls to the
 *   together block instead (`data-share-fallback`, default `#together`), whose own copy button is
 *   the desktop's way to pass a link on. The link is the homepage — or whatever `data-share-path`
 *   names — on the visitor's own origin; the text is `data-share-text`. Nothing about a reward:
 *   the plain link carries none (site synthesis §4).
 * - `[data-copy-link]` copies `data-copy-path` (+ `data-copy-hash`) as an absolute URL and swaps
 *   its label to `data-copied-label` for two seconds, announced through the button's own
 *   `aria-live` region.
 *
 * Both bind once per element (`data-bound`), so the script can be included by several components
 * on one page. Paths are built at build time with `withBase(localePath(…))`; only the origin is
 * read in the browser, which keeps a preview deploy's links on the preview.
 */

/** An absolute link from the visitor's origin and a site path (already base- and locale-prefixed). */
export function absoluteShareUrl(origin: string, path: string, hash = ''): string {
  const o = origin.replace(/\/+$/, '');
  const p = path.startsWith('/') ? path : `/${path}`;
  const h = hash ? (hash.startsWith('#') ? hash : `#${hash}`) : '';
  return `${o}${p}${h}`;
}

function once(el: HTMLElement): boolean {
  if (el.dataset.bound === 'true') return false;
  el.dataset.bound = 'true';
  return true;
}

function scrollToTarget(selector: string): void {
  const target = document.querySelector<HTMLElement>(selector);
  if (!target) {
    location.hash = selector.startsWith('#') ? selector : '';
    return;
  }
  const still = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
  target.scrollIntoView({ behavior: still ? 'auto' : 'smooth', block: 'start' });
}

export function bindShareHome(root: ParentNode = document): void {
  root.querySelectorAll<HTMLElement>('[data-share-home]').forEach((el) => {
    if (!once(el)) return;
    el.addEventListener('click', (event) => {
      const url = absoluteShareUrl(location.origin, el.dataset.sharePath ?? '/');
      const fallback = el.dataset.shareFallback ?? '#together';
      if (typeof navigator.share === 'function') {
        event.preventDefault();
        // Called synchronously in the tap; a dismissed sheet rejects with AbortError — not an error.
        navigator
          .share({ title: el.dataset.shareTitle, text: el.dataset.shareText, url })
          .catch(() => undefined);
        return;
      }
      event.preventDefault();
      scrollToTarget(fallback);
    });
  });
}

async function copyText(text: string): Promise<boolean> {
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

export function bindCopyLink(root: ParentNode = document): void {
  root.querySelectorAll<HTMLElement>('[data-copy-link]').forEach((el) => {
    if (!once(el)) return;
    const label = el.querySelector<HTMLElement>('[data-copy-label]') ?? el;
    const idle = label.textContent ?? '';
    let timer = 0;
    el.addEventListener('click', () => {
      const url = absoluteShareUrl(
        location.origin,
        el.dataset.copyPath ?? '/',
        el.dataset.copyHash ?? '',
      );
      void copyText(url).then((ok) => {
        if (!ok) return;
        label.textContent = el.dataset.copiedLabel ?? idle;
        window.clearTimeout(timer);
        timer = window.setTimeout(() => (label.textContent = idle), 2000);
      });
    });
  });
}
