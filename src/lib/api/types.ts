/**
 * Domain types exposed by the API layer (camelCase).
 * Database rows (snake_case) are converted in mappers.ts; the app never sees raw rows.
 */
import type { Locale } from '@/content/schema';
import type { CourseDayContent, CourseDraftContent } from '@/lib/courses/draft';
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

// --- subscriptions ----------------------------------------------------------

export type SubscriptionPlan = 'monthly' | 'annual';
/** pending → active (paid) → cancelled (no more renewals; access lasts until expiresAt). */
export type SubscriptionStatus = 'pending' | 'active' | 'cancelled';

/** The signed-in user's own subscription (view `my_subscription`). */
export interface Subscription {
  plan: SubscriptionPlan;
  status: SubscriptionStatus;
  startedAt: string | null;
  expiresAt: string | null;
  /** Server-side verdict: active or cancelled, and the paid period not over. */
  isLive: boolean;
}

/** A row of `subscriptions` as the admin sees it. */
export interface SubscriptionRow {
  id: string;
  email: string;
  plan: SubscriptionPlan;
  status: SubscriptionStatus;
  startedAt: string | null;
  expiresAt: string | null;
  source: string | null;
  providerRef: string | null;
  locale: string | null;
  note: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface SubscriptionFilter {
  status?: SubscriptionStatus;
  /** Case-insensitive substring of the email. */
  search?: string;
}

/** Subscribe form payload (anonymous): records the intent, never grants access. */
export interface SubscriptionOrderInput {
  email: string;
  plan: SubscriptionPlan;
  locale?: Locale;
  source?: string;
}

/** Admin grant / extension / cancellation (RPC `admin_set_subscription`). */
export interface SubscriptionChange {
  email: string;
  plan: SubscriptionPlan;
  status: Extract<SubscriptionStatus, 'active' | 'cancelled'>;
  /** Explicit end of access; omitted → one plan period from now or from the current expiry. */
  expiresAt?: string | null;
  note?: string | null;
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

// --- exercise catalogue -----------------------------------------------------

/** A row of the database exercise library, for the builder and the admin catalogue. */
export interface ExerciseCatalogRow {
  id: string;
  nameRu: string;
  nameEn: string | null;
  shortNameRu: string | null;
  descriptionRu: string | null;
  descriptionEn: string | null;
  howTo: { ru?: string; en?: string }[];
  cues: { ru?: string; en?: string }[];
  mistakes: { ru?: string; en?: string }[];
  breathingRu: string | null;
  primaryMuscle: string | null;
  muscles: string[];
  pattern: string | null;
  equipment: string[];
  level: number | null;
  unit: 'reps' | 'seconds' | 'meters' | 'calories';
  secondsPerRep: number | null;
  /**
   * The drawn pose set (src/components/anim/poses) — code, so it is null for anything written in
   * the admin panel. Such an exercise leads with its video or still instead.
   */
  animation: string | null;
  videoRu: string | null;
  videoEn: string | null;
  image: string | null;
  tags: string[];
  isTest: boolean;
  /** True when authored in the admin panel; the generated seed never overwrites these rows. */
  isCustom: boolean;
}

/** Hand-editable markup on an exercise (video links and tags). */
export interface ExerciseMarkupPatch {
  videoRu?: string | null;
  videoEn?: string | null;
  tags?: string[];
}

// --- custom (coach-built) workouts ------------------------------------------

/** A coach-built workout as the admin list needs it (no structure). */
export interface CustomWorkoutSummary {
  id: string;
  shortId: string;
  title: string;
  description: string | null;
  estSec: number | null;
  points: number | null;
  shareToken: string | null;
  createdAt: string;
  updatedAt: string;
}

/** A coach-built workout with its full structure JSON. */
export interface CustomWorkoutRow extends CustomWorkoutSummary {
  structure: unknown;
}

/** A custom workout assigned to the signed-in user. */
export interface AssignedWorkoutRow {
  id: string;
  shortId: string;
  title: string;
  description: string | null;
  structure: unknown;
  estSec: number | null;
  points: number | null;
  assignedAt: string;
}

/** Who a custom workout has been granted to. */
export interface WorkoutAssigneeRow {
  email: string;
  note: string | null;
  createdAt: string;
}

// --- courses built in the admin panel ---------------------------------------

export type AdminCourseStatus = 'draft' | 'published' | 'archived';
export type CourseDayKind = 'workout' | 'rest' | 'test' | 'benchmark' | 'milestone';

/** A row of `admin_courses`. `content` is the validated prose blob (CourseDraftContent). */
export interface AdminCourseRow {
  id: string;
  /** The id everything else keys off: purchases, sessions, storage paths. Frozen once published. */
  slugId: string;
  status: AdminCourseStatus;
  sortOrder: number;
  level: number;
  weeks: number;
  sessionsPerWeek: number;
  avgSessionMin: number;
  equipment: string[];
  tile: string;
  priceRub: number;
  priceUsd: number;
  content: CourseDraftContent;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

/** Everything about a course that is editable; `slugId` only before the first publish. */
export type AdminCoursePatch = Partial<
  Pick<
    AdminCourseRow,
    | 'slugId'
    | 'sortOrder'
    | 'level'
    | 'weeks'
    | 'sessionsPerWeek'
    | 'avgSessionMin'
    | 'equipment'
    | 'tile'
    | 'priceRub'
    | 'priceUsd'
    | 'content'
  >
>;

/** A row of `admin_course_days`. */
export interface AdminCourseDayRow {
  id: string;
  courseId: string;
  nodeId: string;
  week: number;
  day: number;
  kind: CourseDayKind;
  /** The `custom_workouts.id` (uuid) this day plays, or null for a rest day / milestone. */
  customWorkoutId: string | null;
  content: CourseDayContent;
  deload: boolean;
  stepsGoal: number | null;
  sortOrder: number;
}

export type AdminCourseDayPatch = Partial<
  Pick<
    AdminCourseDayRow,
    | 'nodeId'
    | 'week'
    | 'day'
    | 'kind'
    | 'customWorkoutId'
    | 'content'
    | 'deload'
    | 'stepsGoal'
    | 'sortOrder'
  >
>;

/** Everything the editor needs to render, preview and validate one course in a single load. */
export interface AdminCourseBundle {
  course: AdminCourseRow;
  days: AdminCourseDayRow[];
  /** The custom workouts the days reference, keyed by `custom_workouts.id`. */
  workouts: CustomWorkoutRow[];
}

/** Fields of an admin-authored exercise, beyond the markup an existing one accepts. */
export interface ExerciseDraft {
  id: string;
  nameRu: string;
  nameEn?: string | null;
  shortNameRu?: string | null;
  descriptionRu?: string | null;
  descriptionEn?: string | null;
  howTo?: { ru?: string; en?: string }[];
  cues?: { ru?: string; en?: string }[];
  mistakes?: { ru?: string; en?: string }[];
  breathingRu?: string | null;
  primaryMuscle?: string | null;
  muscles?: string[];
  pattern?: string | null;
  equipment?: string[];
  level?: number | null;
  unit?: 'reps' | 'seconds' | 'meters' | 'calories';
  secondsPerRep?: number | null;
  videoRu?: string | null;
  videoEn?: string | null;
  image?: string | null;
  tags?: string[];
  isTest?: boolean;
}
