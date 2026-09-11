import { afterEach, describe, expect, it, vi } from 'vitest';
import type { MouseEvent } from 'react';

/*
 * The module is imported inside each test, not at the top: `telegram()` caches the client it found
 * on first call, so a fresh copy per case is what lets one test run inside Telegram and the next
 * one on the open web.
 */

/** Minimal window: a location, and optionally a Telegram client. */
function fakeWindow(href: string, telegramApi?: unknown): void {
  (globalThis as { window?: unknown }).window = {
    location: { href },
    Telegram: telegramApi ? { WebApp: telegramApi } : undefined,
  };
}

function click(): { e: MouseEvent<HTMLAnchorElement>; prevented: () => boolean } {
  let prevented = false;
  return {
    e: { preventDefault: () => (prevented = true) } as unknown as MouseEvent<HTMLAnchorElement>,
    prevented: () => prevented,
  };
}

afterEach(() => {
  delete (globalThis as { window?: unknown }).window;
  vi.resetModules();
});

describe('externalLinkProps', () => {
  it('hands a link out of the Mini App to Telegram and cancels the navigation', async () => {
    const openLink = vi.fn();
    fakeWindow('https://forma-app.co/app/#/', {
      platform: 'ios',
      openLink,
      openTelegramLink: vi.fn(),
    });
    const { externalLinkProps: fresh } = await import('./useExternalLink');
    const { e, prevented } = click();
    fresh('/courses/start-krossfit-doma-bez-oborudovaniya/').onClick(e);
    expect(openLink).toHaveBeenCalledWith(
      'https://forma-app.co/courses/start-krossfit-doma-bez-oborudovaniya/',
      {
        try_instant_view: false,
      },
    );
    // Cancelled, because Telegram is now opening it outside; letting the anchor navigate as well
    // would replace the Mini App with the site.
    expect(prevented()).toBe(true);
  });

  /*
   * The whole point of the guard: outside Telegram the anchor must be left alone. A version of this
   * that cancelled unconditionally would make every outbound link on the website inert.
   */
  it('leaves the anchor alone on the open web', async () => {
    fakeWindow('https://forma-app.co/app/#/');
    const { externalLinkProps: fresh } = await import('./useExternalLink');
    const { e, prevented } = click();
    fresh('/courses/start-krossfit-doma-bez-oborudovaniya/').onClick(e);
    expect(prevented()).toBe(false);
  });

  it('never intercepts the app’s own hash routes', async () => {
    const openLink = vi.fn();
    fakeWindow('https://forma-app.co/app/#/', {
      platform: 'android',
      openLink,
      openTelegramLink: vi.fn(),
    });
    const { externalLinkProps: fresh } = await import('./useExternalLink');
    const { e, prevented } = click();
    fresh('#/courses').onClick(e);
    expect(openLink).not.toHaveBeenCalled();
    expect(prevented()).toBe(false);
  });

  it('still follows the href when an old client cannot open it', async () => {
    fakeWindow('https://forma-app.co/app/#/', {
      platform: 'tdesktop',
      openLink: () => {
        throw new Error('not supported');
      },
      openTelegramLink: vi.fn(),
    });
    const { externalLinkProps: fresh } = await import('./useExternalLink');
    const { e, prevented } = click();
    fresh('/courses/start-krossfit-doma-bez-oborudovaniya/').onClick(e);
    expect(prevented()).toBe(false);
  });

  it('passes a t.me address to Telegram itself', async () => {
    const openTelegramLink = vi.fn();
    fakeWindow('https://forma-app.co/app/#/', {
      platform: 'ios',
      openLink: vi.fn(),
      openTelegramLink,
    });
    const { externalLinkProps: fresh } = await import('./useExternalLink');
    const { e } = click();
    fresh('https://t.me/titosha').onClick(e);
    expect(openTelegramLink).toHaveBeenCalledWith('https://t.me/titosha');
  });
});
