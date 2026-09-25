import { afterEach, describe, expect, it, vi } from 'vitest';
import { externalTarget, haptic, isTelegram, openExternal, startParam, telegram } from './webapp';

/** A window with a location, the only browser API these helpers touch. */
function fakeWindow(href: string, telegramApi?: unknown): void {
  (globalThis as { window?: unknown }).window = {
    location: { href },
    Telegram: telegramApi ? { WebApp: telegramApi } : undefined,
  };
}

afterEach(() => {
  delete (globalThis as { window?: unknown }).window;
  vi.resetModules();
});

describe('externalTarget', () => {
  it('resolves a link that really leaves the page', () => {
    fakeWindow('https://angritsay.github.io/forma/app/#/book');
    expect(externalTarget('https://pay.example.com/p/1')).toBe('https://pay.example.com/p/1');
    // A relative site link from inside the app is still another page.
    expect(externalTarget('/forma/subscribe/')).toBe(
      'https://angritsay.github.io/forma/subscribe/',
    );
  });

  it('leaves in-app navigation alone', () => {
    fakeWindow('https://angritsay.github.io/forma/app/#/book');
    expect(externalTarget('#/courses')).toBeNull();
    // Same page, different hash: that is the app's own router.
    expect(externalTarget('https://angritsay.github.io/forma/app/#/profile')).toBeNull();
  });

  it('refuses anything that is not a web page', () => {
    fakeWindow('https://angritsay.github.io/forma/app/');
    expect(externalTarget('mailto:hello@example.com')).toBeNull();
    expect(externalTarget('tel:+70000000000')).toBeNull();
    expect(externalTarget('javascript:alert(1)')).toBeNull();
    expect(externalTarget('')).toBeNull();
  });
});

describe('outside Telegram', () => {
  it('reports absence and every call is a no-op', () => {
    fakeWindow('https://angritsay.github.io/forma/app/');
    expect(telegram()).toBeNull();
    expect(isTelegram()).toBe(false);
    expect(openExternal('https://pay.example.com')).toBe(false);
    expect(startParam()).toBeNull();
    expect(() => haptic('success')).not.toThrow();
  });
});

describe('inside Telegram', () => {
  it('sends web pages to the browser and t.me links to Telegram itself', async () => {
    const openLink = vi.fn();
    const openTelegramLink = vi.fn();
    fakeWindow('https://angritsay.github.io/forma/app/', {
      platform: 'ios',
      openLink,
      openTelegramLink,
    });
    // The module caches the lookup, so it has to be imported after the window exists.
    const mod = await import('./webapp');
    expect(mod.isTelegram()).toBe(true);
    expect(mod.openExternal('https://pay.example.com/p/1')).toBe(true);
    expect(openLink).toHaveBeenCalledWith('https://pay.example.com/p/1', {
      try_instant_view: false,
    });
    expect(mod.openExternal('https://t.me/forma_training_bot')).toBe(true);
    expect(openTelegramLink).toHaveBeenCalledWith('https://t.me/forma_training_bot');
  });

  it('goExternal prefers Telegram and falls back to a plain navigation', async () => {
    const openLink = vi.fn();
    fakeWindow('https://angritsay.github.io/forma/app/', { platform: 'ios', openLink });
    const assign = vi.fn();
    (window as unknown as { location: { assign: unknown } }).location.assign = assign;
    const mod = await import('./webapp');
    mod.goExternal('https://pay.example.com/p/1');
    expect(openLink).toHaveBeenCalledTimes(1);
    expect(assign).not.toHaveBeenCalled();

    openLink.mockImplementation(() => {
      throw new Error('unsupported');
    });
    mod.goExternal('https://pay.example.com/p/2');
    expect(assign).toHaveBeenCalledWith('https://pay.example.com/p/2');
  });

  it('reads the startapp parameter', async () => {
    fakeWindow('https://angritsay.github.io/forma/app/', {
      platform: 'android',
      initDataUnsafe: { start_param: 'duo_abc' },
    });
    const mod = await import('./webapp');
    expect(mod.startParam()).toBe('duo_abc');
  });

  it('treats a page loaded outside a Telegram launch as absent', async () => {
    fakeWindow('https://angritsay.github.io/forma/app/', {
      platform: 'unknown',
      openLink: vi.fn(),
    });
    const mod = await import('./webapp');
    expect(mod.isTelegram()).toBe(false);
  });
});

describe('version guards', () => {
  it('compares dotted versions numerically', async () => {
    const { compareVersions } = await import('./webapp');
    expect(compareVersions('7.10', '7.8')).toBe(1);
    expect(compareVersions('8.0', '8')).toBe(0);
    expect(compareVersions('7.7', '7.8')).toBe(-1);
    expect(compareVersions('garbage', '6.0')).toBe(-1);
  });

  it('offers story sharing from 7.8 and downloads from 8.0', async () => {
    const { canDownloadFile, canShareToStory } = await import('./webapp');
    const api = (version: string) =>
      ({
        version,
        platform: 'ios',
        shareToStory: vi.fn(),
        downloadFile: vi.fn(),
      }) as never;
    expect(canShareToStory(api('7.7'))).toBe(false);
    expect(canShareToStory(api('7.8'))).toBe(true);
    expect(canDownloadFile(api('7.10'))).toBe(false);
    expect(canDownloadFile(api('8.0'))).toBe(true);
    expect(canShareToStory(null)).toBe(false);
  });

  it('trusts the client’s own isVersionAtLeast when it has one', async () => {
    const { canShareToStory } = await import('./webapp');
    const api = { version: '6.0', isVersionAtLeast: () => true, shareToStory: vi.fn() } as never;
    expect(canShareToStory(api)).toBe(true);
  });

  it('refuses a method the client does not have, whatever the version says', async () => {
    const { canShareToStory } = await import('./webapp');
    expect(canShareToStory({ version: '9.0' } as never)).toBe(false);
  });

  it('shareToStory and downloadFile call through inside Telegram', async () => {
    const shareToStory = vi.fn();
    const downloadFile = vi.fn((_p: unknown, cb: (ok: boolean) => void) => cb(true));
    fakeWindow('https://angritsay.github.io/forma/app/', {
      platform: 'android',
      version: '8.0',
      shareToStory,
      downloadFile,
    });
    const mod = await import('./webapp');
    expect(mod.shareToStory('https://x/y.png', { text: 'hi' })).toBe(true);
    expect(shareToStory).toHaveBeenCalledWith('https://x/y.png', { text: 'hi' });
    await expect(mod.downloadFile('https://x/y.png', 'y.png')).resolves.toBe(true);
    expect(downloadFile).toHaveBeenCalledWith(
      { url: 'https://x/y.png', file_name: 'y.png' },
      expect.any(Function),
    );
  });
});
