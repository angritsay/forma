import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import { t } from '@/i18n/index';
import { ErrorFallback } from './ErrorBoundary';
import { isOfflineChunkError, isStaleChunkError, reloadOnceForStaleChunk } from './staleChunk';

function memoryStorage() {
  const m = new Map<string, string>();
  return {
    getItem: (k: string) => m.get(k) ?? null,
    setItem: (k: string, v: string) => void m.set(k, v),
  };
}

/* The four browsers say it four ways, and the app sees whichever one the customer's phone uses. */
describe('isStaleChunkError', () => {
  it('recognises every wording of a chunk that would not load', () => {
    for (const message of [
      'Importing a module script failed.',
      'Failed to fetch dynamically imported module: https://forma-app.co/app/_astro/Home.x1.js',
      'error loading dynamically imported module',
      "Refused to execute script: 'text/html' is not a valid JavaScript MIME type.",
      "Unexpected token '<'",
    ]) {
      expect(isStaleChunkError(new Error(message))).toBe(true);
    }
  });

  it('leaves every other error alone', () => {
    for (const message of [
      "Cannot read properties of undefined (reading 'map')",
      'Network request failed',
      'PGRST202',
      '',
    ]) {
      expect(isStaleChunkError(new Error(message))).toBe(false);
    }
    expect(isStaleChunkError(null)).toBe(false);
    expect(isStaleChunkError('just a string')).toBe(false);
  });
});

describe('reloadOnceForStaleChunk', () => {
  const stale = new Error('Importing a module script failed.');

  it('reloads on the first stale chunk and never again in the same session', () => {
    const storage = memoryStorage();
    const reload = vi.fn();
    expect(reloadOnceForStaleChunk(stale, { storage, reload })).toBe(true);
    expect(reload).toHaveBeenCalledTimes(1);
    // Second failure in the same session: the budget is spent, so the fallback gets to show.
    expect(reloadOnceForStaleChunk(stale, { storage, reload })).toBe(false);
    expect(reload).toHaveBeenCalledTimes(1);
  });

  it('does not reload for an ordinary error', () => {
    const reload = vi.fn();
    const error = new Error("Cannot read properties of undefined (reading 'map')");
    expect(reloadOnceForStaleChunk(error, { storage: memoryStorage(), reload })).toBe(false);
    expect(reload).not.toHaveBeenCalled();
  });

  /*
   * The one case that could loop forever. With nowhere to record that the reload happened, every
   * load would fail, reload, fail, reload — a screen that never settles and never shows the
   * message explaining why. So it does nothing and leaves the button to the person.
   */
  it('refuses to reload when there is nowhere to record that it did', () => {
    const reload = vi.fn();
    expect(reloadOnceForStaleChunk(stale, { storage: null, reload })).toBe(false);
    expect(reload).not.toHaveBeenCalled();

    const throwing = {
      getItem: () => null,
      setItem: () => {
        throw new Error('QuotaExceededError');
      },
    };
    expect(reloadOnceForStaleChunk(stale, { storage: throwing, reload })).toBe(false);
    expect(reload).not.toHaveBeenCalled();
  });
});

/*
 * A chunk that fails offline is a connection, not a deploy: reloading would swap the app for the
 * browser's own «no internet» page and spend the session's one reload for nothing.
 */
describe('offline', () => {
  const stale = new Error('Failed to fetch dynamically imported module: /app/_astro/Summary.js');

  it('does not reload while the device is offline, and keeps the budget', () => {
    const storage = memoryStorage();
    const reload = vi.fn();
    expect(reloadOnceForStaleChunk(stale, { storage, reload, online: () => false })).toBe(false);
    expect(reload).not.toHaveBeenCalled();
    // Back online, it is a stale chunk again and the one reload is still there.
    expect(reloadOnceForStaleChunk(stale, { storage, reload, online: () => true })).toBe(true);
  });

  it('says «Нет соединения» with a retry instead of the crash screen', () => {
    expect(isOfflineChunkError(stale, false)).toBe(true);
    expect(isOfflineChunkError(stale, true)).toBe(false);
    expect(isOfflineChunkError(new Error('boom'), false)).toBe(false);
    const html = renderToStaticMarkup(
      createElement(ErrorFallback, { error: stale, onRetry: () => {}, online: false }),
    );
    expect(html).toContain(t('ru', 'app.errorChunkOffline'));
    expect(html).toContain(t('ru', 'common.retry'));
    expect(html).not.toContain(t('ru', 'app.errorReload'));
  });
});
