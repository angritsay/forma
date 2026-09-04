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
import { stepsPoints } from '@/lib/training/streak';
import { addDays, toLocalDateIso, weekStart } from '@/lib/util/dates';
import { AppError } from '../errors';
import { toNumberOr } from '../mappers';
import type {
  DbBenchmark,
  DbCourseState,
  DbDailyLog,
  DbLeaderboardRow,
  DbProfile,
  DbPurchase,
  DbTotals,
  DbWorkoutSession,
} from '../mappers';
import type { LeaderboardPeriod, PurchaseStatus } from '../types';

// --- storage ----------------------------------------------------------------

export interface StorageLike {
  getItem: (key: string) => string | null;
  setItem: (key: string, value: string) => void;
  removeItem: (key: string) => void;
}

export const DEMO_DB_KEY = 'forma.demo.db';
export const DEMO_AUTH_KEY = 'forma.demo.auth';
/** Bumped when the row shapes change; a stored database of another version is discarded. */
export const DEMO_SCHEMA_VERSION = 1;

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
  allStepPoints: number;
  weekStepPoints: number;
}

export interface DemoDb {
  version: number;
  profiles: DbProfile[];
  purchases: DbPurchase[];
  courseStates: DbCourseState[];
  sessions: DbWorkoutSession[];
  dailyLogs: DbDailyLog[];
  benchmarks: DbBenchmark[];
  rivals: DemoRival[];
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

/**
 * Seeded step history: [days ago, steps]. Invented numbers, mixing days above the 7 000 goal
 * (they count for the streak) with quieter days, so the streak card, the steps chart and the
 * calendar all have something to show. Today is deliberately left empty — logging it is part of
 * the walkthrough.
 */
const SEED_STEPS: readonly (readonly [number, number])[] = [
  [1, 9240],
  [2, 8130],
  [3, 7460],
  [4, 3180],
  [5, 10420],
  [6, 7910],
  [7, 5240],
  [8, 8680],
  [9, 9930],
  [10, 6120],
  [11, 7350],
  [12, 11040],
  [13, 4870],
  [14, 7020],
];

/** Invented athletes for the leaderboard. Names and points exist only inside the demo store. */
const SEED_RIVALS: readonly DemoRival[] = [
  {
    userId: 'demo-rival-01',
    displayName: 'Аня К.',
    avatarSeed: 'anya-k',
    allByCourse: { start: 1840, engine: 2260 },
    weekByCourse: { start: 180, engine: 420 },
    allStepPoints: 1320,
    weekStepPoints: 150,
  },
  {
    userId: 'demo-rival-02',
    displayName: 'Marek',
    avatarSeed: 'marek',
    allByCourse: { engine: 3100, athlete: 980 },
    weekByCourse: { engine: 360, athlete: 120 },
    allStepPoints: 940,
    weekStepPoints: 90,
  },
  {
    userId: 'demo-rival-03',
    displayName: 'Динара',
    avatarSeed: 'dinara',
    allByCourse: { start: 2400, dumbbells: 1450 },
    weekByCourse: { start: 240, dumbbells: 300 },
    allStepPoints: 1610,
    weekStepPoints: 210,
  },
  {
    userId: 'demo-rival-04',
    displayName: 'Pavel S.',
    avatarSeed: 'pavel-s',
    allByCourse: { kettlebell: 2780 },
    weekByCourse: { kettlebell: 480 },
    allStepPoints: 720,
    weekStepPoints: 60,
  },
  {
    userId: 'demo-rival-05',
    displayName: 'Лена',
    avatarSeed: 'lena',
    allByCourse: { start: 1120, engine: 640 },
    weekByCourse: { start: 120, engine: 60 },
    allStepPoints: 1880,
    weekStepPoints: 240,
  },
  {
    userId: 'demo-rival-06',
    displayName: 'Ivan',
    avatarSeed: 'ivan',
    allByCourse: { dumbbells: 3420, athlete: 1560 },
    weekByCourse: { dumbbells: 300, athlete: 180 },
    allStepPoints: 460,
    weekStepPoints: 30,
  },
  {
    userId: 'demo-rival-07',
    displayName: 'Настя',
    avatarSeed: 'nastya',
    allByCourse: { start: 860 },
    weekByCourse: { start: 300 },
    allStepPoints: 2140,
    weekStepPoints: 270,
  },
  {
    userId: 'demo-rival-08',
    displayName: 'Тимур',
    avatarSeed: 'timur',
    allByCourse: { engine: 1980, kettlebell: 1240 },
    weekByCourse: { engine: 240, kettlebell: 60 },
    allStepPoints: 1040,
    weekStepPoints: 120,
  },
  {
    userId: 'demo-rival-09',
    displayName: 'Olga',
    avatarSeed: 'olga',
    allByCourse: { start: 520, engine: 380 },
    weekByCourse: { start: 60, engine: 120 },
    allStepPoints: 1450,
    weekStepPoints: 180,
  },
  {
    userId: 'demo-rival-10',
    displayName: 'Рома',
    avatarSeed: 'roma',
    allByCourse: { athlete: 4260 },
    weekByCourse: { athlete: 540 },
    allStepPoints: 380,
    weekStepPoints: 30,
  },
  {
    userId: 'demo-rival-11',
    displayName: 'Kirill',
    avatarSeed: 'kirill',
    allByCourse: { dumbbells: 1680, kettlebell: 900 },
    weekByCourse: { dumbbells: 120, kettlebell: 240 },
    allStepPoints: 1180,
    weekStepPoints: 60,
  },
  {
    userId: 'demo-rival-12',
    displayName: 'Даша',
    avatarSeed: 'dasha',
    allByCourse: { start: 1340, engine: 1520 },
    weekByCourse: { start: 360, engine: 180 },
    allStepPoints: 1760,
    weekStepPoints: 210,
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
    courseStates: [],
    sessions: [],
    dailyLogs: [],
    benchmarks: [],
    rivals: SEED_RIVALS.map((r) => ({ ...r })),
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
      courseStates: asRows<DbCourseState>(parsed.courseStates),
      sessions: asRows<DbWorkoutSession>(parsed.sessions),
      dailyLogs: asRows<DbDailyLog>(parsed.dailyLogs),
      benchmarks: asRows<DbBenchmark>(parsed.benchmarks),
      rivals: rivals.length > 0 ? rivals : SEED_RIVALS.map((r) => ({ ...r })),
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

function seedDailyLogs(userId: string, today: string): DbDailyLog[] {
  const updatedAt = nowIso();
  return SEED_STEPS.map(([daysAgo, steps]) => ({
    user_id: userId,
    local_date: addDays(today, -daysAgo),
    steps,
    // Same formula the daily_logs_set_points trigger applies server-side.
    points: stepsPoints(steps),
    note: null,
    updated_at: updatedAt,
  }));
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
  db.dailyLogs.push(...seedDailyLogs(userId, today));
  const known = new Set(db.purchases.map((p) => `${p.email} ${p.course_id}`));
  for (const purchase of seedPurchases(email, createdAt)) {
    const key = `${purchase.email} ${purchase.course_id}`;
    if (known.has(key)) continue;
    known.add(key);
    db.purchases.push(purchase);
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
const MAX_STEP_POINTS = 60;

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
  for (const d of db.dailyLogs) {
    if (d.user_id !== userId) continue;
    points += toNumberOr(d.points, 0);
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
  const workouts = Object.values(byCourse).reduce((sum, n) => sum + n, 0);
  return workouts + (period === 'week' ? rival.weekStepPoints : rival.allStepPoints);
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
  if (courseId === undefined) {
    for (const d of db.dailyLogs) {
      if (d.user_id !== userId) continue;
      if (period === 'week' && d.local_date < from) continue;
      points += clamp(toNumberOr(d.points, 0), MAX_STEP_POINTS);
    }
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
