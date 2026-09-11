/**
 * Demo implementations of every `src/lib/api` data function.
 *
 * Same signatures, same validation, same `AppError` contract as the Supabase versions — rows come
 * from the browser-local store and go through the same mappers, so the app cannot tell the
 * difference beyond the demo badge.
 */
import { COURSES, EXERCISES } from '@/content/registry';
import { stepsPoints } from '@/lib/training/streak';
import { addDays, toLocalDateIso } from '@/lib/util/dates';
import { AppError } from '../errors';
import type {
  AdminCourseBundle,
  AdminCourseDayPatch,
  AdminCourseDayRow,
  AdminCoursePatch,
  AdminCourseRow,
  AssignedWorkoutRow,
  CustomWorkoutRow,
  CustomWorkoutSummary,
  ExerciseCatalogRow,
  ExerciseDraft,
  ExerciseMarkupPatch,
  WorkoutAssigneeRow,
} from '../types';
import type { CustomWorkoutInput } from '../customWorkouts';
import {
  buildPrescribedFromCustom,
  type CustomWorkoutStructure,
} from '@/lib/training/customWorkout';
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
  subscriptionFromDb,
  subscriptionLive,
  subscriptionRowFromDb,
  totalsFromDb,
  type DbBenchmark,
  type DbCourseState,
  type DbDailyLog,
  type DbPurchase,
  type DbSubscriptionRow,
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
  Subscription,
  SubscriptionChange,
  SubscriptionFilter,
  SubscriptionOrderInput,
  SubscriptionPlan,
  SubscriptionRow,
  SubscriptionStatus,
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
  writeDb,
  type DemoDb,
  type DemoUser,
} from './store';

const STATUSES: readonly PurchaseStatus[] = ['pending', 'active', 'refunded'];
const PLANS: readonly SubscriptionPlan[] = ['monthly', 'annual'];
const PERIOD_MS: Record<SubscriptionPlan, number> = {
  monthly: 30 * 86_400_000,
  annual: 365 * 86_400_000,
};

function liveSubscription(db: DemoDb, email: string): DbSubscriptionRow | null {
  const row = db.subscriptions.find((x) => x.email === email);
  return row && subscriptionLive(row.status as SubscriptionStatus, row.expires_at) ? row : null;
}
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
    const db = readDb();
    const owned = activePurchases(db, user.email)
      .sort((a, b) => (b.activated_at ?? '').localeCompare(a.activated_at ?? ''))
      .map((p) => entitlementFromDb({ course_id: p.course_id, activated_at: p.activated_at }));
    const sub = liveSubscription(db, user.email);
    if (!sub) return owned;
    // Same union as the my_entitlements view: a live subscription lists every course.
    const seen = new Set(owned.map((e) => e.courseId));
    for (const course of COURSES) {
      if (seen.has(course.id)) continue;
      owned.push(entitlementFromDb({ course_id: course.id, activated_at: sub.started_at }));
    }
    return owned;
  });
}

// --- subscriptions ----------------------------------------------------------

export async function getMySubscription(): Promise<Subscription | null> {
  return run(() => {
    const user = requireDemoUser();
    const row = readDb().subscriptions.find((x) => x.email === user.email);
    if (!row) return null;
    return subscriptionFromDb({
      plan: row.plan,
      status: row.status,
      started_at: row.started_at,
      expires_at: row.expires_at,
      is_live: subscriptionLive(row.status as SubscriptionStatus, row.expires_at),
    });
  });
}

export async function createSubscriptionOrder(input: SubscriptionOrderInput): Promise<string> {
  return run(() => {
    const email = normalizeDemoEmail(input.email);
    if (!EMAIL_RE.test(email) || email.length > 254) {
      throw new AppError('validation', 'invalid_email');
    }
    if (!PLANS.includes(input.plan)) throw new AppError('validation', 'invalid_plan');
    return mutateDb((db) => {
      const now = nowIso();
      const existing = db.subscriptions.find((x) => x.email === email);
      if (existing) {
        // A live subscription is never downgraded by a form, exactly like the RPC.
        if (!subscriptionLive(existing.status as SubscriptionStatus, existing.expires_at)) {
          existing.plan = input.plan;
          existing.source = input.source ?? 'landing';
        }
        existing.locale = input.locale ?? existing.locale;
        existing.updated_at = now;
        return existing.id;
      }
      const row: DbSubscriptionRow = {
        id: demoId('sub'),
        email,
        plan: input.plan,
        status: 'pending',
        started_at: null,
        expires_at: null,
        source: input.source ?? 'landing',
        provider_ref: null,
        locale: input.locale ?? 'ru',
        note: null,
        created_at: now,
        updated_at: now,
      };
      db.subscriptions.push(row);
      return row.id;
    });
  });
}

export async function listSubscriptions(
  filter: SubscriptionFilter = {},
): Promise<SubscriptionRow[]> {
  return run(() => {
    requireDemoUser();
    const term = (filter.search ?? '')
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9@._+-]/g, '');
    return readDb()
      .subscriptions.filter((x) => {
        if (filter.status && x.status !== filter.status) return false;
        return !term || x.email.toLowerCase().includes(term);
      })
      .sort((a, b) => b.created_at.localeCompare(a.created_at))
      .slice(0, 500)
      .map(subscriptionRowFromDb);
  });
}

/** Mirrors admin_set_subscription(): grant / extend from the current expiry, or cancel keeping it. */
export async function setSubscription(change: SubscriptionChange): Promise<string> {
  return run(() => {
    const email = normalizeDemoEmail(change.email);
    if (!EMAIL_RE.test(email)) throw new AppError('validation', 'invalid_email');
    if (!PLANS.includes(change.plan)) throw new AppError('validation', 'invalid_plan');
    if (change.status !== 'active' && change.status !== 'cancelled') {
      throw new AppError('validation', 'invalid_status');
    }
    requireDemoUser();
    return mutateDb((db) => {
      const now = nowIso();
      const existing = db.subscriptions.find((x) => x.email === email);
      const live =
        existing && subscriptionLive(existing.status as SubscriptionStatus, existing.expires_at);
      let expiresAt: string | null;
      if (change.status === 'active') {
        const from = live && existing?.expires_at ? Date.parse(existing.expires_at) : Date.now();
        expiresAt = change.expiresAt ?? new Date(from + PERIOD_MS[change.plan]).toISOString();
      } else {
        if (!existing) throw new AppError('not_found', 'not_found');
        expiresAt = existing.expires_at ?? now;
      }
      const note = change.note?.trim().slice(0, 500) || null;
      if (existing) {
        existing.plan = change.plan;
        existing.status = change.status;
        existing.started_at = existing.started_at ?? now;
        existing.expires_at = expiresAt;
        existing.source = 'admin';
        existing.note = note ?? existing.note;
        existing.updated_at = now;
        return existing.id;
      }
      const row: DbSubscriptionRow = {
        id: demoId('sub'),
        email,
        plan: change.plan,
        status: change.status,
        started_at: now,
        expires_at: expiresAt,
        source: 'admin',
        provider_ref: null,
        locale: null,
        note,
        created_at: now,
        updated_at: now,
      };
      db.subscriptions.push(row);
      return row.id;
    });
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

// --- exercise catalogue + custom workouts -----------------------------------
//
// The demo account is the coach (isAdmin() above returns true for it), so the builder screens are
// reachable and have to work. They run on the same browser-local database as everything else:
// the exercise library starts as the compiled one, and anything the coach writes — a pose, a
// workout, a course — is stored in `forma.demo.*` and never leaves the browser.
//
// Assignments and share links are the exception and stay empty: both hand a workout to *another*
// person, and a demo has nobody else in it.

/** The compiled library, in the shape `public.exercises` returns. */
function compiledExerciseRows(): ExerciseCatalogRow[] {
  return EXERCISES.map((e) => ({
    id: e.id,
    nameRu: e.name.ru,
    nameEn: e.name.en,
    shortNameRu: e.shortName?.ru ?? null,
    descriptionRu: e.description.ru,
    descriptionEn: e.description.en,
    howTo: e.howTo.map((v) => ({ ru: v.ru, en: v.en })),
    cues: e.cues.map((v) => ({ ru: v.ru, en: v.en })),
    mistakes: e.mistakes.map((v) => ({ ru: v.ru, en: v.en })),
    breathingRu: e.breathing?.ru ?? null,
    primaryMuscle: e.muscles[0] ?? null,
    muscles: [...e.muscles],
    pattern: e.pattern,
    equipment: [...e.equipment],
    level: e.level,
    unit: e.unit,
    secondsPerRep: e.secondsPerRep ?? null,
    animation: e.animation,
    videoRu: e.video?.ru ?? null,
    videoEn: e.video?.en ?? null,
    image: null,
    tags: [...e.tags],
    isTest: e.isTest === true,
    isCustom: false,
  }));
}

/** Compiled rows, with anything written in the admin panel layered over them by id. */
function exerciseRows(db: DemoDb): ExerciseCatalogRow[] {
  const byId = new Map(compiledExerciseRows().map((r) => [r.id, r]));
  for (const row of db.exercises) byId.set(row.id, row);
  return [...byId.values()];
}

export async function listExerciseCatalog(): Promise<ExerciseCatalogRow[]> {
  return run(() => exerciseRows(readDb()));
}

/** Write an exercise into the overlay, materialising the compiled row first if need be. */
function upsertExercise(id: string, patch: Partial<ExerciseCatalogRow>): ExerciseCatalogRow {
  const db = readDb();
  const current = exerciseRows(db).find((r) => r.id === id);
  if (!current) throw new AppError('not_found', 'not_found');
  const next = { ...current, ...patch };
  db.exercises = [...db.exercises.filter((r) => r.id !== id), next];
  writeDb(db);
  return next;
}

export async function updateExerciseMarkup(
  id: string,
  patch: ExerciseMarkupPatch,
): Promise<ExerciseCatalogRow> {
  return run(() => {
    requireDemoUser();
    return upsertExercise(id, {
      ...(patch.videoRu !== undefined ? { videoRu: patch.videoRu || null } : {}),
      ...(patch.videoEn !== undefined ? { videoEn: patch.videoEn || null } : {}),
      ...(patch.tags !== undefined ? { tags: patch.tags } : {}),
    });
  });
}

function draftToRow(draft: ExerciseDraft, base?: ExerciseCatalogRow): ExerciseCatalogRow {
  return {
    id: draft.id,
    nameRu: draft.nameRu,
    nameEn: draft.nameEn ?? base?.nameEn ?? null,
    shortNameRu: draft.shortNameRu ?? base?.shortNameRu ?? null,
    descriptionRu: draft.descriptionRu ?? base?.descriptionRu ?? null,
    descriptionEn: draft.descriptionEn ?? base?.descriptionEn ?? null,
    howTo: draft.howTo ?? base?.howTo ?? [],
    cues: draft.cues ?? base?.cues ?? [],
    mistakes: draft.mistakes ?? base?.mistakes ?? [],
    breathingRu: draft.breathingRu ?? base?.breathingRu ?? null,
    primaryMuscle: draft.primaryMuscle ?? base?.primaryMuscle ?? null,
    muscles: draft.muscles ?? base?.muscles ?? [],
    pattern: draft.pattern ?? base?.pattern ?? null,
    equipment: draft.equipment ?? base?.equipment ?? ['none'],
    level: draft.level ?? base?.level ?? 1,
    unit: draft.unit ?? base?.unit ?? 'reps',
    secondsPerRep: draft.secondsPerRep ?? base?.secondsPerRep ?? null,
    animation: base?.animation ?? null,
    videoRu: draft.videoRu ?? base?.videoRu ?? null,
    videoEn: draft.videoEn ?? base?.videoEn ?? null,
    image: draft.image ?? base?.image ?? null,
    tags: draft.tags ?? base?.tags ?? [],
    isTest: draft.isTest ?? base?.isTest ?? false,
    isCustom: base?.isCustom ?? true,
  };
}

export async function createExercise(draft: ExerciseDraft): Promise<ExerciseCatalogRow> {
  return run(() => {
    requireDemoUser();
    if (!/^[a-z0-9_]{2,60}$/.test(draft.id)) throw new AppError('validation', 'invalid_id');
    const db = readDb();
    if (exerciseRows(db).some((r) => r.id === draft.id)) {
      throw new AppError('validation', 'duplicate_id');
    }
    const row = draftToRow(draft);
    db.exercises = [...db.exercises, row];
    writeDb(db);
    return row;
  });
}

export async function updateExercise(
  id: string,
  draft: Partial<ExerciseDraft>,
): Promise<ExerciseCatalogRow> {
  return run(() => {
    requireDemoUser();
    const db = readDb();
    const current = exerciseRows(db).find((r) => r.id === id);
    if (!current) throw new AppError('not_found', 'not_found');
    return upsertExercise(
      id,
      draftToRow({ ...draft, id, nameRu: draft.nameRu ?? current.nameRu }, current),
    );
  });
}

export async function deleteExercise(id: string): Promise<void> {
  return run(() => {
    requireDemoUser();
    const db = readDb();
    // Same rule as the real backend: only an admin-authored exercise can be removed.
    db.exercises = db.exercises.filter((r) => !(r.id === id && r.isCustom));
    writeDb(db);
  });
}

// --- custom workouts --------------------------------------------------------

export async function listCustomWorkouts(): Promise<CustomWorkoutSummary[]> {
  return run(() =>
    [...readDb().customWorkouts]
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .map(({ structure: _structure, ...summary }) => summary),
  );
}

export async function getCustomWorkout(id: string): Promise<CustomWorkoutRow> {
  return run(() => {
    const row = readDb().customWorkouts.find((w) => w.id === id);
    if (!row) throw new AppError('not_found', 'not_found');
    return row;
  });
}

/** Duration and points, from the same estimator the real backend stores them with. */
function derived(structure: CustomWorkoutStructure): { estSec: number; points: number } {
  const p = buildPrescribedFromCustom('cw_preview', structure);
  return { estSec: p.estimatedSec, points: p.points };
}

export async function createCustomWorkout(input: CustomWorkoutInput): Promise<CustomWorkoutRow> {
  return run(() => {
    requireDemoUser();
    const now = new Date().toISOString();
    const { estSec, points } = derived(input.structure);
    const row: CustomWorkoutRow = {
      id: demoId('cw'),
      shortId: demoId('w'),
      title: input.title,
      description: input.description ?? null,
      structure: input.structure,
      estSec,
      points,
      shareToken: null,
      createdAt: now,
      updatedAt: now,
    };
    const db = readDb();
    db.customWorkouts = [...db.customWorkouts, row];
    writeDb(db);
    return row;
  });
}

export async function updateCustomWorkout(
  id: string,
  input: CustomWorkoutInput,
): Promise<CustomWorkoutRow> {
  return run(() => {
    requireDemoUser();
    const db = readDb();
    const current = db.customWorkouts.find((w) => w.id === id);
    if (!current) throw new AppError('not_found', 'not_found');
    const { estSec, points } = derived(input.structure);
    const next: CustomWorkoutRow = {
      ...current,
      title: input.title,
      description: input.description ?? null,
      structure: input.structure,
      estSec,
      points,
      updatedAt: new Date().toISOString(),
    };
    db.customWorkouts = db.customWorkouts.map((w) => (w.id === id ? next : w));
    writeDb(db);
    return next;
  });
}

export async function deleteCustomWorkout(id: string): Promise<void> {
  return run(() => {
    requireDemoUser();
    const db = readDb();
    db.customWorkouts = db.customWorkouts.filter((w) => w.id !== id);
    db.adminCourseDays = db.adminCourseDays.map((d) =>
      d.customWorkoutId === id ? { ...d, customWorkoutId: null } : d,
    );
    writeDb(db);
  });
}

export async function setCustomWorkoutShare(
  _id: string,
  _enabled: boolean,
): Promise<string | null> {
  // A share link hands a workout to somebody else, and a demo has nobody else in it.
  throw new AppError('forbidden', 'demo_read_only');
}

export async function listWorkoutAssignees(_workoutId: string): Promise<WorkoutAssigneeRow[]> {
  return [];
}

export async function assignCustomWorkout(
  _workoutId: string,
  _email: string,
  _note?: string,
): Promise<void> {
  throw new AppError('forbidden', 'demo_read_only');
}

export async function unassignCustomWorkout(_workoutId: string, _email: string): Promise<void> {
  throw new AppError('forbidden', 'demo_read_only');
}

export async function listMyAssignedWorkouts(): Promise<AssignedWorkoutRow[]> {
  return [];
}

export async function getSharedCustomWorkout(_token: string): Promise<AssignedWorkoutRow | null> {
  return null;
}

// --- courses built in the admin panel ---------------------------------------
//
// Same browser-local database as everything else. Publishing is real in the sense that matters
// here: a published course is what `listPublishedCourses()` returns, so it shows up in the demo
// catalogue and can be walked and played exactly as a compiled one. What it cannot do is what
// publishing does on the server — write `public.courses` and `public.workouts` — because in a demo
// there is no purchase to entitle and no ceiling to enforce.

function courseOr404(db: DemoDb, id: string): AdminCourseRow {
  const row = db.adminCourses.find((c) => c.id === id);
  if (!row) throw new AppError('not_found', 'not_found');
  return row;
}

function bundleFor(db: DemoDb, course: AdminCourseRow): AdminCourseBundle {
  const days = db.adminCourseDays
    .filter((d) => d.courseId === course.id)
    .sort((a, b) => a.sortOrder - b.sortOrder);
  const used = new Set(days.map((d) => d.customWorkoutId).filter((v): v is string => !!v));
  return { course, days, workouts: db.customWorkouts.filter((w) => used.has(w.id)) };
}

export async function listAdminCourses(): Promise<AdminCourseRow[]> {
  return run(() =>
    [...readDb().adminCourses].sort(
      (a, b) => a.sortOrder - b.sortOrder || a.createdAt.localeCompare(b.createdAt),
    ),
  );
}

export async function getAdminCourse(id: string): Promise<AdminCourseBundle> {
  return run(() => {
    const db = readDb();
    return bundleFor(db, courseOr404(db, id));
  });
}

export async function createAdminCourse(
  slugId: string,
  patch: AdminCoursePatch,
): Promise<AdminCourseRow> {
  return run(() => {
    requireDemoUser();
    if (!COURSE_ID_RE.test(slugId)) throw new AppError('validation', 'invalid_id');
    const db = readDb();
    if (db.adminCourses.some((c) => c.slugId === slugId)) {
      throw new AppError('validation', 'duplicate_id');
    }
    const now = nowIso();
    const row: AdminCourseRow = {
      id: demoId('ac'),
      slugId,
      status: 'draft',
      sortOrder: 0,
      level: 1,
      weeks: 4,
      sessionsPerWeek: 3,
      avgSessionMin: 30,
      equipment: ['none'],
      tile: '#1A2634',
      priceRub: 0,
      priceUsd: 0,
      content: { longDescription: [], forWhom: [], outcomes: [], faq: [] },
      publishedAt: null,
      createdAt: now,
      updatedAt: now,
      ...patch,
    };
    db.adminCourses = [...db.adminCourses, row];
    writeDb(db);
    return row;
  });
}

export async function updateAdminCourse(
  id: string,
  patch: AdminCoursePatch,
): Promise<AdminCourseRow> {
  return run(() => {
    requireDemoUser();
    const db = readDb();
    const current = courseOr404(db, id);
    // The real table freezes slug_id once published, because it is the id in every purchase and
    // every recorded session. Same rule here, so the demo cannot teach a habit the server refuses.
    if (patch.slugId && patch.slugId !== current.slugId && current.publishedAt) {
      throw new AppError('validation', 'slug_frozen');
    }
    const next: AdminCourseRow = { ...current, ...patch, updatedAt: nowIso() };
    db.adminCourses = db.adminCourses.map((c) => (c.id === id ? next : c));
    writeDb(db);
    return next;
  });
}

export async function deleteAdminCourse(id: string): Promise<void> {
  return run(() => {
    requireDemoUser();
    const db = readDb();
    db.adminCourses = db.adminCourses.filter((c) => c.id !== id);
    db.adminCourseDays = db.adminCourseDays.filter((d) => d.courseId !== id);
    writeDb(db);
  });
}

export async function publishAdminCourse(id: string): Promise<void> {
  return run(() => {
    requireDemoUser();
    const db = readDb();
    const course = courseOr404(db, id);
    const bundle = bundleFor(db, course);
    // The same two checks admin_publish_course() makes.
    if (bundle.days.length < 4) throw new AppError('validation', 'course_too_short');
    const empty = bundle.days.some((d) => {
      if (!['workout', 'test', 'benchmark'].includes(d.kind)) return false;
      const w = bundle.workouts.find((x) => x.id === d.customWorkoutId);
      const structure = w?.structure as CustomWorkoutStructure | undefined;
      return !structure || structure.sections.length === 0;
    });
    if (empty) throw new AppError('validation', 'course_has_empty_days');
    db.adminCourses = db.adminCourses.map((c) =>
      c.id === id
        ? { ...c, status: 'published', publishedAt: c.publishedAt ?? nowIso(), updatedAt: nowIso() }
        : c,
    );
    writeDb(db);
  });
}

export async function unpublishAdminCourse(id: string): Promise<void> {
  return run(() => {
    requireDemoUser();
    const db = readDb();
    courseOr404(db, id);
    db.adminCourses = db.adminCourses.map((c) =>
      c.id === id ? { ...c, status: 'draft', updatedAt: nowIso() } : c,
    );
    writeDb(db);
  });
}

export async function createCourseDay(
  courseId: string,
  patch: AdminCourseDayPatch,
): Promise<AdminCourseDayRow> {
  return run(() => {
    requireDemoUser();
    const db = readDb();
    courseOr404(db, courseId);
    const row: AdminCourseDayRow = {
      id: demoId('cd'),
      courseId,
      nodeId: patch.nodeId ?? demoId('n'),
      week: patch.week ?? 1,
      day: patch.day ?? 1,
      kind: patch.kind ?? 'workout',
      customWorkoutId: patch.customWorkoutId ?? null,
      content: patch.content ?? { body: [] },
      deload: patch.deload ?? false,
      stepsGoal: patch.stepsGoal ?? null,
      sortOrder:
        patch.sortOrder ?? db.adminCourseDays.filter((d) => d.courseId === courseId).length,
    };
    // The table has a unique (course_id, week, day); refuse the collision here too.
    if (
      db.adminCourseDays.some(
        (d) => d.courseId === courseId && d.week === row.week && d.day === row.day,
      )
    ) {
      throw new AppError('validation', 'day_taken');
    }
    db.adminCourseDays = [...db.adminCourseDays, row];
    writeDb(db);
    return row;
  });
}

export async function updateCourseDay(
  id: string,
  patch: AdminCourseDayPatch,
): Promise<AdminCourseDayRow> {
  return run(() => {
    requireDemoUser();
    const db = readDb();
    const current = db.adminCourseDays.find((d) => d.id === id);
    if (!current) throw new AppError('not_found', 'not_found');
    const next: AdminCourseDayRow = { ...current, ...patch };
    // Mirrors admin_course_days_workout_required.
    if (!['workout', 'test', 'benchmark'].includes(next.kind)) next.customWorkoutId = null;
    db.adminCourseDays = db.adminCourseDays.map((d) => (d.id === id ? next : d));
    writeDb(db);
    return next;
  });
}

export async function deleteCourseDay(id: string): Promise<void> {
  return run(() => {
    requireDemoUser();
    const db = readDb();
    db.adminCourseDays = db.adminCourseDays.filter((d) => d.id !== id);
    writeDb(db);
  });
}

export async function reorderCourseDays(
  days: readonly { id: string; sortOrder: number; week: number; day: number }[],
): Promise<void> {
  return run(() => {
    requireDemoUser();
    const db = readDb();
    const byId = new Map(days.map((d) => [d.id, d]));
    db.adminCourseDays = db.adminCourseDays.map((d) => {
      const patch = byId.get(d.id);
      return patch ? { ...d, sortOrder: patch.sortOrder, week: patch.week, day: patch.day } : d;
    });
    writeDb(db);
  });
}

export async function listPublishedCourses(): Promise<AdminCourseBundle[]> {
  return run(() => {
    const db = readDb();
    return db.adminCourses
      .filter((c) => c.status === 'published')
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .map((c) => bundleFor(db, c));
  });
}

export async function uploadMedia(_bucket: string, _path: string, _file: Blob): Promise<string> {
  throw new AppError('forbidden', 'demo_read_only');
}

export async function deleteMedia(_ref: string): Promise<void> {
  throw new AppError('forbidden', 'demo_read_only');
}
