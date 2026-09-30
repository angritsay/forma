/**
 * The session store when the network or an account change gets in the way: an offline boot is
 * its own state (never «signed out»), purchases that could not be read are «unknown» (never «owns
 * nothing», so no paywall), and a workout on the device belongs to the account that started it.
 */
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { t } from '@/i18n/index';
import { AppError } from '@/lib/api/errors';
import type * as AuthApi from '@/lib/api/auth';

const getSession = vi.fn();
const signOut = vi.fn();
const listEntitlements = vi.fn();
const getMySubscription = vi.fn();
const getProfile = vi.fn();
vi.mock('@/lib/api/auth', async (orig) => ({
  ...(await orig<typeof AuthApi>()),
  getSession: () => getSession(),
  signOut: () => signOut(),
  onAuthChange: () => () => {},
}));
vi.mock('@/lib/api/profiles', () => ({
  getProfile: () => getProfile(),
  updateProfile: vi.fn(),
}));
vi.mock('@/lib/api/entitlements', () => ({ listEntitlements: () => listEntitlements() }));
vi.mock('@/lib/api/subscriptions', () => ({ getMySubscription: () => getMySubscription() }));
vi.mock('@/lib/api/flags', () => ({ listMyFlags: () => Promise.resolve([]) }));

const kept = new Map<string, string>();
vi.stubGlobal('localStorage', {
  getItem: (k: string) => kept.get(k) ?? null,
  setItem: (k: string, v: string) => void kept.set(k, v),
  removeItem: (k: string) => void kept.delete(k),
});

const { useSession, purchasesUnknown } = await import('./session');
const { useActiveWorkoutStore } = await import('./activeWorkout');
const { localWorkoutRoute, OfflineScreen } = await import('@/app/components/RouteGuards');
const { PurchasesUnknownView } = await import('@/app/components/PurchasesUnknown');

const session = (id: string) => ({ user: { id, email: `${id}@example.com` } });
const profile = { locale: 'ru', onboardedAt: '2026-09-01T00:00:00Z' };
const workout = (userId: string) => ({
  sessionId: 's1',
  courseId: 'custom',
  nodeId: 'cw',
  workoutId: 'cw',
  prescribed: { blocks: [] } as never,
  startedAt: '2026-09-30T10:00:00Z',
  userId,
});

beforeEach(() => {
  for (const f of [getSession, signOut, listEntitlements, getMySubscription, getProfile]) {
    f.mockReset();
  }
  getProfile.mockResolvedValue(profile);
  listEntitlements.mockResolvedValue([]);
  getMySubscription.mockResolvedValue(null);
  signOut.mockResolvedValue(undefined);
  useActiveWorkoutStore.setState({ session: null });
});

describe('offline boot', () => {
  it('is its own state, not signed out', async () => {
    getSession.mockRejectedValue(new AppError('network', 'Failed to fetch'));
    await useSession.getState().boot();
    expect(useSession.getState().status).toBe('offline');
  });

  it('still opens the player and the summary of a workout on the device', () => {
    const s = workout('u1');
    expect(localWorkoutRoute('/play', s)).toBe(true);
    expect(localWorkoutRoute('/summary/s1', s)).toBe(true);
    expect(localWorkoutRoute('/summary/other', s)).toBe(false);
    expect(localWorkoutRoute('/courses/start', s)).toBe(false);
    expect(localWorkoutRoute('/play', null)).toBe(false);
  });

  it('says «Нет соединения» with a retry rather than showing the sign-in form', () => {
    const html = renderToStaticMarkup(createElement(OfflineScreen, { onRetry: () => {} }));
    expect(html).toContain(t('ru', 'app.offlineTitle'));
    expect(html).toContain(t('ru', 'common.retry'));
    expect(html).not.toContain(t('ru', 'app.authSendCode'));
  });
});

describe('purchases unknown', () => {
  it('a failed entitlements read is unknown, and the paywall gives way to a retry', async () => {
    getSession.mockResolvedValue(session('u2'));
    listEntitlements.mockRejectedValue(new AppError('network', 'offline'));
    await useSession.getState().boot();
    expect(useSession.getState().status).toBe('signed_in');
    expect(purchasesUnknown()).toBe(true);
    const html = renderToStaticMarkup(
      createElement(PurchasesUnknownView, { offline: false, busy: false, onRetry: () => {} }),
    );
    expect(html).toContain(t('ru', 'app.purchasesUnknownTitle'));
    expect(html).not.toContain(t('ru', 'app.unlockTitle'));
  });

  it('a read that succeeded is known, even when it is empty', async () => {
    getSession.mockResolvedValue(session('u3'));
    await useSession.getState().boot();
    expect(purchasesUnknown()).toBe(false);
  });
});

describe('the workout on the device', () => {
  it('is dropped when another account signs in', async () => {
    useActiveWorkoutStore.setState({ session: workout('someone-else') });
    getSession.mockResolvedValue(session('u4'));
    await useSession.getState().boot();
    expect(useActiveWorkoutStore.getState().session).toBeNull();
  });

  it('stays for the account that started it', async () => {
    useActiveWorkoutStore.setState({ session: workout('u5') });
    getSession.mockResolvedValue(session('u5'));
    await useSession.getState().boot();
    expect(useActiveWorkoutStore.getState().session?.sessionId).toBe('s1');
  });

  it('goes with a sign-out asked for', async () => {
    useActiveWorkoutStore.setState({ session: workout('u5') });
    await useSession.getState().signOut();
    expect(useActiveWorkoutStore.getState().session).toBeNull();
    expect(useSession.getState().sessionEnded).toBe(false);
  });
});
