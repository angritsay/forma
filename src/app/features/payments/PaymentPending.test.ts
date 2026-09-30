/**
 * «Проверяем оплату» after the till, for a course or the club: it must keep asking for access
 * while the webhook catches up — never offer the till again in that time, which is how people paid
 * twice — stop by itself, and then offer the claim by order number and a message to us.
 */
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { t } from '@/i18n/index';
import { isClaimResult } from '@/lib/api/claims';
import { PaymentPendingView } from './PaymentPending';
import {
  clearPendingMarker,
  createPendingWatch,
  PENDING_MARKER_TTL_MS,
  PENDING_POLL_MS,
  PENDING_WINDOW_MS,
  readPendingMarker,
  writePendingMarker,
  type PendingPhase,
} from './pending';

const render = (phase: 'checking' | 'unconfirmed') =>
  renderToStaticMarkup(
    createElement(PaymentPendingView, {
      phase,
      onNotPaid: () => {},
      onCheckAgain: () => {},
      onClaim: () => {},
      onContact: () => {},
    }),
  );

describe('PaymentPendingView', () => {
  it('says the payment is being checked, and offers nothing to pay', () => {
    const html = render('checking');
    expect(html).toContain('role="status"');
    expect(html).toContain('aria-busy="true"');
    expect(html).toContain(t('ru', 'app.payPendingTitle'));
    expect(html).toContain(t('ru', 'app.payPendingNotPaid'));
    expect(html).not.toContain(t('ru', 'app.unlockCta'));
    // While it waits the access may appear any second: no claim, no message yet.
    expect(html).not.toContain(t('ru', 'app.claimLink'));
    expect(html).not.toContain(t('ru', 'app.contactUs'));
  });

  it('stops waiting and offers the claim, a message to us and another check', () => {
    const html = render('unconfirmed');
    expect(html).not.toContain('aria-busy');
    expect(html).toContain(t('ru', 'app.payPendingLongTitle'));
    expect(html).toContain(t('ru', 'app.claimLink'));
    expect(html).toContain(t('ru', 'app.contactUs'));
    expect(html).toContain(t('ru', 'app.payPendingCheckAgain'));
    expect(render('unconfirmed')).toContain(t('ru', 'app.payPendingNotPaid'));
  });
});

describe('createPendingWatch', () => {
  let clock = 0;
  beforeEach(() => {
    vi.useFakeTimers();
    clock = 0;
  });
  afterEach(() => vi.useRealTimers());

  const setup = (refresh: () => Promise<boolean>) => {
    const phases: PendingPhase[] = [];
    const onOwned = vi.fn();
    const watch = createPendingWatch({
      refresh,
      onPhase: (p) => phases.push(p),
      onOwned,
      now: () => clock,
    });
    const advance = async (ms: number) => {
      clock += ms;
      await vi.advanceTimersByTimeAsync(ms);
    };
    return { watch, phases, onOwned, advance };
  };

  it(`asks every ${PENDING_POLL_MS / 1000} s and stops once the access is there`, async () => {
    let owned = false;
    const refresh = vi.fn(async () => owned);
    const { watch, phases, onOwned, advance } = setup(refresh);

    watch.start();
    expect(watch.phase()).toBe('checking');
    await advance(0);
    expect(refresh).toHaveBeenCalledTimes(1);

    await advance(PENDING_POLL_MS);
    await advance(PENDING_POLL_MS);
    expect(refresh).toHaveBeenCalledTimes(3);

    owned = true;
    await advance(PENDING_POLL_MS);
    expect(onOwned).toHaveBeenCalledTimes(1);
    expect(watch.phase()).toBe('idle');
    expect(phases).toEqual(['checking', 'idle']);

    await advance(PENDING_POLL_MS * 3);
    expect(refresh).toHaveBeenCalledTimes(4);
  });

  it('gives up after the window and says so, and a new check starts it again', async () => {
    const refresh = vi.fn(async () => false);
    const { watch, advance } = setup(refresh);
    watch.start();
    await advance(PENDING_WINDOW_MS);
    expect(watch.phase()).toBe('unconfirmed');
    const asked = refresh.mock.calls.length;
    await advance(PENDING_POLL_MS * 4);
    expect(refresh.mock.calls.length).toBe(asked);

    // «Проверить ещё раз», or coming back to the app.
    watch.resume();
    expect(watch.phase()).toBe('checking');
    await advance(0);
    expect(refresh.mock.calls.length).toBe(asked + 1);
  });

  it('keeps asking after a failed request, one request at a time', async () => {
    let calls = 0;
    const pending: ((v: boolean) => void)[] = [];
    const refresh = vi.fn(() => {
      calls += 1;
      if (calls === 1) return Promise.reject(new Error('offline'));
      return new Promise<boolean>((resolve) => pending.push(resolve));
    });
    const { watch, onOwned, advance } = setup(refresh);
    watch.start();
    await advance(PENDING_POLL_MS);
    expect(calls).toBe(2);
    // The second one is still in flight: no pile-up behind a slow network.
    await advance(PENDING_POLL_MS * 2);
    expect(calls).toBe(2);
    pending[0]!(true);
    await advance(0);
    expect(onOwned).toHaveBeenCalledTimes(1);
  });

  it('«Я не платил(а)» stops it, and a late answer does not bring it back', async () => {
    let answer: (v: boolean) => void = () => {};
    const refresh = vi.fn(() => new Promise<boolean>((resolve) => (answer = resolve)));
    const { watch, onOwned, advance } = setup(refresh);
    watch.start();
    watch.stop();
    answer(true);
    await advance(PENDING_POLL_MS);
    expect(watch.phase()).toBe('idle');
    expect(onOwned).not.toHaveBeenCalled();
    // `resume` only restarts a check that is showing.
    watch.resume();
    expect(watch.phase()).toBe('idle');
  });
});

describe('the pending marker', () => {
  const memory = () => {
    const data = new Map<string, string>();
    return {
      getItem: (k: string) => data.get(k) ?? null,
      setItem: (k: string, v: string) => void data.set(k, v),
      removeItem: (k: string) => void data.delete(k),
    };
  };

  it('remembers the till per product, and forgets it after a while', () => {
    const store = memory();
    writePendingMarker('course:start', 1_000, store);
    expect(readPendingMarker('course:start', 2_000, store)).toBe(1_000);
    expect(readPendingMarker('club', 2_000, store)).toBeNull();
    expect(readPendingMarker('course:start', 1_000 + PENDING_MARKER_TTL_MS + 1, store)).toBeNull();
    clearPendingMarker('course:start', store);
    expect(readPendingMarker('course:start', 2_000, store)).toBeNull();
  });

  it('works without storage at all', () => {
    expect(readPendingMarker('club', 0, null)).toBeNull();
    expect(() => writePendingMarker('club', 0, null)).not.toThrow();
  });
});

describe('claim answers', () => {
  it('knows «several open orders» as its own answer (0057)', () => {
    expect(isClaimResult('ambiguous')).toBe(true);
    expect(t('ru', 'app.claimAmbiguous')).not.toBe(t('ru', 'app.claimLinked'));
  });
});
