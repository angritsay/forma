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

/**
 * Easier / As usual / Harder must be *felt*, and the thing an athlete feels is how long the
 * session takes and how many sets they have to get through. The lever is therefore structural —
 * a set added or removed, a window lengthened or shortened — with only a small nudge to the
 * per-set numbers. Target: roughly 5-10 minutes between one choice and the next.
 *
 * Rest per set deliberately does NOT change with the choice. How long you need between sets is a
 * property of the movement, not of how ambitious you feel; and an earlier design that lengthened
 * rest as it cut volume cancelled its own duration effect, which is why the three options used to
 * finish within ~1.4 min of each other (and, in five workouts, "easier" ran *longer* than
 * "harder"). Rest stays a lever for deloads only.
 */

/**
 * How many blocks the choice may add a set to (or take one from). Capped, because trimming a set
 * from every block of a five-block workout halves it — at which point it is a different session,
 * not the same one taken easier. The cap lands the step at roughly 5-8 minutes.
 */
export const MAX_CHOICE_SET_BLOCKS = 2;

/** Sets added or removed per difficulty choice (sets/circuit blocks). The main lever. */
export const CHOICE_SETS_DELTA: Readonly<Record<DifficultyChoice, number>> = {
  easier: -1,
  normal: 0,
  harder: 1,
};

/**
 * Multiplier for a format's own clock: EMOM/Tabata/interval rounds and the AMRAP / for-time
 * window. These formats have no sets to add, so the window itself is what moves.
 */
export const CHOICE_WINDOW: Readonly<Record<DifficultyChoice, number>> = {
  easier: 0.8,
  normal: 1,
  harder: 1.2,
};

/** Volume multiplier per difficulty choice (reps, seconds, meters, calories). */
export const CHOICE_VOLUME: Readonly<Record<DifficultyChoice, number>> = {
  easier: 0.9,
  normal: 1,
  harder: 1.1,
};

/**
 * Volume multiplier for for-time work. Stronger than CHOICE_VOLUME because a for-time piece has
 * nothing else to give: no rest to trade, and often a single round. Cutting a 21-15-9 to 15-12-9
 * is how a coach scales one, so reps carry the whole change here.
 */
export const CHOICE_VOLUME_FORTIME: Readonly<Record<DifficultyChoice, number>> = {
  easier: 0.8,
  normal: 1,
  harder: 1.2,
};

/** Never take a format's own clock below this, whatever the choice (rounds, or seconds). */
export const MIN_FORMAT_ROUNDS = 4;
export const MIN_WINDOW_SEC = 240;

/**
 * A scaled AMRAP / for-time window lands on a whole minute. The player and every summary show the
 * window in minutes, so a half-minute step (390 s) read as «7 мин» and then ran six and a half.
 */
export const WINDOW_STEP_SEC = 60;

/** Points multiplier per difficulty choice. */
export const CHOICE_POINTS: Readonly<Record<DifficultyChoice, number>> = {
  easier: 0.8,
  normal: 1,
  harder: 1.25,
};

/** Repeating an already completed node yields this share of the points. */
export const REPEAT_POINTS = 0.5;

/*
 * `STREAK_BONUS` stood here — +10% at seven consecutive days, +20% at thirty — and went with the
 * streak itself. It was a multiplier on training every single day, in a product whose own course
 * schedules two rest days a week: the only way to earn it was to ignore the plan. Points are now
 * the workout's own value times the difficulty chosen, halved on a repeat, and nothing else.
 */

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

/**
 * Scale thresholds at which adaptation adds / removes one set (sets & circuit formats).
 * Measured against the athlete's own scale, NOT against scale x choice: the choice gets its own
 * set delta (CHOICE_SETS_DELTA), and counting it twice would make "harder" jump two sets.
 */
export const SETS_ADD_AT = 1.3;
export const SETS_REMOVE_AT = 0.7;
/** Floor when adaptation removes a set (unless the block was authored with fewer). */
export const MIN_SETS_AFTER_REMOVE = 2;
/**
 * Floor when the athlete chose "easier" — one honest set beats skipping the session. A circuit
 * authored with two or more rounds keeps two: «два круга» cut to one is a different session
 * (the coach's s17 on «полегче» came out at under three minutes).
 */
export const MIN_SETS_EASIER = 1;
export const MIN_ROUNDS_EASIER_CIRCUIT = 2;

/**
 * When the engine wanted an easier or harder variant but the only one in the library has no clip
 * of the coach, the filmed original stays and its target moves instead — by this factor on top of
 * the choice's own volume.
 */
export const FILMED_FALLBACK_VOLUME: Readonly<Record<'easier' | 'harder', number>> = {
  easier: 0.85,
  harder: 1.15,
};

/**
 * Substitutions whose work is not the same number of reps: `from>to` → factor on the target, and
 * whether the result must be even. The coach's rule for the sit-up / Russian-twist → dead-bug swap
 * is «в два раза больше повторений», counted in pairs (one per side).
 */
export const SUBSTITUTE_REPS_FACTOR: Readonly<Record<string, { factor: number; even: boolean }>> = {
  'sit_up>dead_bug': { factor: 2, even: true },
  'russian_twist>dead_bug': { factor: 2, even: true },
};
/** Most sets adaptation and the choice may add on top of what was authored. */
export const MAX_SETS_ADDED = 2;
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

/**
 * Work / rest seconds assumed when a tabata or interval block omits them. The content schema
 * requires both, so these only cover hand-built blocks — the player and the duration estimate
 * read them from here so the two can never disagree.
 */
export const FORMAT_DEFAULT_WORK_REST: Readonly<
  Record<'tabata' | 'interval', { readonly workSec: number; readonly restSec: number }>
> = {
  tabata: { workSec: 20, restSec: 10 },
  interval: { workSec: 30, restSec: 30 },
};

/* ---------------------------------------------------------------------------------------------
 * Levels
 *
 * Four step constants used to stand here — a daily goal of 7 000 and what a day at that goal was
 * worth in points. They went with the whole step feature. A Mini App cannot read a phone's step
 * counter: Apple Health is a native iOS framework with no browser access, and Google Fit's REST
 * API stopped taking new applications in 2024 and shuts down at the end of 2026. So the number
 * could only ever be typed in by hand, and nobody keeps the same tally in two apps. Points now
 * come from training alone.
 * ------------------------------------------------------------------------------------------- */

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

/**
 * Id fragments of movements done one side at a time.
 *
 * The content library's `unilateral` tag is the primary source and carries 23 movements; this
 * catches the ones whose id already says it, so a movement added later without the tag still
 * gets an even rep count (see `isTwoSided` and `evenTarget` in prescribe.ts).
 */
export const TWO_SIDED_ID_PATTERN =
  /single_leg|single_arm|lunge|step_up|skater|bird_dog|suitcase|turkish|_per_side/;

/* ---------------------------------------------------------------------------------------------
 * Comfort — the per-movement model (comfort.ts)
 * ------------------------------------------------------------------------------------------- */

/**
 * The three modes, as multipliers on what this athlete comfortably does.
 *
 * «Полегче» is exactly their comfortable number — not less. Someone who chooses the easy option is
 * not asking to be undertrained, they are asking not to be punished today, and the honest answer to
 * that is the work they already know they can do.
 *
 * «Нормально» is a fifth more. That step lands around two to three repetitions in reserve, which is
 * where the RIR literature puts the useful training range (Zourdos et al. 2016; Helms et al. 2016)
 * and it is what the owner described unprompted: comfortable ten, normal twelve, harder fifteen.
 *
 * The numbers below are relative to «нормально», because that is what the coach authors.
 */
export const COMFORT_MODE: Readonly<Record<DifficultyChoice, number>> = {
  easier: 0.83,
  normal: 1,
  harder: 1.17,
};

/** Comfort ÷ the standard person's comfort, clamped. Beyond this the athlete is on another course. */
export const COMFORT_RATIO_MIN = 0.4;
export const COMFORT_RATIO_MAX = 2.5;

/**
 * A ratio the athlete has never demonstrated for *this* movement is held closer to average than one
 * they have. **Expert anchor** — there is no published coefficient for "how much does a good plank
 * tell you about sit-ups", and the cost of being wrong is asymmetric, so these are timid.
 */
export const COMFORT_SHRINK = { samePattern: 0.7, crossPattern: 0.4 } as const;
export const COMFORT_INFERRED_MIN = 0.5;
export const COMFORT_INFERRED_MAX = 1.8;

/**
 * Learning rate bounds for `α = 1/(observations + 2)`. The floor keeps a long-established estimate
 * from freezing when a body actually changes; the ceiling keeps one loud session from rewriting it.
 */
export const COMFORT_ALPHA_MIN = 0.05;
export const COMFORT_ALPHA_MAX = 0.35;

/**
 * How far one session may move a comfort — and it is DELIBERATELY NOT SYMMETRIC.
 *
 * Up is the 2-10% band of the ACSM Position Stand (2009) for progressing load, at the generous end
 * because this is an estimate moving rather than a prescription, and capped because the athlete
 * trains at home with nobody watching.
 *
 * Down is two and a half times that, because the two errors do not cost the same. Prescribing too
 * little slows someone's progress; prescribing too much makes them fail, and people who fail a
 * workout do not come back to it. A symmetric clamp was the first version and it was wrong: an
 * athlete asked for 12 who managed 7 would have been asked for 11 next time, then 10, then 9 —
 * failing four sessions in a row on the way to a number the engine already had the evidence for.
 */
export const COMFORT_SESSION_MAX_UP = 0.1;
export const COMFORT_SESSION_MAX_DOWN = 0.25;

/**
 * What hitting the target twice in a row, easily, is worth. Baechle & Earle's two-for-two rule, at
 * the small end of its usual 2-10% because it fires on inference rather than on a measurement.
 */
export const TWO_FOR_TWO_GAIN = 0.04;

/* ---------------------------------------------------------------------------------------------
 * Levers (levers.ts)
 * ------------------------------------------------------------------------------------------- */

/** One honest round beats skipping the session, so rounds never fall below this. */
export const LEVER_ROUNDS_MIN = 1;

/** A rest that exists never rounds away to nothing. */
export const LEVER_REST_FLOOR_SEC = 5;

/** An every-N-minutes piece stops being one below this. */
export const LEVER_INTERVAL_FLOOR_SEC = 60;

/**
 * How much the mode's move is damped for an athlete already far from average.
 *
 * The ratio has already done most of the work for them; letting the mode compound on top produces
 * a «посложнее» the strong cannot finish and a «полегче» with nothing in it for the weak. At 1.0 an
 * athlete at twice average feels roughly half the mode's nominal move. **Expert anchor.**
 */
export const LEVER_RCENTRE = 1;
