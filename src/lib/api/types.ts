/**
 * Domain types exposed by the API layer (camelCase).
 * Database rows (snake_case) are converted in mappers.ts; the app never sees raw rows.
 */
import type { Locale } from '@/content/schema';
import type {
  DifficultyChoice,
  ExerciseResult,
  Feeling,
  PrescribedWorkout,
  UserTrainingProfile,
} from '@/lib/training/types';

// --- profiles ---------------------------------------------------------------

export interface Profile {
  id: string;
  email: string;
  displayName: string | null;
  avatarSeed: string;
  locale: Locale;
  trainingProfile: UserTrainingProfile | null;
  fitnessIndex: number | null;
  fitnessLevel: 1 | 2 | 3 | null;
  onboardedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export type ProfilePatch = Partial<
  Pick<
    Profile,
    | 'displayName'
    | 'avatarSeed'
    | 'locale'
    | 'trainingProfile'
    | 'fitnessIndex'
    | 'fitnessLevel'
    | 'onboardedAt'
  >
>;

// --- purchases / entitlements ----------------------------------------------

export type PurchaseStatus = 'pending' | 'active' | 'refunded';

/** A course the signed-in user owns (from the `my_entitlements` view). */
export interface Entitlement {
  courseId: string;
  activatedAt: string | null;
}

export interface PurchaseRow {
  id: string;
  email: string;
  courseId: string;
  status: PurchaseStatus;
  source: string | null;
  locale: string | null;
  note: string | null;
  createdAt: string;
  activatedAt: string | null;
  updatedAt: string;
}

export interface PurchaseFilter {
  status?: PurchaseStatus;
  /** Case-insensitive substring of the email or course id. */
  search?: string;
}

/** Landing order form payload (anonymous). */
export interface OrderInput {
  email: string;
  courseId: string;
  locale?: Locale;
  /** Where the order came from, e.g. 'landing', 'course_page'. */
  source?: string;
}

// --- course state -----------------------------------------------------------

export interface CourseStateRow {
  userId: string;
  courseId: string;
  /** Volume multiplier, 0.3..2 in the database (engine clamps to 0.5..1.5). */
  scale: number;
  currentNodeIndex: number;
  completedNodeIds: string[];
  updatedAt: string;
}

export interface CourseStatePatch {
  scale?: number;
  currentNodeIndex?: number;
  completedNodeIds?: string[];
}

// --- workout sessions -------------------------------------------------------

export interface WorkoutSessionRow {
  id: string;
  userId: string;
  courseId: string;
  nodeId: string;
  workoutId: string;
  difficulty: DifficultyChoice | null;
  scale: number | null;
  prescribed: PrescribedWorkout | null;
  results: ExerciseResult[] | null;
  rpe: number | null;
  feeling: Feeling | null;
  /** 0..1 share of prescribed work completed. */
  completion: number | null;
  points: number;
  durationSec: number | null;
  calories: number | null;
  startedAt: string;
  completedAt: string | null;
  /** YYYY-MM-DD in the user's timezone. */
  localDate: string;
}

export interface StartSessionInput {
  courseId: string;
  nodeId: string;
  workoutId: string;
  difficulty: DifficultyChoice;
  scale: number;
  prescribed: PrescribedWorkout;
  localDate: string;
}

export interface CompleteSessionInput {
  results: ExerciseResult[];
  rpe: number;
  feeling: Feeling;
  completion: number;
  points: number;
  durationSec: number;
  calories: number;
  completedAt: string;
}

// --- daily logs (steps) -----------------------------------------------------

export interface DailyLogRow {
  userId: string;
  localDate: string;
  steps: number;
  /** Recomputed server-side from steps (see daily_logs_set_points trigger). */
  points: number;
  note: string | null;
  updatedAt: string;
}

// --- benchmarks -------------------------------------------------------------

export interface BenchmarkRow {
  id: string;
  userId: string;
  key: string;
  value: number;
  unit: string;
  recordedAt: string;
}

/** One benchmark key with its latest record and full history (most recent first). */
export interface BenchmarkSeries {
  key: string;
  latest: BenchmarkRow;
  history: BenchmarkRow[];
}

// --- leaderboard / totals ---------------------------------------------------

export type LeaderboardPeriod = 'week' | 'all';

export interface LeaderboardRow {
  userId: string;
  displayName: string;
  avatarSeed: string;
  points: number;
  rank: number;
  isMe: boolean;
}

/** All-time totals for the home screen (get_my_totals RPC). */
export interface MyTotals {
  points: number;
  workouts: number;
  minutes: number;
}
