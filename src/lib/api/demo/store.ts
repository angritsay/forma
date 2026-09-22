/**
 * Demo backend storage: a versioned localStorage database in the `forma.demo.*` namespace.
 *
 * Rows are held in exactly the shapes `src/lib/api/mappers.ts` converts from (`DbProfile`,
 * `DbWorkoutSession`, …), so the demo backend feeds the same mappers as PostgREST does and the
 * domain types keep a single definition. Nothing here talks to the network.
 *
 * Everything in this file is browser-local, invented and clearly labelled demo data: display
 * names and points for the seeded leaderboard, `@example.com` purchases for the admin screen and
 * a couple of weeks of step logs. None of it may ever be read by the marketing site.
 *
 * Pure by construction: every entry point takes the storage it works on, so the unit tests run in
 * node against an in-memory storage.
 */
import { addDays, toLocalDateIso, weekStart } from '@/lib/util/dates';
import { AppError } from '../errors';
import { toNumberOr } from '../mappers';
import type {
  DbBenchmark,
  DbCoachBooking,
  DbCourseState,
  DbLeaderboardRow,
  DbProfile,
  DbPurchase,
  DbSubscriptionRow,
  DbTotals,
  DbWorkoutSession,
} from '../mappers';
import type {
  AdminCourseDayRow,
  AdminCourseRow,
  CustomWorkoutRow,
  ExerciseCatalogRow,
  LeaderboardPeriod,
  MarathonAdjustmentRow,
  MarathonMemberRow,
  MarathonRow,
  MarathonSubmissionRow,
  MarathonTaskRow,
  MarathonTeamRow,
  PurchaseStatus,
} from '../types';
import { seedMarathon } from './marathonSeed';

// --- storage ----------------------------------------------------------------

export interface StorageLike {
  getItem: (key: string) => string | null;
  setItem: (key: string, value: string) => void;
  removeItem: (key: string) => void;
}

export const DEMO_DB_KEY = 'forma.demo.db';
export const DEMO_AUTH_KEY = 'forma.demo.auth';
/** Bumped when the row shapes change; a stored database of another version is discarded. */
export const DEMO_SCHEMA_VERSION = 6;

/** In-memory storage used when `localStorage` is unavailable (SSR, tests, private mode). */
export function memoryStorage(): StorageLike {
  const map = new Map<string, string>();
  return {
    getItem: (k) => map.get(k) ?? null,
    setItem: (k, v) => void map.set(k, v),
    removeItem: (k) => void map.delete(k),
  };
}

const fallback = memoryStorage();

export function defaultStorage(): StorageLike {
  try {
    return typeof localStorage !== 'undefined' ? localStorage : fallback;
  } catch {
    /* Storage blocked: the demo still works for the life of the page. */
    return fallback;
  }
}

// --- database ---------------------------------------------------------------

/** One invented athlete on the seeded leaderboard. Points are static demo numbers. */
export interface DemoRival {
  userId: string;
  displayName: string;
  avatarSeed: string;
  /** All-time workout points per course id. */
  allByCourse: Record<string, number>;
  /** Workout points earned "this week", per course id. */
  weekByCourse: Record<string, number>;
  /** Step points; counted only on the global board, like `get_leaderboard` does. */
}

/** A `coach_bookings` row as the demo holds it: the view's columns plus the email it is filed under. */
export interface DemoCoachBooking extends DbCoachBooking {
  email: string;
}

export interface DemoDb {
  version: number;
  profiles: DbProfile[];
  purchases: DbPurchase[];
  subscriptions: DbSubscriptionRow[];
  /*
   * Bookings carry the email the row is filed under, exactly as the table does, so the demo
   * backend has to do the same "only my own" filtering the RLS policy does in Postgres.
   */
  coachBookings: DemoCoachBooking[];
  courseStates: DbCourseState[];
  sessions: DbWorkoutSession[];
  benchmarks: DbBenchmark[];
  rivals: DemoRival[];
  /*
   * The coach's tools. Held as the domain rows the API layer returns rather than as database rows,
   * because unlike the tables above these have no PostgREST shape worth mirroring — the demo
   * backend is the only thing that ever writes them.
   */
  exercises: ExerciseCatalogRow[];
  customWorkouts: CustomWorkoutRow[];
  adminCourses: AdminCourseRow[];
  adminCourseDays: AdminCourseDayRow[];
  /* The marathon format. Seeded mid-flight with the demo account's first sign-in. */
  marathons: MarathonRow[];
  marathonTeams: MarathonTeamRow[];
  marathonMembers: MarathonMemberRow[];
  marathonTasks: MarathonTaskRow[];
  /** Who each task went to; no row for a task means everyone. */
  marathonTaskTargets: { taskId: string; teamId: string | null; memberId: string | null }[];
  marathonSubmissions: MarathonSubmissionRow[];
  marathonAdjustments: MarathonAdjustmentRow[];
  /** Кого тренер объявил победителем недели (0028). Одна строка на (круг, неделю). */
  marathonWinners: DemoWinner[];
}

/** Демо-двойник строки `marathon_winners`. */
export interface DemoWinner {
  marathonId: string;
  week: number;
  memberId: string;
  note: string | null;
  announcedAt: string;
}

export interface DemoAuthState {
  /** Signed-in user, or null. */
  userId: string | null;
  email: string | null;
  /** Email the last code was issued for. */
  pendingEmail: string | null;
  pendingCode: string | null;
}

export const EMPTY_AUTH: DemoAuthState = {
  userId: null,
  email: null,
  pendingEmail: null,
  pendingCode: null,
};

// --- seed data --------------------------------------------------------------

/** Courses the demo account owns. The other three stay locked so "get access" is testable. */
export const DEMO_ENTITLED_COURSES: readonly string[] = ['start', 'engine'];

/** Invented athletes for the leaderboard. Names and points exist only inside the demo store. */
const SEED_RIVALS: readonly DemoRival[] = [
  {
    userId: 'demo-rival-01',
    displayName: 'Аня К.',
    avatarSeed: 'anya-k',
    allByCourse: { start: 1840, engine: 2260 },
    weekByCourse: { start: 180, engine: 420 },
  },
  {
    userId: 'demo-rival-02',
    displayName: 'Marek',
    avatarSeed: 'marek',
    allByCourse: { engine: 3100, athlete: 980 },
    weekByCourse: { engine: 360, athlete: 120 },
  },
  {
    userId: 'demo-rival-03',
    displayName: 'Динара',
    avatarSeed: 'dinara',
    allByCourse: { start: 2400, dumbbells: 1450 },
    weekByCourse: { start: 240, dumbbells: 300 },
  },
  {
    userId: 'demo-rival-04',
    displayName: 'Pavel S.',
    avatarSeed: 'pavel-s',
    allByCourse: { kettlebell: 2780 },
    weekByCourse: { kettlebell: 480 },
  },
  {
    userId: 'demo-rival-05',
    displayName: 'Лена',
    avatarSeed: 'lena',
    allByCourse: { start: 1120, engine: 640 },
    weekByCourse: { start: 120, engine: 60 },
  },
  {
    userId: 'demo-rival-06',
    displayName: 'Ivan',
    avatarSeed: 'ivan',
    allByCourse: { dumbbells: 3420, athlete: 1560 },
    weekByCourse: { dumbbells: 300, athlete: 180 },
  },
  {
    userId: 'demo-rival-07',
    displayName: 'Настя',
    avatarSeed: 'nastya',
    allByCourse: { start: 860 },
    weekByCourse: { start: 300 },
  },
  {
    userId: 'demo-rival-08',
    displayName: 'Тимур',
    avatarSeed: 'timur',
    allByCourse: { engine: 1980, kettlebell: 1240 },
    weekByCourse: { engine: 240, kettlebell: 60 },
  },
  {
    userId: 'demo-rival-09',
    displayName: 'Olga',
    avatarSeed: 'olga',
    allByCourse: { start: 520, engine: 380 },
    weekByCourse: { start: 60, engine: 120 },
  },
  {
    userId: 'demo-rival-10',
    displayName: 'Рома',
    avatarSeed: 'roma',
    allByCourse: { athlete: 4260 },
    weekByCourse: { athlete: 540 },
  },
  {
    userId: 'demo-rival-11',
    displayName: 'Kirill',
    avatarSeed: 'kirill',
    allByCourse: { dumbbells: 1680, kettlebell: 900 },
    weekByCourse: { dumbbells: 120, kettlebell: 240 },
  },
  {
    userId: 'demo-rival-12',
    displayName: 'Даша',
    avatarSeed: 'dasha',
    allByCourse: { start: 1340, engine: 1520 },
    weekByCourse: { start: 360, engine: 180 },
  },
];

/**
 * Invented purchases of other people, so the admin screen has a pending row to activate and an
 * active row to refund. `@example.com` is the reserved documentation domain — these can never
 * collide with a real customer.
 */
const SEED_PURCHASES: readonly { email: string; courseId: string; status: PurchaseStatus }[] = [
  { email: 'anna.demo@example.com', courseId: 'dumbbells', status: 'pending' },
  { email: 'marek.demo@example.com', courseId: 'engine', status: 'active' },
  { email: 'dinara.demo@example.com', courseId: 'kettlebell', status: 'pending' },
  { email: 'pavel.demo@example.com', courseId: 'athlete', status: 'refunded' },
];

/** Other people's subscriptions, for the admin tab: one live annual, one lapsed monthly. */
const SEED_SUBSCRIPTIONS: readonly {
  email: string;
  plan: 'monthly' | 'annual';
  status: 'pending' | 'active' | 'cancelled';
  /** Days from "now" to the end of access; negative = already over. */
  expiresInDays: number | null;
}[] = [
  { email: 'lena.demo@example.com', plan: 'annual', status: 'active', expiresInDays: 300 },
  { email: 'igor.demo@example.com', plan: 'monthly', status: 'cancelled', expiresInDays: -12 },
  { email: 'olga.demo@example.com', plan: 'monthly', status: 'pending', expiresInDays: null },
];

// --- helpers ----------------------------------------------------------------

let counter = 0;

/** Unique enough for one browser; demo ids are never joined with anything server-side. */
export function demoId(prefix: string): string {
  counter += 1;
  const rnd = Math.random().toString(36).slice(2, 10);
  return `${prefix}_${Date.now().toString(36)}${counter.toString(36)}${rnd}`;
}

export function nowIso(): string {
  return new Date().toISOString();
}

export function normalizeDemoEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function emptyDb(): DemoDb {
  return {
    version: DEMO_SCHEMA_VERSION,
    profiles: [],
    purchases: [],
    subscriptions: [],
    coachBookings: [],
    courseStates: [],
    sessions: [],
    benchmarks: [],
    rivals: SEED_RIVALS.map((r) => ({ ...r })),
    exercises: [],
    customWorkouts: [],
    adminCourses: [],
    adminCourseDays: [],
    marathons: [],
    marathonTeams: [],
    marathonMembers: [],
    marathonTasks: [],
    marathonTaskTargets: [],
    marathonSubmissions: [],
    marathonAdjustments: [],
    marathonWinners: [],
  };
}

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}

function asRows<T>(v: unknown): T[] {
  return Array.isArray(v) ? (v as T[]) : [];
}

/** Read the database; anything missing, corrupt or from another schema version starts fresh. */
export function readDb(storage: StorageLike = defaultStorage()): DemoDb {
  let raw: string | null = null;
  try {
    raw = storage.getItem(DEMO_DB_KEY);
  } catch {
    /* ignore */
  }
  if (!raw) return emptyDb();
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!isRecord(parsed) || parsed.version !== DEMO_SCHEMA_VERSION) return emptyDb();
    const rivals = asRows<DemoRival>(parsed.rivals);
    return {
      version: DEMO_SCHEMA_VERSION,
      profiles: asRows<DbProfile>(parsed.profiles),
      purchases: asRows<DbPurchase>(parsed.purchases),
      subscriptions: asRows<DbSubscriptionRow>(parsed.subscriptions),
      coachBookings: asRows<DemoCoachBooking>(parsed.coachBookings),
      courseStates: asRows<DbCourseState>(parsed.courseStates),
      sessions: asRows<DbWorkoutSession>(parsed.sessions),
      benchmarks: asRows<DbBenchmark>(parsed.benchmarks),
      rivals: rivals.length > 0 ? rivals : SEED_RIVALS.map((r) => ({ ...r })),
      exercises: asRows<ExerciseCatalogRow>(parsed.exercises),
      customWorkouts: asRows<CustomWorkoutRow>(parsed.customWorkouts),
      adminCourses: asRows<AdminCourseRow>(parsed.adminCourses),
      adminCourseDays: asRows<AdminCourseDayRow>(parsed.adminCourseDays),
      marathons: asRows<MarathonRow>(parsed.marathons),
      marathonTeams: asRows<MarathonTeamRow>(parsed.marathonTeams),
      marathonMembers: asRows<MarathonMemberRow>(parsed.marathonMembers),
      marathonTasks: asRows<MarathonTaskRow>(parsed.marathonTasks),
      marathonTaskTargets: asRows<{
        taskId: string;
        teamId: string | null;
        memberId: string | null;
      }>(parsed.marathonTaskTargets),
      marathonSubmissions: asRows<MarathonSubmissionRow>(parsed.marathonSubmissions),
      marathonAdjustments: asRows<MarathonAdjustmentRow>(parsed.marathonAdjustments),
      marathonWinners: asRows<DemoWinner>(parsed.marathonWinners),
    };
  } catch {
    return emptyDb();
  }
}

export function writeDb(db: DemoDb, storage: StorageLike = defaultStorage()): void {
  try {
    storage.setItem(DEMO_DB_KEY, JSON.stringify(db));
  } catch {
    /* Quota or private mode: the demo keeps working from the value we return. */
  }
}

/** Read → change → write in one step; the callback returns whatever the caller needs. */
export function mutateDb<T>(fn: (db: DemoDb) => T, storage: StorageLike = defaultStorage()): T {
  const db = readDb(storage);
  const result = fn(db);
  writeDb(db, storage);
  return result;
}

export function readAuth(storage: StorageLike = defaultStorage()): DemoAuthState {
  let raw: string | null = null;
  try {
    raw = storage.getItem(DEMO_AUTH_KEY);
  } catch {
    /* ignore */
  }
  if (!raw) return { ...EMPTY_AUTH };
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!isRecord(parsed)) return { ...EMPTY_AUTH };
    const str = (v: unknown): string | null => (typeof v === 'string' && v ? v : null);
    return {
      userId: str(parsed.userId),
      email: str(parsed.email),
      pendingEmail: str(parsed.pendingEmail),
      pendingCode: str(parsed.pendingCode),
    };
  } catch {
    return { ...EMPTY_AUTH };
  }
}

export function writeAuth(auth: DemoAuthState, storage: StorageLike = defaultStorage()): void {
  try {
    storage.setItem(DEMO_AUTH_KEY, JSON.stringify(auth));
  } catch {
    /* ignore */
  }
}

/** Wipe the whole demo database and the demo session. */
export function clearDemoStore(storage: StorageLike = defaultStorage()): void {
  try {
    storage.removeItem(DEMO_DB_KEY);
    storage.removeItem(DEMO_AUTH_KEY);
  } catch {
    /* ignore */
  }
}

// --- seeding ----------------------------------------------------------------

function seedSubscriptions(createdAt: string): DbSubscriptionRow[] {
  const base = Date.parse(createdAt);
  return SEED_SUBSCRIPTIONS.map((x) => ({
    id: demoId('sub'),
    email: x.email,
    plan: x.plan,
    status: x.status,
    started_at: x.status === 'pending' ? null : createdAt,
    expires_at:
      x.expiresInDays === null ? null : new Date(base + x.expiresInDays * 86_400_000).toISOString(),
    source: 'demo',
    provider_ref: null,
    locale: 'ru',
    note: 'Demo data',
    created_at: createdAt,
    updated_at: createdAt,
  }));
}

/**
 * The demo session with the coach: tomorrow at 09:00 in whatever zone this browser is in.
 *
 * Tomorrow morning is deliberate — it is the case the countdown is easiest to get wrong
 * («завтра в 9:00», not «через 14 часов»), so the demo build shows the interesting branch rather
 * than a trivial one. The join link points at example.com: it is a placeholder, and a link that
 * looked like a real Zoom room would be an invitation to click it.
 */
function seedCoachBooking(email: string, today: string): DemoCoachBooking {
  const startsAt = new Date(`${addDays(today, 1)}T09:00:00`);
  const endsAt = new Date(startsAt.getTime() + 60 * 60_000);
  return {
    id: demoId('booking'),
    email,
    starts_at: startsAt.toISOString(),
    ends_at: endsAt.toISOString(),
    timezone: null,
    join_url: 'https://example.com/j/forma-demo',
    location_kind: 'zoom_conference',
    location_text: null,
    cancel_url: 'https://example.com/cancellations/forma-demo',
    reschedule_url: 'https://example.com/reschedulings/forma-demo',
    status: 'active',
    event_name: 'Персональная тренировка',
  };
}

function seedPurchases(email: string, createdAt: string): DbPurchase[] {
  const own: DbPurchase[] = DEMO_ENTITLED_COURSES.map((courseId) => ({
    id: demoId('pur'),
    email,
    course_id: courseId,
    status: 'active',
    source: 'demo',
    locale: 'ru',
    note: 'Demo data',
    created_at: createdAt,
    activated_at: createdAt,
    updated_at: createdAt,
  }));
  const others: DbPurchase[] = SEED_PURCHASES.map((p) => ({
    id: demoId('pur'),
    email: p.email,
    course_id: p.courseId,
    status: p.status,
    source: 'demo',
    locale: 'ru',
    note: 'Demo data',
    created_at: createdAt,
    activated_at: p.status === 'active' ? createdAt : null,
    updated_at: createdAt,
  }));
  return [...own, ...others];
}

/**
 * The freshly seeded demo account: no training profile yet (the onboarding wizard is part of the
 * walkthrough), no workout history, two owned courses and two weeks of steps.
 */
export function seedUser(db: DemoDb, email: string, today = toLocalDateIso()): DbProfile {
  const createdAt = nowIso();
  const userId = demoId('demo_user');
  const profile: DbProfile = {
    id: userId,
    email,
    display_name: null,
    avatar_seed: demoId('seed').slice(-8),
    locale: 'ru',
    training_profile: null,
    fitness_index: null,
    fitness_level: null,
    onboarded_at: null,
    created_at: createdAt,
    updated_at: createdAt,
  };
  db.profiles.push(profile);
  if (!db.coachBookings.some((b) => b.email === email)) {
    db.coachBookings.push(seedCoachBooking(email, today));
  }
  const knownSubs = new Set(db.subscriptions.map((x) => x.email));
  for (const sub of seedSubscriptions(createdAt)) {
    if (knownSubs.has(sub.email)) continue;
    knownSubs.add(sub.email);
    db.subscriptions.push(sub);
  }
  const known = new Set(db.purchases.map((p) => `${p.email} ${p.course_id}`));
  for (const purchase of seedPurchases(email, createdAt)) {
    const key = `${purchase.email} ${purchase.course_id}`;
    if (known.has(key)) continue;
    known.add(key);
    db.purchases.push(purchase);
  }
  // The marathon is seeded once, for the first account the demo sees: a second one joins the run
  // that already exists rather than starting a parallel one nobody else is in.
  if (db.marathons.length === 0) {
    const seed = seedMarathon(email, today);
    db.marathons.push(seed.marathon);
    db.marathonTeams.push(...seed.teams);
    db.marathonMembers.push(...seed.members);
    db.marathonTasks.push(...seed.tasks);
    db.marathonTaskTargets.push(...seed.targets);
    db.marathonSubmissions.push(...seed.submissions);
    db.marathonAdjustments.push(...seed.adjustments);
  }
  return profile;
}

export function findProfileByEmail(db: DemoDb, email: string): DbProfile | null {
  return db.profiles.find((p) => p.email === email) ?? null;
}

export function findProfileById(db: DemoDb, userId: string): DbProfile | null {
  return db.profiles.find((p) => p.id === userId) ?? null;
}

/** The profile for this email, seeding a whole demo account the first time it is seen. */
export function ensureUser(db: DemoDb, email: string, today = toLocalDateIso()): DbProfile {
  return findProfileByEmail(db, email) ?? seedUser(db, email, today);
}

// --- auth -------------------------------------------------------------------

const CODE_RE = /^\d{6}$/;

export function generateDemoCode(): string {
  return String(Math.floor(Math.random() * 900_000) + 100_000);
}

/**
 * Issue a code for an email and remember it. Returns the code so the auth screen can print it —
 * in demo mode there is no inbox to check.
 */
export function requestDemoCode(email: string, storage: StorageLike = defaultStorage()): string {
  const clean = normalizeDemoEmail(email);
  const code = generateDemoCode();
  const auth = readAuth(storage);
  writeAuth({ ...auth, pendingEmail: clean, pendingCode: code }, storage);
  return code;
}

/** The code currently on offer, or null when none was requested. */
export function pendingDemoCode(storage: StorageLike = defaultStorage()): string | null {
  return readAuth(storage).pendingCode;
}

export interface DemoUser {
  id: string;
  email: string;
}

/**
 * Check a code and sign the user in. A wrong code, a code for another email or no pending code
 * at all fail the same way the Supabase OTP flow does, so the error state stays testable.
 */
export function verifyDemoCode(
  email: string,
  token: string,
  storage: StorageLike = defaultStorage(),
  today = toLocalDateIso(),
): DemoUser {
  const clean = normalizeDemoEmail(email);
  const code = token.replace(/\D/g, '');
  const auth = readAuth(storage);
  if (!CODE_RE.test(code) || auth.pendingCode === null || auth.pendingEmail !== clean) {
    throw new AppError('validation', 'invalid_code');
  }
  if (code !== auth.pendingCode) throw new AppError('validation', 'invalid_code');

  const profile = mutateDb((db) => ensureUser(db, clean, today), storage);
  writeAuth({ userId: profile.id, email: clean, pendingEmail: null, pendingCode: null }, storage);
  return { id: profile.id, email: clean };
}

export function signOutDemo(storage: StorageLike = defaultStorage()): void {
  writeAuth({ ...EMPTY_AUTH }, storage);
}

/** The signed-in demo user, or null. A user whose rows were wiped counts as signed out. */
export function currentDemoUser(storage: StorageLike = defaultStorage()): DemoUser | null {
  const auth = readAuth(storage);
  if (!auth.userId || !auth.email) return null;
  const db = readDb(storage);
  if (!findProfileById(db, auth.userId)) return null;
  return { id: auth.userId, email: auth.email };
}

// --- derived reads ----------------------------------------------------------

const MAX_SESSION_POINTS = 375;

function clamp(value: number, max: number): number {
  return Math.min(Math.max(value, 0), max);
}

/** All-time totals for the home screen, mirroring `get_my_totals`. */
export function demoTotals(db: DemoDb, userId: string): DbTotals {
  let points = 0;
  let workouts = 0;
  let seconds = 0;
  for (const s of db.sessions) {
    if (s.user_id !== userId || !s.completed_at) continue;
    points += toNumberOr(s.points, 0);
    workouts += 1;
    seconds += toNumberOr(s.duration_sec, 0);
  }
  return { points, workouts, minutes: Math.floor(seconds / 60) };
}

function rivalPoints(
  rival: DemoRival,
  period: LeaderboardPeriod,
  courseId: string | undefined,
): number {
  const byCourse = period === 'week' ? rival.weekByCourse : rival.allByCourse;
  if (courseId !== undefined) return byCourse[courseId] ?? 0;
  return Object.values(byCourse).reduce((sum, n) => sum + n, 0);
}

function myPoints(
  db: DemoDb,
  userId: string,
  period: LeaderboardPeriod,
  courseId: string | undefined,
  today: string,
): number {
  const from = weekStart(today);
  let points = 0;
  for (const s of db.sessions) {
    if (s.user_id !== userId || !s.completed_at) continue;
    if (courseId !== undefined && s.course_id !== courseId) continue;
    if (period === 'week' && s.local_date < from) continue;
    points += clamp(toNumberOr(s.points, 0), MAX_SESSION_POINTS);
  }
  return points;
}

/**
 * Seeded rivals plus the live demo user, ranked exactly like `get_leaderboard`: rows without
 * points are dropped, the caller's own row is always present — pinned after the top when it did
 * not make the cut.
 */
export function demoLeaderboard(
  db: DemoDb,
  userId: string,
  period: LeaderboardPeriod,
  courseId: string | undefined,
  limit: number,
  today = toLocalDateIso(),
): DbLeaderboardRow[] {
  const me = findProfileById(db, userId);
  const mine = myPoints(db, userId, period, courseId, today);

  interface Entry {
    userId: string;
    displayName: string | null;
    avatarSeed: string | null;
    points: number;
    isMe: boolean;
  }

  const entries: Entry[] = db.rivals
    .map((r) => ({
      userId: r.userId,
      displayName: r.displayName,
      avatarSeed: r.avatarSeed,
      points: rivalPoints(r, period, courseId),
      isMe: false,
    }))
    .filter((e) => e.points > 0);

  const meEntry: Entry = {
    userId,
    displayName: me?.display_name ?? null,
    avatarSeed: me?.avatar_seed ?? null,
    points: mine,
    isMe: true,
  };
  if (mine > 0) entries.push(meEntry);

  entries.sort((a, b) => b.points - a.points || a.userId.localeCompare(b.userId));

  const ranked = entries.map((e, i) => ({ ...e, rank: i + 1 }));
  const rows = ranked.slice(0, Math.max(1, limit));
  if (!rows.some((r) => r.isMe)) {
    // Own row keeps its real rank, or lands last when the athlete has no points yet.
    const mineRanked = ranked.find((r) => r.isMe);
    rows.push(mineRanked ?? { ...meEntry, rank: ranked.length + 1 });
  }
  return rows.map((r) => ({
    user_id: r.userId,
    display_name: r.displayName,
    avatar_seed: r.avatarSeed,
    points: r.points,
    rank: r.rank,
    is_me: r.isMe,
  }));
}
