/**
 * Engine constants: multipliers, thresholds and reference tables.
 * Every value is explained, with its source, in docs/TRAINING_SCIENCE.md.
 */
import type {
  ActivityLevel,
  AgeBand,
  DifficultyChoice,
  Experience,
  FitnessComponent,
} from './types';

/* ---------------------------------------------------------------------------------------------
 * Difficulty choice, repeats, streaks, deloads
 * ------------------------------------------------------------------------------------------- */

/** Volume multiplier per difficulty choice (reps, seconds, meters, calories). */
export const CHOICE_VOLUME: Readonly<Record<DifficultyChoice, number>> = {
  easier: 0.85,
  normal: 1,
  harder: 1.15,
};

/** Rest multiplier per difficulty choice. */
export const CHOICE_REST: Readonly<Record<DifficultyChoice, number>> = {
  easier: 1.15,
  normal: 1,
  harder: 0.9,
};

/** Points multiplier per difficulty choice. */
export const CHOICE_POINTS: Readonly<Record<DifficultyChoice, number>> = {
  easier: 0.8,
  normal: 1,
  harder: 1.25,
};

/** Repeating an already completed node yields this share of the points. */
export const REPEAT_POINTS = 0.5;

/** Streak bonus tiers, checked from the longest streak down (first match wins). */
export const STREAK_BONUS: readonly { days: number; bonus: number }[] = [
  { days: 30, bonus: 0.2 },
  { days: 7, bonus: 0.1 },
];

/** Deload nodes: volume and rest multipliers (points stay as normal). */
export const DELOAD_VOLUME = 0.65;
export const DELOAD_REST = 1.2;

/* ---------------------------------------------------------------------------------------------
 * Scale (volume multiplier) bounds
 * ------------------------------------------------------------------------------------------- */

/** Course scale bounds after adaptation. */
export const SCALE_MIN = 0.5;
export const SCALE_MAX = 1.5;
/** Bounds of the initial scale derived from the fitness index. */
export const SCALE_INITIAL_MIN = 0.6;
export const SCALE_INITIAL_MAX = 1.3;
/** Bounds of the effective scale (scale × choice × deload) inside a single prescription. */
export const EFFECTIVE_SCALE_MIN = 0.3;
export const EFFECTIVE_SCALE_MAX = 2;

/** Effective-scale thresholds at which one set is added / removed (sets & circuit formats). */
export const SETS_ADD_AT = 1.3;
export const SETS_REMOVE_AT = 0.7;
/** Never drop below this many sets when removing one (unless authored with fewer). */
export const MIN_SETS_AFTER_REMOVE = 2;
/** Shortest timed target after scaling (seconds). */
export const MIN_SECONDS_TARGET = 10;

/* ---------------------------------------------------------------------------------------------
 * Duration and energy expenditure
 * ------------------------------------------------------------------------------------------- */

/** Seconds to move from one exercise to the next inside a set/round. */
export const TRANSITION_SEC = 8;
/** Seconds spent reading a block intro. */
export const BLOCK_INTRO_SEC = 20;
/** MET assumed during rest, transitions and intros (standing / light activity). */
export const REST_MET = 1.5;
/** Body weight used for calories when the profile has none (kg). */
export const DEFAULT_WEIGHT_KG = 70;
/** MET assumed for an exercise that is missing from the lookup (moderate calisthenics). */
export const DEFAULT_MET = 5;
/** Seconds per rep assumed when an exercise is missing from the lookup. */
export const DEFAULT_SECONDS_PER_REP = 3;
/** Pace used to turn meters into seconds (easy run / brisk shuttle). */
export const METERS_PER_SEC = 1.5;
/** Seconds per calorie on a rower/bike-style item. */
export const SEC_PER_CALORIE = 4;
/** Share of an AMRAP/EMOM spent working (the rest is transition/recovery). */
export const AMRAP_WORK_SHARE = 0.7;
/** For-time pacing factor: athletes finish slower than the controlled-tempo estimate. */
export const FORTIME_PACE_FACTOR = 1.15;
/** Default Tabata rounds when a block does not set them. */
export const TABATA_DEFAULT_ROUNDS = 8;

/* ---------------------------------------------------------------------------------------------
 * Steps and levels
 * ------------------------------------------------------------------------------------------- */

export const STEPS_GOAL = 7000;
export const STEPS_POINTS_AT_GOAL = 30;
export const STEPS_POINTS_PER_EXTRA_1000 = 5;
export const STEPS_POINTS_MAX = 60;

/** Cumulative points needed for each level (index 0 = level 1). */
export const LEVEL_THRESHOLDS: readonly number[] = [
  0, 300, 800, 1500, 2500, 4000, 6000, 8500, 12000, 16000,
];

/** Fitness-index thresholds for training levels (index < level2From → level 1, ...). */
export const LEVEL_TIER = { level2From: 35, level3From: 66 } as const;

/* ---------------------------------------------------------------------------------------------
 * Adaptation (autoregulation) and pre-workout recommendation
 * ------------------------------------------------------------------------------------------- */

/** Post-session adaptation table (Borg CR10 RPE × completion ratio → scale delta). */
export const ADAPTATION = {
  /** Completion ≥ fullCompletion and RPE ≤ easyRpe → +easyDelta. */
  easyDelta: 0.05,
  /** RPE in (easyRpe, moderateRpeMax] and completion ≥ goodCompletion → +moderateDelta. */
  moderateDelta: 0.02,
  /** RPE ≥ hardRpe or completion < lowCompletion → hardDelta. */
  hardDelta: -0.05,
  /** Feeling "pain" → painDelta (plus a safety note). */
  painDelta: -0.1,
  fullCompletion: 0.95,
  goodCompletion: 0.9,
  lowCompletion: 0.8,
  easyRpe: 6,
  moderateRpeMax: 8,
  hardRpe: 9,
} as const;

/** Pre-workout recommendation thresholds. */
export const RECOMMENDATION = {
  /** "harder" needs at least this many hours since the last session. */
  harderMinHours: 48,
  /** Less than this many hours since the last session → "easier". */
  easierMaxHours: 24,
  /** Yesterday's steps at or above this → "easier" (heavy walking day). */
  heavyStepsYesterday: 15000,
  /** "harder" needs the last N sessions to be easy and complete. */
  easySessionsForHarder: 2,
} as const;

/* ---------------------------------------------------------------------------------------------
 * Fitness index
 * ------------------------------------------------------------------------------------------- */

/** Component weights (sum = 1). */
export const FITNESS_WEIGHTS: Readonly<Record<FitnessComponent, number>> = {
  pushups: 0.3,
  squats: 0.25,
  plank: 0.2,
  activity: 0.15,
  experience: 0.1,
};

/** Index cap when the athlete skipped every self-test (activity + experience only). */
export const NO_TEST_INDEX_CAP = 60;

/** Knee (modified) push-ups count as this fraction of a full push-up. */
export const KNEE_PUSHUP_FACTOR = 0.6;

/** Age bands of the CSEP / ACSM push-up norm tables. */
export type NormAgeBand = '20-29' | '30-39' | '40-49' | '50-59' | '60-69';

/**
 * Push-up fitness categories, minimum reps for: [fair, good, very good, excellent].
 * Men: full push-ups; women: modified (knee) push-ups.
 * Source: CSEP Canadian Physical Activity, Fitness & Lifestyle Approach (CPAFLA), reproduced in
 * ACSM's Guidelines for Exercise Testing and Prescription (push-up test norms by age and sex).
 */
export const PUSHUP_NORMS: Readonly<
  Record<
    'male' | 'female',
    Readonly<Record<NormAgeBand, readonly [number, number, number, number]>>
  >
> = {
  male: {
    '20-29': [17, 22, 29, 36],
    '30-39': [12, 17, 22, 30],
    '40-49': [10, 13, 17, 25],
    '50-59': [7, 10, 13, 21],
    '60-69': [5, 8, 11, 18],
  },
  female: {
    '20-29': [10, 15, 21, 30],
    '30-39': [8, 13, 20, 27],
    '40-49': [5, 11, 15, 24],
    '50-59': [2, 7, 11, 21],
    '60-69': [2, 5, 12, 17],
  },
};

/** Scores assigned to the [fair, good, very good, excellent] category minimums (0 reps → 0). */
export const PUSHUP_CATEGORY_SCORES: readonly [number, number, number, number] = [25, 50, 75, 100];

/**
 * Forma age bands straddle the norm bands; the anchors used are the mean of the listed norm
 * bands (18–24 and 65+ clamp to the nearest table).
 */
export const AGE_BAND_NORM_BANDS: Readonly<Record<AgeBand, readonly NormAgeBand[]>> = {
  '18-24': ['20-29'],
  '25-34': ['20-29', '30-39'],
  '35-44': ['30-39', '40-49'],
  '45-54': ['40-49', '50-59'],
  '55-64': ['50-59', '60-69'],
  '65+': ['60-69'],
};

/**
 * Air squats in 60 s → score, for the 25–34 band. Expert anchors (no standardized norm exists).
 */
export const SQUAT_ANCHORS: readonly (readonly [number, number])[] = [
  [0, 0],
  [15, 10],
  [30, 50],
  [45, 80],
  [55, 100],
];

/** Squat anchors shift down by this share per age band older than 25–34. */
export const SQUAT_AGE_SHIFT_PER_BAND = 0.05;
export const SQUAT_BAND_SHIFT: Readonly<Record<AgeBand, number>> = {
  '18-24': 0,
  '25-34': 0,
  '35-44': 1,
  '45-54': 2,
  '55-64': 3,
  '65+': 4,
};

/** Plank hold seconds → score. Expert anchors informed by published population averages. */
export const PLANK_ANCHORS: readonly (readonly [number, number])[] = [
  [0, 0],
  [15, 10],
  [30, 30],
  [60, 55],
  [90, 75],
  [120, 90],
  [180, 100],
];

export const ACTIVITY_SCORE: Readonly<Record<ActivityLevel, number>> = {
  sedentary: 10,
  light: 40,
  moderate: 70,
  active: 100,
};

export const EXPERIENCE_SCORE: Readonly<Record<Experience, number>> = {
  none: 10,
  beginner: 35,
  intermediate: 70,
  advanced: 100,
};

/* ---------------------------------------------------------------------------------------------
 * Limitations
 * ------------------------------------------------------------------------------------------- */

/** Longest isometric hold prescribed to athletes with hypertension (seconds). */
export const HYPERTENSION_MAX_HOLD_SEC = 30;

/** Exercise ids avoided with knee complaints (in addition to the `jump` pattern). */
export const KNEE_RISKY_IDS: readonly string[] = [
  'jumping_lunge',
  'tuck_jump',
  'jump_squat',
  'broad_jump',
  'skater',
];

/** Exercise ids avoided with lower-back complaints (in addition to loaded hinges). */
export const LOWER_BACK_RISKY_IDS: readonly string[] = ['superman', 'russian_twist'];

/** Id fragments of movements performed with the wrists in extension on the floor. */
export const ON_HANDS_ID_PATTERN =
  /push_?up|plank|bear_crawl|crawl|burpee|mountain_climber|handstand/;

/** Id fragments of loaded overhead movements (shoulder complaints). */
export const OVERHEAD_ID_PATTERN = /overhead|snatch|thruster|press|jerk/;

/** Id fragments of isometric holds (hypertension: capped at HYPERTENSION_MAX_HOLD_SEC). */
export const ISOMETRIC_ID_PATTERN = /plank|hold|wall_sit|hollow|bridge|l_sit|superman|isometric/;
