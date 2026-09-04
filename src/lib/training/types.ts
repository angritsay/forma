/**
 * Training engine types — the contract between the engine, the app and the backend payloads.
 * Keep additive: renaming or removing fields breaks stored sessions (jsonb) and the app.
 */
import type {
  BlockFormat,
  BlockType,
  Equipment,
  Exercise,
  ExerciseUnit,
  L10n,
  Level,
  Load,
} from '@/content/schema';

/**
 * Exercise metadata resolver. Engine functions default to the content registry; tests and
 * previews may pass their own lookup so the engine never depends on real content.
 */
export type ExerciseLookup = (id: string) => Exercise | undefined;

export type AgeBand = '18-24' | '25-34' | '35-44' | '45-54' | '55-64' | '65+';
export type Sex = 'male' | 'female' | 'na';
export type ActivityLevel = 'sedentary' | 'light' | 'moderate' | 'active';
export type Experience = 'none' | 'beginner' | 'intermediate' | 'advanced';
export type Limitation =
  'knees' | 'lower_back' | 'shoulders' | 'wrists' | 'hypertension' | 'pregnancy';
export type Goal = 'fat_loss' | 'strength' | 'endurance' | 'general' | 'muscle';
export type SessionTime = 15 | 20 | 30 | 45 | 60;

export interface SelfTests {
  /** Max consecutive push-ups (full or on knees, see pushupsOnKnees). */
  pushups?: number;
  pushupsOnKnees?: boolean;
  /** Air squats completed in 60 seconds. */
  squats60s?: number;
  /** Plank hold in seconds. */
  plankSec?: number;
  /** Optional: burpees in 60 seconds. */
  burpees60s?: number;
}

export interface UserTrainingProfile {
  ageBand: AgeBand;
  sex: Sex;
  weightKg?: number;
  heightCm?: number;
  activityLevel: ActivityLevel;
  experience: Experience;
  tests: SelfTests;
  limitations: Limitation[];
  equipment: Equipment[];
  /** Available dumbbell weights (per dumbbell, kg), ascending. */
  dumbbellKg?: number[];
  /** Available kettlebell weights (kg), ascending. */
  kettlebellKg?: number[];
  timePerSessionMin: SessionTime;
  goal: Goal;
}

export type FitnessComponent = 'pushups' | 'squats' | 'plank' | 'activity' | 'experience';

export interface FitnessAssessment {
  /** 0..100 */
  index: number;
  level: Level;
  /** Each component normalized to 0..100. */
  components: Record<FitnessComponent, number>;
  /**
   * Components the athlete did not test (their `components` value is imputed from the rest).
   * When every self-test is missing the index is capped (see docs/TRAINING_SCIENCE.md).
   */
  missing?: FitnessComponent[];
}

export type DifficultyChoice = 'easier' | 'normal' | 'harder';
export type Feeling = 'great' | 'ok' | 'hard' | 'pain';

export interface SessionFeedback {
  /** Borg CR10 rating of perceived exertion, 1..10. */
  rpe: number;
  feeling: Feeling;
  note?: string;
}

export interface SessionSummary {
  sessionId?: string;
  courseId: string;
  nodeId: string;
  workoutId: string;
  choice: DifficultyChoice;
  /** Course scale used for this session. */
  scale: number;
  /** 0..1 share of prescribed work completed. */
  completion: number;
  rpe: number;
  feeling: Feeling;
  points: number;
  durationSec: number;
  calories: number;
  completedAt: string;
}

export interface CourseState {
  /** Volume multiplier for the course, 0.5..1.5. */
  scale: number;
  /** Most recent last. */
  history: SessionSummary[];
  completedNodeIds: string[];
}

export interface PrescribeOptions {
  profile: UserTrainingProfile;
  scale: number;
  choice: DifficultyChoice;
  level: Level;
  deload?: boolean;
  /** True when the node was already completed (points are halved). */
  repeat?: boolean;
  /** Current streak length, for the points bonus. */
  streakDays?: number;
}

export interface PrescribedItem {
  exerciseId: string;
  /** Exercise id from the workout definition (differs when substituted). */
  originalExerciseId: string;
  substituted: boolean;
  unit: ExerciseUnit;
  /** Concrete reps / seconds / meters / calories after scaling. */
  target: number;
  perSide: boolean;
  loadLabel?: Load;
  /** Chosen weight in kg when the exercise is loadable and the user has equipment weights. */
  loadKg?: number;
  restAfterSec: number;
  note?: L10n;
  /** Estimated seconds of work for one set of this item. */
  estimatedSec: number;
}

export interface PrescribedBlock {
  blockId: string;
  type: BlockType;
  format: BlockFormat;
  title?: L10n;
  description?: L10n;
  /** Effective sets (sets), rounds (circuit/tabata/interval), minutes (emom); 1 for amrap/fortime. */
  sets: number;
  /** AMRAP length / For-time cap. */
  durationSec?: number;
  workSec?: number;
  restSec?: number;
  restBetweenSetsSec: number;
  restBetweenRoundsSec: number;
  items: PrescribedItem[];
  estimatedSec: number;
  scaled: boolean;
}

export interface PrescribedWorkout {
  workoutId: string;
  choice: DifficultyChoice;
  /** Course scale at prescription time. */
  scale: number;
  /** scale × choice multiplier × deload multiplier. */
  effectiveScale: number;
  deload: boolean;
  blocks: PrescribedBlock[];
  estimatedSec: number;
  /** Points awarded for full completion. */
  points: number;
}

export interface DurationEstimate {
  totalSec: number;
  workSec: number;
  restSec: number;
  perBlock: { blockId: string; sec: number }[];
}

export type PlayerStep =
  | {
      kind: 'block_intro';
      blockId: string;
      blockIndex: number;
      type: BlockType;
      format: BlockFormat;
      title?: L10n;
      description?: L10n;
      sets: number;
      durationSec?: number;
    }
  | {
      kind: 'explain';
      blockId: string;
      exerciseId: string;
      item: PrescribedItem;
    }
  | {
      kind: 'work';
      blockId: string;
      exerciseId: string;
      item: PrescribedItem;
      /** 1-based set/round/minute index within the block. */
      set: number;
      totalSets: number;
      mode: 'reps' | 'timer';
      /** Seconds for timer mode (tabata/interval/emom minute/seconds-based items). */
      durationSec?: number;
      /** Reps (or seconds/meters/calories for reps-mode display). */
      target: number;
      loadKg?: number;
      /**
       * True inside a `test` block: the athlete works for the whole interval and the UI records a
       * score (reps done / seconds held), not a share of the target. Completion counts such a step
       * as done or skipped — see docs/TRAINING_SCIENCE.md §7.1.
       */
      isTest?: boolean;
    }
  | {
      kind: 'rest';
      blockId: string;
      durationSec: number;
      nextExerciseId?: string;
    }
  | {
      kind: 'amrap';
      blockId: string;
      durationSec: number;
      items: PrescribedItem[];
      /** Rounds a fully-completing athlete is expected to reach (for completion ratio). */
      expectedRounds: number;
    }
  | {
      kind: 'fortime';
      blockId: string;
      capSec: number;
      rounds: number;
      items: PrescribedItem[];
    }
  | { kind: 'done' };

export interface ExerciseResult {
  stepIndex: number;
  blockId: string;
  exerciseId?: string;
  completed: boolean;
  skipped?: boolean;
  /** Reps done / seconds held for work steps. */
  achieved?: number;
  /** Rounds (+ partial reps) for AMRAP steps. */
  rounds?: number;
  extraReps?: number;
  /** Seconds to finish for For-time steps. */
  timeSec?: number;
  /** Load actually used, kg. */
  loadKg?: number;
}

export interface DayActivity {
  /** Local date YYYY-MM-DD. */
  date: string;
  workoutDone: boolean;
  steps: number;
  stepsGoal?: number;
}

export interface StreakInfo {
  current: number;
  longest: number;
  todayDone: boolean;
  /** True when today has nothing logged yet and the streak would break at midnight. */
  atRisk: boolean;
  lastActiveDate?: string;
}

export interface LevelInfo {
  level: number;
  title: L10n;
  minPoints: number;
  /** Points needed for the next level, null at the top level. */
  nextAt: number | null;
  /** 0..1 progress towards the next level. */
  progress: number;
}

export interface Recommendation {
  choice: DifficultyChoice;
  reason: L10n;
}

/** Extra context for `recommendDifficulty` that is not part of the course state. */
export interface RecommendationContext {
  /** Steps logged for the previous local day (a heavy walking day suggests an easier session). */
  stepsYesterday?: number;
}

/** Options for `summarizeSession`. Timestamps are ISO strings; the engine never reads the clock. */
export interface SummarizeOptions {
  courseId: string;
  nodeId: string;
  sessionId?: string;
  /** When the athlete pressed Start (used with `completedAt` for the real duration). */
  startedAt?: string;
  /** When the session was finished — pass "now" from the caller. */
  completedAt: string;
  /** Body weight for the calorie estimate; defaults to DEFAULT_WEIGHT_KG. */
  weightKg?: number;
  /** The exact steps the results refer to; rebuilt with `buildPlayerSteps` when omitted. */
  steps?: PlayerStep[];
  exerciseLookup?: ExerciseLookup;
}

export interface ScaleAdjustment {
  scale: number;
  delta: number;
  reason: L10n;
  /** Set when the athlete reported pain: the app shows a safety note. */
  safetyNote?: L10n;
}

export interface UserStats {
  workouts: number;
  points: number;
  streakCurrent: number;
  streakLongest: number;
  stepsDaysAtGoal: number;
  benchmarksDone: number;
  coursesCompleted: number;
  totalMinutes: number;
}

export interface Achievement {
  id: string;
  title: L10n;
  description: L10n;
  /** Emoji or icon key used by the UI. */
  icon: string;
  /** Returns true when the achievement is unlocked for the given stats. */
  unlocked: (stats: UserStats) => boolean;
  /** Optional 0..1 progress for locked achievements. */
  progress?: (stats: UserStats) => number;
}

/** Serializable result of `evaluateAchievements` (no functions, safe to store or render). */
export interface AchievementStatus {
  id: string;
  title: L10n;
  description: L10n;
  icon: string;
  unlocked: boolean;
  /** 0..1, 1 when unlocked. */
  progress: number;
}
