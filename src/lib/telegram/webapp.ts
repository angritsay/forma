/**
 * Telegram Mini App integration, kept behind one module.
 *
 * Everything here answers "am I running inside Telegram?" with a null and does nothing when the
 * answer is no, so the same build serves the website and the Mini App. Nothing in the app is
 * allowed to depend on Telegram being present.
 *
 * The SDK is loaded by a small inline script in src/pages/app/index.astro, and only inside
 * Telegram: it is a third-party request, and a plain web visitor has no reason to make it. That
 * script must run before the React island, because Telegram passes the launch data in the URL
 * hash — the same hash HashRouter immediately rewrites. `waitForTelegram()` is the other half of
 * that contract: the app holds its first render until the SDK has read the hash.
 */

/** The slice of the Telegram WebApp API this app uses. Hand-written: the SDK ships no types. */
export interface TelegramWebApp {
  readonly version: string;
  /**
   * Подписанная строка запуска, как её выдал телеграм.
   *
   * Наружу уходит только целиком и только в `link-telegram`, которая проверяет подпись токеном
   * бота. Разбирать её здесь и брать оттуда id нельзя: разобранная копия лежит рядом под именем
   * `initDataUnsafe`, и `unsafe` там не для красоты — подделать её в отладчике умеет кто угодно.
   */
  readonly initData: string;
  /**
   * The parsed launch data. Unsigned — never trusted for identity; read only for harmless launch
   * hints such as `start_param` (the `?startapp=` value of a `t.me/<bot>/<app>` link).
   */
  readonly initDataUnsafe?: { start_param?: string };
  readonly platform: string;
  readonly colorScheme: 'light' | 'dark';
  readonly viewportStableHeight?: number;
  readonly safeAreaInset?: { top: number; bottom: number; left: number; right: number };
  readonly contentSafeAreaInset?: { top: number; bottom: number; left: number; right: number };
  readonly BackButton: {
    isVisible: boolean;
    show(): void;
    hide(): void;
    onClick(cb: () => void): void;
    offClick(cb: () => void): void;
  };
  readonly HapticFeedback?: {
    impactOccurred(style: 'light' | 'medium' | 'heavy' | 'rigid' | 'soft'): void;
    notificationOccurred(type: 'error' | 'success' | 'warning'): void;
    selectionChanged(): void;
  };
  /**
   * Per-user storage held by Telegram's servers rather than by the webview (Bot API 6.9+).
   *
   * It is the only thing in a Mini App that reliably survives the app being closed: the webview's
   * own localStorage is cleared whenever the client decides to, which on iOS is often every
   * launch — and that is what was making the app ask for an email code every single time.
   * See src/lib/auth/sessionStorage.ts.
   *
   * Limits: 1024 keys; a key up to 128 characters; a value up to 4096.
   */
  readonly CloudStorage?: {
    setItem(key: string, value: string, cb?: (err: string | null, ok?: boolean) => void): void;
    getItem(key: string, cb: (err: string | null, value?: string) => void): void;
    removeItem(key: string, cb?: (err: string | null, ok?: boolean) => void): void;
    getKeys(cb: (err: string | null, keys?: string[]) => void): void;
  };
  ready(): void;
  expand(): void;
  close(): void;
  openLink(url: string, options?: { try_instant_view?: boolean }): void;
  openTelegramLink(url: string): void;
  setHeaderColor(color: string): void;
  setBackgroundColor(color: string): void;
  enableClosingConfirmation(): void;
  disableClosingConfirmation(): void;
  disableVerticalSwipes?(): void;
  enableVerticalSwipes?(): void;
  onEvent(event: string, cb: () => void): void;
  offEvent(event: string, cb: () => void): void;
  /** Bot API 6.0+; older clients lack it, so `versionAtLeast` falls back to `version`. */
  isVersionAtLeast?(version: string): boolean;
  /**
   * Open the native story editor with a picture (Bot API 7.8). `mediaUrl` must be a public HTTPS
   * address Telegram's servers can fetch — a blob or data URL is refused.
   */
  shareToStory?(mediaUrl: string, params?: StoryShareParams): void;
  /**
   * Ask the person to save a file to the device (Bot API 8.0). The callback says whether they
   * accepted the download prompt, not whether it finished.
   */
  downloadFile?(params: { url: string; file_name: string }, cb?: (accepted: boolean) => void): void;
}

/** The second argument of `shareToStory`. The text is capped at 200 characters (2048 premium). */
export interface StoryShareParams {
  text?: string;
  /** A link under the story; Telegram shows it for premium accounts only. */
  widget_link?: { url: string; name?: string };
}

declare global {
  interface Window {
    Telegram?: { WebApp?: TelegramWebApp };
    /** Set by the inline bootstrap when the page was opened from Telegram. */
    __formaTelegram?: boolean;
  }
}

/**
 * Forma's app background — `--bg` in global.css, `APP_BG` in src/lib/ui/tile.ts; Telegram paints
 * its own chrome around the page in this colour. Graphite #121212 (design/CHANGELOG.md §16);
 * `src/lib/ui/ground-literals.test.ts` keeps the old charcoal from creeping back here.
 */
const HEADER_COLOR = '#121212';

let cached: TelegramWebApp | null | undefined;
/** `initTelegram` is called from an effect that can run twice; the handover happens once. */
let initialised = false;

/** The WebApp object, or null outside Telegram. Cheap and safe to call from render. */
export function telegram(): TelegramWebApp | null {
  if (cached !== undefined) return cached;
  if (typeof window === 'undefined') return null;
  const api = window.Telegram?.WebApp;
  // The SDK defines Telegram.WebApp on every page it is loaded on; `initData` being empty is what
  // distinguishes "loaded but not launched from Telegram". `platform` is 'unknown' there.
  cached = api && api.platform && api.platform !== 'unknown' ? api : null;
  return cached;
}

export function isTelegram(): boolean {
  return telegram() !== null;
}

/**
 * Resolve once the SDK has loaded (it reads the launch hash as it runs), or immediately when the
 * page was not opened from Telegram. Bounded, because a blocked third-party script must not keep
 * the app from starting.
 */
export function waitForTelegram(timeoutMs = 3000): Promise<TelegramWebApp | null> {
  if (typeof window === 'undefined' || !window.__formaTelegram) return Promise.resolve(null);
  if (window.Telegram?.WebApp) return Promise.resolve(telegram());
  return new Promise((resolve) => {
    const started = Date.now();
    const tick = () => {
      if (window.Telegram?.WebApp || Date.now() - started > timeoutMs) {
        cached = undefined; // re-read now that the SDK may have defined itself
        resolve(telegram());
        return;
      }
      setTimeout(tick, 40);
    };
    tick();
  });
}

/**
 * Hand the app over to Telegram: full height, our own colours, and no swipe-to-close — a downward
 * swipe during a workout would otherwise close the app mid-set.
 */
export function initTelegram(api: TelegramWebApp | null = telegram()): void {
  if (!api || initialised) return;
  initialised = true;
  try {
    api.ready();
    api.expand();
    api.setHeaderColor(HEADER_COLOR);
    api.setBackgroundColor(HEADER_COLOR);
    api.disableVerticalSwipes?.();
    applyInsets(api);
    const onViewport = () => applyInsets(api);
    api.onEvent('viewportChanged', onViewport);
    api.onEvent('safeAreaChanged', onViewport);
    api.onEvent('contentSafeAreaChanged', onViewport);
  } catch {
    /* An older client without one of these methods must not break the app. */
  }
}

/**
 * Telegram's chrome sits above the page, and `env(safe-area-inset-*)` inside the webview does not
 * know about it. The layout reads the same variable names, so publishing Telegram's insets as
 * `--tg-safe-*` and letting the CSS prefer them keeps one layout for both worlds.
 */
function applyInsets(api: TelegramWebApp): void {
  const root = document.documentElement;
  const safe = api.safeAreaInset;
  const content = api.contentSafeAreaInset;
  const top = (safe?.top ?? 0) + (content?.top ?? 0);
  const bottom = (safe?.bottom ?? 0) + (content?.bottom ?? 0);
  root.style.setProperty('--tg-safe-top', `${top}px`);
  root.style.setProperty('--tg-safe-bottom', `${bottom}px`);
  root.style.setProperty('--tg-safe-left', `${safe?.left ?? 0}px`);
  root.style.setProperty('--tg-safe-right', `${safe?.right ?? 0}px`);
}

/** Show Telegram's own back button and call `onBack` when it is pressed. Returns a cleanup. */
export function showBackButton(onBack: () => void): () => void {
  const api = telegram();
  if (!api) return () => {};
  api.BackButton.onClick(onBack);
  api.BackButton.show();
  return () => {
    api.BackButton.offClick(onBack);
    api.BackButton.hide();
  };
}

export function hideBackButton(): void {
  telegram()?.BackButton.hide();
}

export type Haptic = 'light' | 'medium' | 'heavy' | 'success' | 'warning' | 'error';

/** A short vibration through Telegram's own haptics; silent everywhere else. */
export function haptic(kind: Haptic): void {
  const hf = telegram()?.HapticFeedback;
  if (!hf) return;
  try {
    if (kind === 'success' || kind === 'warning' || kind === 'error') hf.notificationOccurred(kind);
    else hf.impactOccurred(kind);
  } catch {
    /* Haptics are a nicety; never let them surface as an error. */
  }
}

/** Ask before closing (an unfinished workout would be lost); no-op outside Telegram. */
export function setClosingConfirmation(on: boolean): void {
  const api = telegram();
  if (!api) return;
  try {
    if (on) api.enableClosingConfirmation();
    else api.disableClosingConfirmation();
  } catch {
    /* older client */
  }
}

/**
 * `a >= b` for dotted version strings ("7.10" is newer than "7.8"). Missing parts count as 0 and
 * anything unparseable as 0, so a garbled version reads as old rather than new.
 */
export function compareVersions(a: string, b: string): number {
  const pa = a.split('.').map((n) => Number.parseInt(n, 10) || 0);
  const pb = b.split('.').map((n) => Number.parseInt(n, 10) || 0);
  for (let i = 0; i < Math.max(pa.length, pb.length); i += 1) {
    const d = (pa[i] ?? 0) - (pb[i] ?? 0);
    if (d !== 0) return d > 0 ? 1 : -1;
  }
  return 0;
}

/** Whether the client speaks at least this Bot API version. False outside Telegram. */
export function versionAtLeast(version: string, api: TelegramWebApp | null = telegram()): boolean {
  if (!api) return false;
  try {
    if (typeof api.isVersionAtLeast === 'function') return api.isVersionAtLeast(version);
  } catch {
    /* fall through to the string */
  }
  return typeof api.version === 'string' && compareVersions(api.version, version) >= 0;
}

/** Story sharing needs Bot API 7.8 and the method itself. */
export function canShareToStory(api: TelegramWebApp | null = telegram()): boolean {
  return versionAtLeast('7.8', api) && typeof api?.shareToStory === 'function';
}

/** Saving a file to the phone needs Bot API 8.0 and the method itself. */
export function canDownloadFile(api: TelegramWebApp | null = telegram()): boolean {
  return versionAtLeast('8.0', api) && typeof api?.downloadFile === 'function';
}

/** Open Telegram's story editor with a public image; false when the client cannot. */
export function shareToStory(mediaUrl: string, params?: StoryShareParams): boolean {
  const api = telegram();
  if (!api || !canShareToStory(api)) return false;
  try {
    api.shareToStory?.(mediaUrl, params);
    return true;
  } catch {
    return false;
  }
}

/**
 * Ask Telegram to save a file from a public URL. Resolves true when the person accepted the
 * prompt, false when they declined or the client cannot download at all.
 */
export function downloadFile(url: string, fileName: string): Promise<boolean> {
  const api = telegram();
  if (!api || !canDownloadFile(api)) return Promise.resolve(false);
  return new Promise((resolve) => {
    try {
      api.downloadFile?.({ url, file_name: fileName }, (accepted) => resolve(accepted === true));
    } catch {
      resolve(false);
    }
  });
}

/**
 * Open a link outside the Mini App. Payment pages must not run inside Telegram's webview: the
 * customer needs their bank's app and their browser's saved cards, and a redirect back into a
 * Mini App is not something a payment provider can do.
 */
export function openExternal(url: string): boolean {
  const api = telegram();
  if (!api) return false;
  try {
    // A t.me address is a conversation, not a web page: Telegram should handle it itself.
    if (/^https?:\/\/(t\.me|telegram\.me)\//i.test(url)) api.openTelegramLink(url);
    else api.openLink(url, { try_instant_view: false });
    return true;
  } catch {
    return false;
  }
}

/**
 * Leave for an external page: the person's own browser inside Telegram, a plain navigation
 * everywhere else (or when the client refuses to open the link).
 */
export function goExternal(url: string): void {
  if (openExternal(url)) return;
  window.location.assign(url);
}

/**
 * The `startapp` value the Mini App was launched with (`t.me/<bot>/<app>?startapp=<value>`), or
 * null outside Telegram or when there is none.
 */
export function startParam(): string | null {
  const value = telegram()?.initDataUnsafe?.start_param;
  return typeof value === 'string' && value ? value : null;
}

/**
 * Absolute form of a link, so `openExternal` gets something Telegram can open. Returns null for
 * anything that is not a web address (a `mailto:` is left to the platform) and for in-app hash
 * routes, which must never leave the Mini App.
 */
export function externalTarget(href: string): string | null {
  if (!href || href.startsWith('#') || href.startsWith('mailto:') || href.startsWith('tel:')) {
    return null;
  }
  try {
    const url = new URL(href, window.location.href);
    if (url.protocol !== 'http:' && url.protocol !== 'https:') return null;
    // Same page, different hash — that is our own router.
    const here = new URL(window.location.href);
    if (url.origin === here.origin && url.pathname === here.pathname) return null;
    return url.href;
  } catch {
    return null;
  }
}
