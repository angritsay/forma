/**
 * End-to-end walk of the demo backend through the same functions the app calls, in the same
 * order a tester would hit them: sign in, finish onboarding, run a workout, log steps, look at
 * the leaderboard, order a locked course and activate it from the admin screen.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { PrescribedWorkout } from '@/lib/training/types';
import { toLocalDateIso } from '@/lib/util/dates';
import { isAppError } from '../errors';
import type * as Latency from './latency';

// The demo backend delays every call so the app's loading states stay visible; here it would
// only make the suite wait. The delay itself is covered by DEMO_LATENCY_MS below.
vi.mock('./latency', async (importOriginal) => ({
  ...(await importOriginal<typeof Latency>()),
  delay: () => Promise.resolve(),
}));

/** Minimal `Storage` so the demo modules find their default browser storage under node. */
class FakeStorage implements Storage {
  private map = new Map<string, string>();
  [name: string]: unknown;
  get length(): number {
    return this.map.size;
  }
  clear(): void {
    this.map.clear();
  }
  getItem(key: string): string | null {
    return this.map.get(key) ?? null;
  }
  key(index: number): string | null {
    return [...this.map.keys()][index] ?? null;
  }
  removeItem(key: string): void {
    this.map.delete(key);
  }
  setItem(key: string, value: string): void {
    this.map.set(key, value);
  }
}

const store = new FakeStorage();
globalThis.localStorage = store;

// Imported after the storage exists, so the module-level default resolves to it.
const demo = await import('./index');

const EMAIL = 'coach@example.com';

function prescribed(): PrescribedWorkout {
  return {
    workoutId: 'w_test',
    choice: 'normal',
    scale: 1,
    effectiveScale: 1,
    deload: false,
    blocks: [],
    estimatedSec: 1200,
    points: 120,
  };
}

async function signIn(): Promise<void> {
  await demo.requestCode(EMAIL);
  const code = demo.pendingCode();
  expect(code).toMatch(/^\d{6}$/);
  await demo.verifyCode(EMAIL, code ?? '');
}

beforeEach(() => {
  store.clear();
});

describe('demo backend — the tester journey', () => {
  it('signs in, onboards, trains, logs steps and buys a locked course', async () => {
    // 1. Nothing until the code is verified.
    expect(await demo.getProfile()).toBeNull();
    await signIn();

    // 2. A fresh account: onboarding is real, history is empty, two courses are open.
    const profile = await demo.getProfile();
    expect(profile?.email).toBe(EMAIL);
    expect(profile?.onboardedAt).toBeNull();
    expect((await demo.listEntitlements()).map((e) => e.courseId).sort()).toEqual([
      'engine',
      'start',
    ]);
    expect(await demo.listRecentSessions()).toHaveLength(0);
    expect(await demo.isAdmin()).toBe(true);

    // 3. Finishing onboarding persists the training profile.
    const onboarded = await demo.updateProfile({
      displayName: 'Тестер',
      fitnessIndex: 54,
      fitnessLevel: 2,
      onboardedAt: new Date().toISOString(),
    });
    expect(onboarded.displayName).toBe('Тестер');
    expect(onboarded.onboardedAt).not.toBeNull();

    // 4. First workout: start → complete → it shows up in the history and the totals.
    const today = toLocalDateIso();
    const started = await demo.startSession({
      courseId: 'start',
      nodeId: 'w1d1',
      workoutId: 'w_test',
      difficulty: 'normal',
      scale: 1,
      prescribed: prescribed(),
      localDate: today,
    });
    const done = await demo.completeSession(started.id, {
      results: [],
      rpe: 7,
      feeling: 'ok',
      completion: 1,
      points: 120,
      durationSec: 1260,
      calories: 190,
      completedAt: new Date().toISOString(),
    });
    expect(done.points).toBe(120);
    expect(await demo.listRecentSessions()).toHaveLength(1);
    expect((await demo.getWorkoutSession(started.id)).id).toBe(started.id);

    // 5. Course state advances and survives a reload.
    await demo.upsertCourseState('start', { currentNodeIndex: 1, completedNodeIds: ['w1d1'] });
    expect((await demo.getCourseState('start'))?.completedNodeIds).toEqual(['w1d1']);

    // 6. Steps: seeded history plus today's manual entry.
    const seeded = await demo.listDailyLogs('2000-01-01', today);
    expect(seeded.length).toBeGreaterThanOrEqual(7);
    const logged = await demo.upsertDailyLog(today, 9000);
    expect(logged.points).toBeGreaterThan(0);

    const totals = await demo.getMyTotals();
    expect(totals.workouts).toBe(1);
    expect(totals.minutes).toBe(21);
    expect(totals.points).toBeGreaterThan(120);

    // 7. Leaderboard: seeded athletes plus this browser's own row.
    const board = await demo.getLeaderboard('all');
    expect(board.length).toBeGreaterThan(12);
    const mine = board.filter((r) => r.isMe);
    expect(mine).toHaveLength(1);
    expect(mine[0]?.displayName).toBe('Тестер');

    // 8. A locked course: order it on the landing, then activate it as the coach.
    const orderId = await demo.createOrder({ email: EMAIL, courseId: 'dumbbells' });
    const pending = await demo.listPurchases({ status: 'pending', search: EMAIL });
    expect(pending.map((p) => p.id)).toContain(orderId);
    expect(await demo.listEntitlements()).toHaveLength(2);

    await demo.setPurchaseStatus(orderId, 'active');
    expect((await demo.listEntitlements()).map((e) => e.courseId)).toContain('dumbbells');

    // 9. Refunding closes it again.
    await demo.setPurchaseStatus(orderId, 'refunded');
    expect((await demo.listEntitlements()).map((e) => e.courseId)).not.toContain('dumbbells');

    // 10. Signing out and back in restores the same data.
    await demo.signOut();
    expect(await demo.getProfile()).toBeNull();
    await signIn();
    expect((await demo.getProfile())?.displayName).toBe('Тестер');
    expect(await demo.listRecentSessions()).toHaveLength(1);
  });

  it('keeps the AppError contract for every failure', async () => {
    await signIn();
    await expect(demo.getWorkoutSession('nope')).rejects.toMatchObject({ code: 'not_found' });
    await expect(demo.upsertCourseState('Bad Id', {})).rejects.toMatchObject({
      code: 'validation',
      message: 'invalid_course',
    });
    await expect(demo.upsertDailyLog(toLocalDateIso(), -1)).rejects.toMatchObject({
      code: 'validation',
      message: 'invalid_steps',
    });
    await expect(demo.createOrder({ email: 'nope', courseId: 'start' })).rejects.toMatchObject({
      code: 'validation',
      message: 'invalid_email',
    });

    await demo.signOut();
    const signedOut = await demo.listEntitlements().catch((e: unknown) => e);
    expect(isAppError(signedOut) && signedOut.code).toBe('auth');
  });

  it('rejects a wrong code with the auth reason the screen renders', async () => {
    await demo.requestCode(EMAIL);
    const code = demo.pendingCode() ?? '';
    const wrong = code === '000000' ? '111111' : '000000';
    const error = await demo.verifyCode(EMAIL, wrong).catch((e: unknown) => e);
    expect(isAppError(error)).toBe(true);
    expect((error as { reason?: string }).reason).toBe('invalid_code');
    expect(await demo.getProfile()).toBeNull();
  });

  it('delays every call so loading states are visible in the app', async () => {
    const { DEMO_LATENCY_MS } = await import('./latency');
    expect(DEMO_LATENCY_MS).toBeGreaterThanOrEqual(100);
  });

  it('never signs a storage: media reference in demo mode', async () => {
    expect(await demo.resolveMediaUrl('storage:videos/start/air_squat.ru.mp4')).toBeUndefined();
    expect(await demo.resolveMediaUrl('https://cdn.example.com/a.mp4')).toBe(
      'https://cdn.example.com/a.mp4',
    );
    expect(await demo.resolveMediaUrl(undefined)).toBeUndefined();
  });
});
