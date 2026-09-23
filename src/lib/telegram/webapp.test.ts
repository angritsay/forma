import { afterEach, describe, expect, it, vi } from 'vitest';
import { externalTarget, haptic, isTelegram, openExternal, telegram } from './webapp';

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

  it('treats a page loaded outside a Telegram launch as absent', async () => {
    fakeWindow('https://angritsay.github.io/forma/app/', {
      platform: 'unknown',
      openLink: vi.fn(),
    });
    const mod = await import('./webapp');
    expect(mod.isTelegram()).toBe(false);
  });
});
