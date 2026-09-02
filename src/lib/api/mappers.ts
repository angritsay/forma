/**
 * snake_case database rows ↔ camelCase domain types. Pure, unit-tested.
 * PostgREST returns `numeric`/`bigint` as JSON numbers, but the mappers also accept strings so
 * a change of serialization settings can never break the app.
 */
import type { Locale } from '@/content/schema';
import type {
  DifficultyChoice,
  ExerciseResult,
  Feeling,
  PrescribedWorkout,
  UserTrainingProfile,
} from '@/lib/training/types';
import type {
  BenchmarkRow,
  BenchmarkSeries,
  CompleteSessionInput,
  CourseStatePatch,
  CourseStateRow,
  DailyLogRow,
  Entitlement,
  LeaderboardRow,
  MyTotals,
  Profile,
  ProfilePatch,
  PurchaseRow,
  PurchaseStatus,
  StartSessionInput,
  WorkoutSessionRow,
} from './types';

type Num = number | string | null | undefined;

// --- raw row shapes ---------------------------------------------------------

export interface DbProfile {
  id: string;
  email: string;
  display_name: string | null;
  avatar_seed: string;
  locale: string;
  training_profile: unknown;
  fitness_index: Num;
  fitness_level: Num;
  onboarded_at: string | null;
  created_at: string;
  updated_at: string;
}

/** Columns the client may write (see column-level grant in 0001_init.sql). */
export interface DbProfilePatch {
  display_name?: string | null;
  avatar_seed?: string;
  locale?: Locale;
  training_profile?: UserTrainingProfile | null;
  fitness_index?: number | null;
  fitness_level?: number | null;
  onboarded_at?: string | null;
}

export interface DbEntitlement {
  course_id: string;
  activated_at: string | null;
}

export interface DbPurchase {
  id: string;
  email: string;
  course_id: string;
  status: string;
  source: string | null;
  locale: string | null;
  note: string | null;
  created_at: string;
  activated_at: string | null;
  updated_at: string;
}

export interface DbCourseState {
  user_id: string;
  course_id: string;
  scale: Num;
  current_node_index: Num;
  completed_node_ids: string[] | null;
  updated_at: string;
}

export interface DbCourseStatePatch {
  scale?: number;
  current_node_index?: number;
  completed_node_ids?: string[];
}

export interface DbWorkoutSession {
  id: string;
  user_id: string;
  course_id: string;
  node_id: string;
  workout_id: string;
  difficulty: string | null;
  scale: Num;
  prescribed: unknown;
  results: unknown;
  rpe: Num;
  feeling: string | null;
  completion: Num;
  points: Num;
  duration_sec: Num;
  calories: Num;
  started_at: string;
  completed_at: string | null;
  local_date: string;
}

export interface DbWorkoutSessionInsert {
  user_id: string;
  course_id: string;
  node_id: string;
  workout_id: string;
  difficulty: DifficultyChoice;
  scale: number;
  prescribed: PrescribedWorkout;
  local_date: string;
}

export interface DbWorkoutSessionComplete {
  results: ExerciseResult[];
  rpe: number;
  feeling: Feeling;
  completion: number;
  points: number;
  duration_sec: number;
  calories: number;
  completed_at: string;
}

export interface DbDailyLog {
  user_id: string;
  local_date: string;
  steps: Num;
  points: Num;
  note: string | null;
  updated_at: string;
}

export interface DbBenchmark {
  id: string;
  user_id: string;
  key: string;
  value: Num;
  unit: string;
  recorded_at: string;
}

export interface DbLeaderboardRow {
  user_id: string;
  display_name: string | null;
  avatar_seed: string | null;
  points: Num;
  rank: Num;
  is_me: boolean | null;
}

export interface DbTotals {
  points: Num;
  workouts: Num;
  minutes: Num;
}

// --- primitives -------------------------------------------------------------

export function toNumber(v: Num): number | null {
  if (v === null || v === undefined || v === '') return null;
  const n = typeof v === 'number' ? v : Number(v);
  return Number.isFinite(n) ? n : null;
}

export function toNumberOr(v: Num, fallback: number): number {
  return toNumber(v) ?? fallback;
}

export function asLocale(v: unknown): Locale {
  return v === 'en' ? 'en' : 'ru';
}

export function asFitnessLevel(v: Num): 1 | 2 | 3 | null {
  const n = toNumber(v);
  return n === 1 || n === 2 || n === 3 ? n : null;
}

export function asDifficulty(v: unknown): DifficultyChoice | null {
  return v === 'easier' || v === 'normal' || v === 'harder' ? v : null;
}

export function asFeeling(v: unknown): Feeling | null {
  return v === 'great' || v === 'ok' || v === 'hard' || v === 'pain' ? v : null;
}

export function asPurchaseStatus(v: unknown): PurchaseStatus {
  return v === 'active' || v === 'refunded' ? v : 'pending';
}

function asObject<T extends object>(v: unknown): T | null {
  return typeof v === 'object' && v !== null && !Array.isArray(v) ? (v as T) : null;
}

function asArray<T>(v: unknown): T[] | null {
  return Array.isArray(v) ? (v as T[]) : null;
}

// --- profiles ---------------------------------------------------------------

export function profileFromDb(r: DbProfile): Profile {
  return {
    id: r.id,
    email: r.email,
    displayName: r.display_name ?? null,
    avatarSeed: r.avatar_seed,
    locale: asLocale(r.locale),
    trainingProfile: asObject<UserTrainingProfile>(r.training_profile),
    fitnessIndex: toNumber(r.fitness_index),
    fitnessLevel: asFitnessLevel(r.fitness_level),
    onboardedAt: r.onboarded_at ?? null,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  };
}

/** Keeps only keys that are present (`undefined` = untouched, `null` = clear). */
export function profilePatchToDb(p: ProfilePatch): DbProfilePatch {
  const out: DbProfilePatch = {};
  if (p.displayName !== undefined) out.display_name = p.displayName;
  if (p.avatarSeed !== undefined) out.avatar_seed = p.avatarSeed;
  if (p.locale !== undefined) out.locale = p.locale;
  if (p.trainingProfile !== undefined) out.training_profile = p.trainingProfile;
  if (p.fitnessIndex !== undefined) out.fitness_index = p.fitnessIndex;
  if (p.fitnessLevel !== undefined) out.fitness_level = p.fitnessLevel;
  if (p.onboardedAt !== undefined) out.onboarded_at = p.onboardedAt;
  return out;
}

// --- purchases / entitlements ----------------------------------------------

export function entitlementFromDb(r: DbEntitlement): Entitlement {
  return { courseId: r.course_id, activatedAt: r.activated_at ?? null };
}

export function purchaseFromDb(r: DbPurchase): PurchaseRow {
  return {
    id: r.id,
    email: r.email,
    courseId: r.course_id,
    status: asPurchaseStatus(r.status),
    source: r.source ?? null,
    locale: r.locale ?? null,
    note: r.note ?? null,
    createdAt: r.created_at,
    activatedAt: r.activated_at ?? null,
    updatedAt: r.updated_at,
  };
}

// --- course state -----------------------------------------------------------

export function courseStateFromDb(r: DbCourseState): CourseStateRow {
  return {
    userId: r.user_id,
    courseId: r.course_id,
    scale: toNumberOr(r.scale, 1),
    currentNodeIndex: toNumberOr(r.current_node_index, 0),
    completedNodeIds: r.completed_node_ids ?? [],
    updatedAt: r.updated_at,
  };
}

export function courseStatePatchToDb(p: CourseStatePatch): DbCourseStatePatch {
  const out: DbCourseStatePatch = {};
  if (p.scale !== undefined) out.scale = p.scale;
  if (p.currentNodeIndex !== undefined) out.current_node_index = p.currentNodeIndex;
  if (p.completedNodeIds !== undefined) out.completed_node_ids = p.completedNodeIds;
  return out;
}

// --- sessions ---------------------------------------------------------------

export function sessionFromDb(r: DbWorkoutSession): WorkoutSessionRow {
  return {
    id: r.id,
    userId: r.user_id,
    courseId: r.course_id,
    nodeId: r.node_id,
    workoutId: r.workout_id,
    difficulty: asDifficulty(r.difficulty),
    scale: toNumber(r.scale),
    prescribed: asObject<PrescribedWorkout>(r.prescribed),
    results: asArray<ExerciseResult>(r.results),
    rpe: toNumber(r.rpe),
    feeling: asFeeling(r.feeling),
    completion: toNumber(r.completion),
    points: toNumberOr(r.points, 0),
    durationSec: toNumber(r.duration_sec),
    calories: toNumber(r.calories),
    startedAt: r.started_at,
    completedAt: r.completed_at ?? null,
    localDate: r.local_date,
  };
}

export function startSessionToDb(userId: string, input: StartSessionInput): DbWorkoutSessionInsert {
  return {
    user_id: userId,
    course_id: input.courseId,
    node_id: input.nodeId,
    workout_id: input.workoutId,
    difficulty: input.difficulty,
    scale: input.scale,
    prescribed: input.prescribed,
    local_date: input.localDate,
  };
}

export function completeSessionToDb(patch: CompleteSessionInput): DbWorkoutSessionComplete {
  return {
    results: patch.results,
    rpe: patch.rpe,
    feeling: patch.feeling,
    completion: patch.completion,
    points: patch.points,
    duration_sec: patch.durationSec,
    calories: patch.calories,
    completed_at: patch.completedAt,
  };
}

// --- daily logs -------------------------------------------------------------

export function dailyLogFromDb(r: DbDailyLog): DailyLogRow {
  return {
    userId: r.user_id,
    localDate: r.local_date,
    steps: toNumberOr(r.steps, 0),
    points: toNumberOr(r.points, 0),
    note: r.note ?? null,
    updatedAt: r.updated_at,
  };
}

// --- benchmarks -------------------------------------------------------------

export function benchmarkFromDb(r: DbBenchmark): BenchmarkRow {
  return {
    id: r.id,
    userId: r.user_id,
    key: r.key,
    value: toNumberOr(r.value, 0),
    unit: r.unit,
    recordedAt: r.recorded_at,
  };
}

/** Group by key; each series sorted most-recent-first; series ordered by latest record. */
export function groupBenchmarks(rows: BenchmarkRow[]): BenchmarkSeries[] {
  const byKey = new Map<string, BenchmarkRow[]>();
  for (const row of rows) {
    const list = byKey.get(row.key);
    if (list) list.push(row);
    else byKey.set(row.key, [row]);
  }
  const series: BenchmarkSeries[] = [];
  for (const [key, list] of byKey) {
    const history = [...list].sort((a, b) => b.recordedAt.localeCompare(a.recordedAt));
    const latest = history[0];
    if (latest) series.push({ key, latest, history });
  }
  return series.sort((a, b) => b.latest.recordedAt.localeCompare(a.latest.recordedAt));
}

// --- leaderboard / totals ---------------------------------------------------

export function leaderboardRowFromDb(r: DbLeaderboardRow): LeaderboardRow {
  return {
    userId: r.user_id,
    displayName: r.display_name ?? `Athlete ${r.user_id.slice(0, 4)}`,
    avatarSeed: r.avatar_seed ?? r.user_id.slice(0, 8),
    points: toNumberOr(r.points, 0),
    rank: toNumberOr(r.rank, 0),
    isMe: r.is_me === true,
  };
}

export function totalsFromDb(r: DbTotals): MyTotals {
  return {
    points: toNumberOr(r.points, 0),
    workouts: toNumberOr(r.workouts, 0),
    minutes: toNumberOr(r.minutes, 0),
  };
}

// --- storage refs -----------------------------------------------------------

/** `storage:<bucket>/<path>` → parts; anything else → null. */
export function parseStorageRef(ref: string): { bucket: string; path: string } | null {
  const m = /^storage:([a-z0-9_-]+)\/(.+)$/i.exec(ref.trim());
  if (!m) return null;
  const bucket = m[1];
  const path = m[2]?.replace(/^\/+/, '');
  if (!bucket || !path) return null;
  return { bucket, path };
}
