/**
 * Demo implementations of every `src/lib/api` data function.
 *
 * Same signatures, same validation, same `AppError` contract as the Supabase versions — rows come
 * from the browser-local store and go through the same mappers, so the app cannot tell the
 * difference beyond the demo badge.
 */
import { stepsPoints } from '@/lib/training/streak';
import { addDays, toLocalDateIso } from '@/lib/util/dates';
import { AppError } from '../errors';
import { assertLocalDate, COURSE_ID_RE, EMAIL_RE, guard } from '../internal';
import {
  benchmarkFromDb,
  completeSessionToDb,
  courseStateFromDb,
  courseStatePatchToDb,
  dailyLogFromDb,
  entitlementFromDb,
  groupBenchmarks,
  leaderboardRowFromDb,
  parseStorageRef,
  profileFromDb,
  profilePatchToDb,
  purchaseFromDb,
  sessionFromDb,
  totalsFromDb,
  type DbBenchmark,
  type DbCourseState,
  type DbDailyLog,
  type DbPurchase,
  type DbWorkoutSession,
} from '../mappers';
import type {
  BenchmarkRow,
  BenchmarkSeries,
  CompleteSessionInput,
  CourseStatePatch,
  CourseStateRow,
  DailyLogRow,
  Entitlement,
  LeaderboardPeriod,
  LeaderboardRow,
  MyTotals,
  OrderInput,
  Profile,
  ProfilePatch,
  PurchaseFilter,
  PurchaseRow,
  PurchaseStatus,
  StartSessionInput,
  WorkoutSessionRow,
} from '../types';
import { delay } from './latency';
import {
  currentDemoUser,
  demoId,
  demoLeaderboard,
  demoTotals,
  findProfileById,
  mutateDb,
  normalizeDemoEmail,
  nowIso,
  readDb,
  type DemoDb,
  type DemoUser,
} from './store';

const STATUSES: readonly PurchaseStatus[] = ['pending', 'active', 'refunded'];
const MAX_STEPS = 100_000;
const STEPS_EDIT_DAYS_BACK = 7;
const BENCHMARK_KEY_RE = /^[a-z0-9_]{2,60}$/;

function requireDemoUser(): DemoUser {
  const user = currentDemoUser();
  if (!user) throw new AppError('auth', 'not_signed_in');
  return user;
}

/** Every demo call: artificial latency, then the same `guard()` error folding as Supabase. */
async function run<T>(fn: () => T): Promise<T> {
  await delay();
  return guard(async () => fn());
}

// --- profiles ---------------------------------------------------------------

export async function getProfile(): Promise<Profile | null> {
  return run(() => {
    const user = currentDemoUser();
    if (!user) return null;
    const row = readDb().profiles.find((p) => p.id === user.id);
    return row ? profileFromDb(row) : null;
  });
}

export async function updateProfile(patch: ProfilePatch): Promise<Profile> {
  return run(() => {
    const user = requireDemoUser();
    const dbPatch = profilePatchToDb(patch);
    return mutateDb((db) => {
      const row = findProfileById(db, user.id);
      if (!row) throw new AppError('not_found', 'not_found');
      Object.assign(row, dbPatch);
      row.updated_at = nowIso();
      return profileFromDb(row);
    });
  });
}

// --- entitlements -----------------------------------------------------------

function activePurchases(db: DemoDb, email: string): DbPurchase[] {
  return db.purchases.filter((p) => p.email === email && p.status === 'active');
}

export async function listEntitlements(): Promise<Entitlement[]> {
  return run(() => {
    const user = requireDemoUser();
    return activePurchases(readDb(), user.email)
      .sort((a, b) => (b.activated_at ?? '').localeCompare(a.activated_at ?? ''))
      .map((p) => entitlementFromDb({ course_id: p.course_id, activated_at: p.activated_at }));
  });
}

// --- course state -----------------------------------------------------------

export async function listCourseStates(): Promise<CourseStateRow[]> {
  return run(() => {
    const user = requireDemoUser();
    return readDb()
      .courseStates.filter((s) => s.user_id === user.id)
      .sort((a, b) => b.updated_at.localeCompare(a.updated_at))
      .map(courseStateFromDb);
  });
}

export async function getCourseState(courseId: string): Promise<CourseStateRow | null> {
  return run(() => {
    const user = requireDemoUser();
    const row = readDb().courseStates.find(
      (s) => s.user_id === user.id && s.course_id === courseId,
    );
    return row ? courseStateFromDb(row) : null;
  });
}

export async function upsertCourseState(
  courseId: string,
  patch: CourseStatePatch,
): Promise<CourseStateRow> {
  return run(() => {
    if (!COURSE_ID_RE.test(courseId)) throw new AppError('validation', 'invalid_course');
    if (patch.scale !== undefined && !(patch.scale >= 0.3 && patch.scale <= 2)) {
      throw new AppError('validation', 'invalid_scale');
    }
    const user = requireDemoUser();
    return mutateDb((db) => {
      let row = db.courseStates.find((s) => s.user_id === user.id && s.course_id === courseId);
      if (!row) {
        row = {
          user_id: user.id,
          course_id: courseId,
          scale: 1,
          current_node_index: 0,
          completed_node_ids: [],
          updated_at: nowIso(),
        } satisfies DbCourseState;
        db.courseStates.push(row);
      }
      Object.assign(row, courseStatePatchToDb(patch));
      row.updated_at = nowIso();
      return courseStateFromDb(row);
    });
  });
}

// --- workout sessions -------------------------------------------------------

export async function startSession(input: StartSessionInput): Promise<{ id: string }> {
  return run(() => {
    assertLocalDate(input.localDate, 'local_date');
    const user = requireDemoUser();
    const row: DbWorkoutSession = {
      id: demoId('sess'),
      user_id: user.id,
      course_id: input.courseId,
      node_id: input.nodeId,
      workout_id: input.workoutId,
      difficulty: input.difficulty,
      scale: input.scale,
      prescribed: input.prescribed,
      results: null,
      rpe: null,
      feeling: null,
      completion: null,
      points: 0,
      duration_sec: null,
      calories: null,
      started_at: nowIso(),
      completed_at: null,
      local_date: input.localDate,
    };
    mutateDb((db) => db.sessions.push(row));
    return { id: row.id };
  });
}

export async function completeSession(
  id: string,
  patch: CompleteSessionInput,
): Promise<WorkoutSessionRow> {
  return run(() => {
    if (!(patch.rpe >= 1 && patch.rpe <= 10)) throw new AppError('validation', 'invalid_rpe');
    if (!(patch.completion >= 0 && patch.completion <= 1)) {
      throw new AppError('validation', 'invalid_completion');
    }
    const user = requireDemoUser();
    return mutateDb((db) => {
      const row = db.sessions.find((s) => s.id === id && s.user_id === user.id);
      if (!row) throw new AppError('not_found', 'not_found');
      Object.assign(row, completeSessionToDb(patch));
      return sessionFromDb(row);
    });
  });
}

export async function listRecentSessions(
  limit = 20,
  courseId?: string,
): Promise<WorkoutSessionRow[]> {
  return run(() => {
    const user = requireDemoUser();
    return readDb()
      .sessions.filter(
        (s) =>
          s.user_id === user.id &&
          s.completed_at !== null &&
          (courseId === undefined || s.course_id === courseId),
      )
      .sort((a, b) => (b.completed_at ?? '').localeCompare(a.completed_at ?? ''))
      .slice(0, Math.max(1, Math.min(limit, 500)))
      .map(sessionFromDb);
  });
}

export async function listSessionsBetween(
  fromLocalDate: string,
  toLocalDate: string,
): Promise<WorkoutSessionRow[]> {
  return run(() => {
    assertLocalDate(fromLocalDate, 'from');
    assertLocalDate(toLocalDate, 'to');
    const user = requireDemoUser();
    return readDb()
      .sessions.filter(
        (s) =>
          s.user_id === user.id && s.local_date >= fromLocalDate && s.local_date <= toLocalDate,
      )
      .sort(
        (a, b) =>
          a.local_date.localeCompare(b.local_date) || a.started_at.localeCompare(b.started_at),
      )
      .map(sessionFromDb);
  });
}

export async function getWorkoutSession(id: string): Promise<WorkoutSessionRow> {
  return run(() => {
    const user = requireDemoUser();
    const row = readDb().sessions.find((s) => s.id === id && s.user_id === user.id);
    if (!row) throw new AppError('not_found', 'not_found');
    return sessionFromDb(row);
  });
}

// --- daily logs -------------------------------------------------------------

export async function upsertDailyLog(
  localDate: string,
  steps: number,
  note?: string | null,
): Promise<DailyLogRow> {
  return run(() => {
    assertLocalDate(localDate, 'local_date');
    const today = toLocalDateIso();
    if (localDate < addDays(today, -(STEPS_EDIT_DAYS_BACK + 1)) || localDate > addDays(today, 2)) {
      throw new AppError('validation', 'local_date_out_of_range');
    }
    if (!Number.isInteger(steps) || steps < 0 || steps > MAX_STEPS) {
      throw new AppError('validation', 'invalid_steps');
    }
    const user = requireDemoUser();
    return mutateDb((db) => {
      let row = db.dailyLogs.find((d) => d.user_id === user.id && d.local_date === localDate);
      if (!row) {
        row = {
          user_id: user.id,
          local_date: localDate,
          steps: 0,
          points: 0,
          note: null,
          updated_at: nowIso(),
        } satisfies DbDailyLog;
        db.dailyLogs.push(row);
      }
      row.steps = steps;
      // Same recomputation the daily_logs_points trigger does server-side.
      row.points = stepsPoints(steps);
      if (note !== undefined) row.note = note === null ? null : note.trim() || null;
      row.updated_at = nowIso();
      return dailyLogFromDb(row);
    });
  });
}

export async function listDailyLogs(
  fromLocalDate: string,
  toLocalDate: string,
): Promise<DailyLogRow[]> {
  return run(() => {
    assertLocalDate(fromLocalDate, 'from');
    assertLocalDate(toLocalDate, 'to');
    const user = requireDemoUser();
    return readDb()
      .dailyLogs.filter(
        (d) =>
          d.user_id === user.id && d.local_date >= fromLocalDate && d.local_date <= toLocalDate,
      )
      .sort((a, b) => a.local_date.localeCompare(b.local_date))
      .map(dailyLogFromDb);
  });
}

// --- benchmarks -------------------------------------------------------------

export async function recordBenchmark(
  key: string,
  value: number,
  unit: string,
): Promise<BenchmarkRow> {
  return run(() => {
    if (!BENCHMARK_KEY_RE.test(key)) throw new AppError('validation', 'invalid_key');
    if (!Number.isFinite(value)) throw new AppError('validation', 'invalid_value');
    if (!unit.trim()) throw new AppError('validation', 'invalid_unit');
    const user = requireDemoUser();
    const row: DbBenchmark = {
      id: demoId('bm'),
      user_id: user.id,
      key,
      value,
      unit: unit.trim(),
      recorded_at: nowIso(),
    };
    mutateDb((db) => db.benchmarks.push(row));
    return benchmarkFromDb(row);
  });
}

export async function listBenchmarks(): Promise<BenchmarkSeries[]> {
  return run(() => {
    const user = requireDemoUser();
    const rows = readDb()
      .benchmarks.filter((b) => b.user_id === user.id)
      .sort((a, b) => b.recorded_at.localeCompare(a.recorded_at))
      .slice(0, 1000)
      .map(benchmarkFromDb);
    return groupBenchmarks(rows);
  });
}

// --- leaderboard / totals ---------------------------------------------------

export async function getLeaderboard(
  period: LeaderboardPeriod,
  courseId?: string,
  limit = 100,
): Promise<LeaderboardRow[]> {
  return run(() => {
    if (courseId !== undefined && !COURSE_ID_RE.test(courseId)) {
      throw new AppError('validation', 'invalid_course');
    }
    const user = requireDemoUser();
    const rows = demoLeaderboard(
      readDb(),
      user.id,
      period,
      courseId,
      Math.max(1, Math.min(limit, 500)),
    );
    return rows.map(leaderboardRowFromDb);
  });
}

export async function getMyTotals(): Promise<MyTotals> {
  return run(() => {
    const user = requireDemoUser();
    return totalsFromDb(demoTotals(readDb(), user.id));
  });
}

// --- orders -----------------------------------------------------------------

export async function createOrder(input: OrderInput): Promise<string> {
  return run(() => {
    const email = normalizeDemoEmail(input.email);
    if (!EMAIL_RE.test(email) || email.length > 254) {
      throw new AppError('validation', 'invalid_email');
    }
    if (!COURSE_ID_RE.test(input.courseId)) throw new AppError('validation', 'invalid_course');
    return mutateDb((db) => {
      const existing = db.purchases.find(
        (p) => p.email === email && p.course_id === input.courseId,
      );
      const now = nowIso();
      if (existing) {
        // An active purchase is never touched, exactly like create_order().
        if (existing.status !== 'active') {
          existing.status = 'pending';
          existing.source = input.source ?? 'landing';
          existing.locale = input.locale ?? existing.locale;
          existing.updated_at = now;
        }
        return existing.id;
      }
      const row: DbPurchase = {
        id: demoId('pur'),
        email,
        course_id: input.courseId,
        status: 'pending',
        source: input.source ?? 'landing',
        locale: input.locale ?? 'ru',
        note: null,
        created_at: now,
        activated_at: null,
        updated_at: now,
      };
      db.purchases.push(row);
      return row.id;
    });
  });
}

// --- admin ------------------------------------------------------------------

/** The demo account is always the coach, so the admin screen and its flows are reachable. */
export async function isAdmin(): Promise<boolean> {
  await delay();
  return currentDemoUser() !== null;
}

export async function listPurchases(filter: PurchaseFilter = {}): Promise<PurchaseRow[]> {
  return run(() => {
    requireDemoUser();
    const term = (filter.search ?? '')
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9@._+-]/g, '');
    return readDb()
      .purchases.filter((p) => {
        if (filter.status && p.status !== filter.status) return false;
        if (!term) return true;
        return p.email.toLowerCase().includes(term) || p.course_id.includes(term);
      })
      .sort((a, b) => b.created_at.localeCompare(a.created_at))
      .slice(0, 500)
      .map(purchaseFromDb);
  });
}

export async function setPurchaseStatus(id: string, status: PurchaseStatus): Promise<void> {
  return run(() => {
    if (!STATUSES.includes(status)) throw new AppError('validation', 'invalid_status');
    requireDemoUser();
    mutateDb((db) => {
      const row = db.purchases.find((p) => p.id === id);
      if (!row) throw new AppError('not_found', 'not_found');
      const now = nowIso();
      row.status = status;
      // First activation stamps the date; re-activation keeps the original.
      if (status === 'active') row.activated_at = row.activated_at ?? now;
      row.updated_at = now;
    });
  });
}

export async function addPurchase(email: string, courseId: string, note?: string): Promise<string> {
  return run(() => {
    const clean = normalizeDemoEmail(email);
    if (!EMAIL_RE.test(clean)) throw new AppError('validation', 'invalid_email');
    if (!COURSE_ID_RE.test(courseId)) throw new AppError('validation', 'invalid_course');
    requireDemoUser();
    return mutateDb((db) => {
      const now = nowIso();
      const trimmed = note?.trim().slice(0, 500) || null;
      const existing = db.purchases.find((p) => p.email === clean && p.course_id === courseId);
      if (existing) {
        existing.status = 'active';
        existing.activated_at = existing.activated_at ?? now;
        existing.note = trimmed ?? existing.note;
        existing.updated_at = now;
        return existing.id;
      }
      const row: DbPurchase = {
        id: demoId('pur'),
        email: clean,
        course_id: courseId,
        status: 'active',
        source: 'admin',
        locale: null,
        note: trimmed,
        created_at: now,
        activated_at: now,
        updated_at: now,
      };
      db.purchases.push(row);
      return row.id;
    });
  });
}

// --- storage ----------------------------------------------------------------

/**
 * There is no private bucket in demo mode, so a `storage:` reference resolves to nothing and the
 * player falls back to the built-in exercise animations. Absolute URLs still play.
 */
export async function resolveMediaUrl(ref: string | undefined): Promise<string | undefined> {
  if (!ref) return undefined;
  const trimmed = ref.trim();
  if (!trimmed) return undefined;
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return parseStorageRef(trimmed) ? undefined : trimmed;
}
