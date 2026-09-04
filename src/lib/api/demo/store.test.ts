import { describe, expect, it } from 'vitest';
import { stepsPoints } from '@/lib/training/streak';
import { weekStart } from '@/lib/util/dates';
import { isAppError } from '../errors';
import { profileFromDb, toNumberOr, type DbWorkoutSession } from '../mappers';
import {
  clearDemoStore,
  currentDemoUser,
  demoLeaderboard,
  demoTotals,
  DEMO_ENTITLED_COURSES,
  DEMO_SCHEMA_VERSION,
  emptyDb,
  ensureUser,
  findProfileByEmail,
  memoryStorage,
  mutateDb,
  pendingDemoCode,
  readAuth,
  readDb,
  requestDemoCode,
  seedUser,
  signOutDemo,
  verifyDemoCode,
  writeDb,
  type StorageLike,
} from './store';

const EMAIL = 'tester@example.com';
/**
 * A Monday, so `weekStart(TODAY) === TODAY` and the seeded step history (which only covers
 * earlier days) contributes nothing to the "week" leaderboard. Keeps the tests date-independent.
 */
const TODAY = weekStart('2026-09-09');

/** Sign a demo user in and hand back the storage they live in. */
function signedIn(email = EMAIL): { storage: StorageLike; userId: string } {
  const storage = memoryStorage();
  const code = requestDemoCode(email, storage);
  const user = verifyDemoCode(email, code, storage, TODAY);
  return { storage, userId: user.id };
}

/** A completed 20-minute workout row in the shape the mappers read. */
function session(
  userId: string,
  localDate: string,
  points: number,
  courseId = 'start',
): DbWorkoutSession {
  const at = `${localDate}T10:00:00.000Z`;
  return {
    id: `sess_${points}_${courseId}`,
    user_id: userId,
    course_id: courseId,
    node_id: 'n1',
    workout_id: 'w1',
    difficulty: 'normal',
    scale: 1,
    prescribed: null,
    results: null,
    rpe: 6,
    feeling: 'ok',
    completion: 1,
    points,
    duration_sec: 1200,
    calories: 180,
    started_at: at,
    completed_at: at,
    local_date: localDate,
  };
}

describe('demo store — seeding', () => {
  it('gives a new account two active courses and leaves the rest unowned', () => {
    const db = emptyDb();
    const profile = seedUser(db, EMAIL, TODAY);
    const mine = db.purchases.filter((p) => p.email === EMAIL);
    expect(mine.map((p) => p.course_id).sort()).toEqual([...DEMO_ENTITLED_COURSES].sort());
    expect(mine.every((p) => p.status === 'active')).toBe(true);
    expect(mine.some((p) => p.course_id === 'dumbbells')).toBe(false);
    expect(profile.email).toBe(EMAIL);
  });

  it('starts with no training profile and no workout history, so onboarding is real', () => {
    const db = emptyDb();
    const profile = profileFromDb(seedUser(db, EMAIL, TODAY));
    expect(profile.onboardedAt).toBeNull();
    expect(profile.trainingProfile).toBeNull();
    expect(db.sessions).toHaveLength(0);
    expect(db.benchmarks).toHaveLength(0);
  });

  it('seeds step history for the previous days but never for today', () => {
    const db = emptyDb();
    const profile = seedUser(db, EMAIL, TODAY);
    const mine = db.dailyLogs.filter((d) => d.user_id === profile.id);
    expect(mine.length).toBeGreaterThanOrEqual(7);
    expect(mine.every((d) => d.local_date < TODAY)).toBe(true);
    // Points follow the same formula as the daily_logs_points trigger.
    for (const log of mine) expect(log.points).toBe(stepsPoints(toNumberOr(log.steps, 0)));
    // A mix: some days clear the 7 000 goal (they feed the streak), some do not.
    expect(mine.some((d) => toNumberOr(d.points, 0) > 0)).toBe(true);
    expect(mine.some((d) => toNumberOr(d.points, 0) === 0)).toBe(true);
  });

  it('seeds other people’s purchases so the admin screen has something to act on', () => {
    const db = emptyDb();
    seedUser(db, EMAIL, TODAY);
    const others = db.purchases.filter((p) => p.email !== EMAIL);
    expect(others.some((p) => p.status === 'pending')).toBe(true);
    expect(others.some((p) => p.status === 'active')).toBe(true);
    expect(others.every((p) => p.email.endsWith('@example.com'))).toBe(true);
  });

  it('ships a leaderboard of invented athletes', () => {
    expect(emptyDb().rivals.length).toBeGreaterThanOrEqual(12);
  });
});

describe('demo store — persistence', () => {
  it('round-trips the database through storage', () => {
    const storage = memoryStorage();
    const db = emptyDb();
    seedUser(db, EMAIL, TODAY);
    writeDb(db, storage);

    const back = readDb(storage);
    expect(back.version).toBe(DEMO_SCHEMA_VERSION);
    expect(back.profiles.map((p) => p.email)).toEqual([EMAIL]);
    expect(back.purchases.length).toBe(db.purchases.length);
    expect(back.dailyLogs.length).toBe(db.dailyLogs.length);
  });

  it('discards a database written by another schema version', () => {
    const storage = memoryStorage();
    const db = emptyDb();
    seedUser(db, EMAIL, TODAY);
    writeDb({ ...db, version: DEMO_SCHEMA_VERSION + 1 }, storage);
    expect(readDb(storage).profiles).toHaveLength(0);
  });

  it('survives corrupt storage', () => {
    const storage = memoryStorage();
    storage.setItem('forma.demo.db', '{not json');
    expect(readDb(storage).profiles).toHaveLength(0);
    storage.setItem('forma.demo.auth', 'nope');
    expect(readAuth(storage).userId).toBeNull();
  });

  it('reuses the account when the same email signs in again', () => {
    const storage = memoryStorage();
    const first = verifyDemoCode(EMAIL, requestDemoCode(EMAIL, storage), storage, TODAY);
    signOutDemo(storage);
    expect(currentDemoUser(storage)).toBeNull();

    const second = verifyDemoCode(EMAIL, requestDemoCode(EMAIL, storage), storage, TODAY);
    expect(second.id).toBe(first.id);
    expect(readDb(storage).profiles).toHaveLength(1);
  });

  it('keeps separate accounts per email', () => {
    const storage = memoryStorage();
    const a = verifyDemoCode(EMAIL, requestDemoCode(EMAIL, storage), storage, TODAY);
    const other = 'other@example.com';
    const b = verifyDemoCode(other, requestDemoCode(other, storage), storage, TODAY);
    expect(b.id).not.toBe(a.id);
    expect(readDb(storage).profiles).toHaveLength(2);
  });

  it('clears everything on reset', () => {
    const { storage } = signedIn();
    expect(readDb(storage).profiles).toHaveLength(1);
    clearDemoStore(storage);
    const wiped = readDb(storage);
    expect(wiped.profiles).toHaveLength(0);
    expect(wiped.purchases).toHaveLength(0);
    expect(wiped.dailyLogs).toHaveLength(0);
    expect(currentDemoUser(storage)).toBeNull();
    expect(pendingDemoCode(storage)).toBeNull();
  });
});

describe('demo store — code verification', () => {
  it('issues a six-digit code and accepts it', () => {
    const storage = memoryStorage();
    const code = requestDemoCode(EMAIL, storage);
    expect(code).toMatch(/^\d{6}$/);
    expect(pendingDemoCode(storage)).toBe(code);

    const user = verifyDemoCode(EMAIL, code, storage, TODAY);
    expect(user.email).toBe(EMAIL);
    expect(currentDemoUser(storage)).toEqual(user);
    // The code is spent once it is used.
    expect(pendingDemoCode(storage)).toBeNull();
  });

  it('normalizes the email on both steps', () => {
    const storage = memoryStorage();
    const code = requestDemoCode('  Tester@Example.COM ', storage);
    const user = verifyDemoCode('tester@example.com', code, storage, TODAY);
    expect(user.email).toBe(EMAIL);
  });

  it('rejects a wrong code and stays signed out', () => {
    const storage = memoryStorage();
    const code = requestDemoCode(EMAIL, storage);
    const wrong = code === '000000' ? '111111' : '000000';
    try {
      verifyDemoCode(EMAIL, wrong, storage, TODAY);
      expect.unreachable('a wrong code must be rejected');
    } catch (e) {
      expect(isAppError(e)).toBe(true);
      expect(isAppError(e) && e.code).toBe('validation');
      expect(isAppError(e) && e.message).toBe('invalid_code');
    }
    expect(currentDemoUser(storage)).toBeNull();
    expect(readDb(storage).profiles).toHaveLength(0);
    // The code survives the failed attempt, so the athlete can retype it.
    expect(pendingDemoCode(storage)).toBe(code);
  });

  it('rejects a malformed code and a code issued for another email', () => {
    const storage = memoryStorage();
    const code = requestDemoCode(EMAIL, storage);
    expect(() => verifyDemoCode(EMAIL, '12345', storage, TODAY)).toThrow();
    expect(() => verifyDemoCode('someone.else@example.com', code, storage, TODAY)).toThrow();
    expect(currentDemoUser(storage)).toBeNull();
  });

  it('rejects any code when none was requested', () => {
    const storage = memoryStorage();
    expect(() => verifyDemoCode(EMAIL, '123456', storage, TODAY)).toThrow();
  });
});

describe('demo store — leaderboard', () => {
  it('pins the signed-in athlete last while they have no points', () => {
    const { storage, userId } = signedIn();
    const db = readDb(storage);
    const rows = demoLeaderboard(db, userId, 'week', undefined, 100, TODAY);
    const mine = rows.filter((r) => r.is_me);
    expect(mine).toHaveLength(1);
    expect(mine[0]?.points).toBe(0);
    expect(mine[0]?.rank).toBe(rows.length);
    expect(rows.length).toBe(db.rivals.length + 1);
  });

  it('merges the local user into the ranking once sessions exist', () => {
    const { storage, userId } = signedIn();
    mutateDb((db) => {
      db.sessions.push(
        session(userId, TODAY, 300, 'start'),
        session(userId, TODAY, 300, 'engine'),
        session(userId, TODAY, 300, 'athlete'),
      );
    }, storage);

    const rows = demoLeaderboard(readDb(storage), userId, 'week', undefined, 100, TODAY);
    const mine = rows.find((r) => r.is_me);
    expect(mine?.points).toBe(900);
    expect(mine?.rank).toBe(1);
    const points = rows.map((r) => toNumberOr(r.points, 0));
    expect([...points].sort((a, b) => b - a)).toEqual(points);
  });

  it('drops step points and unrelated athletes when a course filter is on', () => {
    const { storage, userId } = signedIn();
    mutateDb((db) => {
      db.sessions.push(session(userId, TODAY, 120, 'start'));
    }, storage);

    const rows = demoLeaderboard(readDb(storage), userId, 'all', 'start', 100, TODAY);
    expect(rows.find((r) => r.is_me)?.points).toBe(120);
    // On a filtered board only the caller may sit at zero.
    expect(rows.every((r) => r.is_me || toNumberOr(r.points, 0) > 0)).toBe(true);

    const empty = demoLeaderboard(readDb(storage), userId, 'all', 'kettlebell', 100, TODAY);
    expect(empty.find((r) => r.is_me)?.points).toBe(0);
  });

  it('honours the limit but always keeps the caller', () => {
    const { storage, userId } = signedIn();
    const rows = demoLeaderboard(readDb(storage), userId, 'all', undefined, 3);
    expect(rows).toHaveLength(4);
    expect(rows.filter((r) => r.is_me)).toHaveLength(1);
  });
});

describe('demo store — totals', () => {
  it('sums workout points, step points, sessions and minutes', () => {
    const { storage, userId } = signedIn();
    mutateDb((db) => {
      db.sessions.push(session(userId, TODAY, 200));
      // An unfinished session must not count.
      db.sessions.push({ ...session(userId, TODAY, 999, 'engine'), completed_at: null });
    }, storage);

    const db = readDb(storage);
    const seededStepPoints = db.dailyLogs
      .filter((d) => d.user_id === userId)
      .reduce((sum, d) => sum + toNumberOr(d.points, 0), 0);
    const totals = demoTotals(db, userId);
    expect(totals.workouts).toBe(1);
    expect(totals.minutes).toBe(20);
    expect(totals.points).toBe(200 + seededStepPoints);
  });
});

describe('demo store — accounts', () => {
  it('ensureUser seeds once and finds the account afterwards', () => {
    const db = emptyDb();
    const a = ensureUser(db, EMAIL, TODAY);
    const b = ensureUser(db, EMAIL, TODAY);
    expect(b.id).toBe(a.id);
    expect(db.profiles).toHaveLength(1);
    expect(findProfileByEmail(db, EMAIL)?.id).toBe(a.id);
  });
});
