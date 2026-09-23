/**
 * Content contract: exercises, workouts, courses.
 * Every content file in /content is validated against these schemas
 * (see src/content/registry.ts and scripts/content/validate.mjs).
 */
import { z } from 'zod';

/**
 * Languages content is *authored* in. Every L10n value carries all of them, so a translation is
 * never lost and adding a language back is a one-line change to LOCALES below.
 */
export const AUTHORED_LOCALES = ['ru', 'en'] as const;
export type Locale = (typeof AUTHORED_LOCALES)[number];

/**
 * Languages the product is *published* in: what the site renders and links, what the sitemap and
 * hreflang list, and what the app offers.
 *
 * Both are served. Russian is the default and keeps the bare paths (`/courses/`); English lives
 * under `/en/`. `scripts/seo/lib.mjs` and `scripts/seo/og.mjs` carry their own copy of this list
 * because they run as plain Node without the TypeScript path aliases — they have to be changed
 * together with this line.
 */
export const LOCALES: readonly Locale[] = ['ru', 'en'];
export const DEFAULT_LOCALE: Locale = 'ru';

export const L10nSchema = z.object({ ru: z.string().min(1), en: z.string().min(1) });
export type L10n = z.infer<typeof L10nSchema>;

export const OptionalL10nSchema = z.object({
  ru: z.string().optional(),
  en: z.string().optional(),
});
export type OptionalL10n = z.infer<typeof OptionalL10nSchema>;

export const EQUIPMENT = [
  'none',
  'dumbbells',
  'kettlebell',
  'pullup_bar',
  'bands',
  'jump_rope',
  'box',
  'chair',
  'mat',
] as const;
export const EquipmentSchema = z.enum(EQUIPMENT);
export type Equipment = z.infer<typeof EquipmentSchema>;

export const MOVEMENT_PATTERNS = [
  'squat',
  'hinge',
  'lunge',
  'push_horizontal',
  'push_vertical',
  'pull_horizontal',
  'pull_vertical',
  'core_anti_extension',
  'core_rotation',
  'core_flexion',
  'carry',
  'locomotion',
  'jump',
  'olympic',
  'full_body',
  'mobility',
] as const;
export const MovementPatternSchema = z.enum(MOVEMENT_PATTERNS);
export type MovementPattern = z.infer<typeof MovementPatternSchema>;

export const MUSCLE_GROUPS = [
  'quads',
  'glutes',
  'hamstrings',
  'calves',
  'chest',
  'shoulders',
  'triceps',
  'biceps',
  'back',
  'lats',
  'core',
  'obliques',
  'hip_flexors',
  'full_body',
  'cardio',
] as const;
export const MuscleGroupSchema = z.enum(MUSCLE_GROUPS);
export type MuscleGroup = z.infer<typeof MuscleGroupSchema>;

export const ExerciseUnitSchema = z.enum(['reps', 'seconds', 'meters', 'calories']);
export type ExerciseUnit = z.infer<typeof ExerciseUnitSchema>;

export const LevelSchema = z.union([z.literal(1), z.literal(2), z.literal(3)]);
export type Level = z.infer<typeof LevelSchema>;

const idRegex = /^[a-z0-9]+(?:_[a-z0-9]+)*$/;
const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const hexRegex = /^#[0-9a-fA-F]{6}$/;

export const SlugL10nSchema = z.object({
  ru: z.string().regex(slugRegex, 'latin kebab-case slug'),
  en: z.string().regex(slugRegex, 'latin kebab-case slug'),
});

export const ExerciseSchema = z
  .object({
    id: z.string().regex(idRegex),
    slug: SlugL10nSchema,
    name: L10nSchema,
    shortName: L10nSchema.optional(),
    description: L10nSchema,
    howTo: z.array(L10nSchema).min(3),
    cues: z.array(L10nSchema).min(2),
    mistakes: z.array(L10nSchema).min(1),
    breathing: L10nSchema.optional(),
    muscles: z.array(MuscleGroupSchema).min(1),
    pattern: MovementPatternSchema,
    equipment: z.array(EquipmentSchema).min(1),
    level: LevelSchema,
    unit: ExerciseUnitSchema,
    /** Average seconds per repetition at a controlled tempo (required for unit === 'reps'). */
    secondsPerRep: z.number().positive().optional(),
    /** Metabolic equivalent of task, used for calorie estimates. */
    met: z.number().min(1).max(20),
    /** True when an external load (dumbbell/kettlebell) is used. */
    loadable: z.boolean(),
    scaling: z.object({
      easier: z.string().regex(idRegex).optional(),
      harder: z.string().regex(idRegex).optional(),
    }),
    /**
     * What a standard person at each course level comfortably does — reps, or seconds for a hold.
     *
     * Comfortable, never a maximum: the whole adaptation is anchored on comfort, because a
     * programme built from maxima comes out too hard. Authored here once per exercise rather than
     * inferred from a workout's number, which would make the reference flap about with the coach's
     * intent for each particular session. **Expert anchor** unless a norm is cited in
     * docs/TRAINING_SCIENCE.md.
     */
    comfortRef: z.record(z.coerce.number().int(), z.number().positive()).optional(),
    /**
     * Reps of this movement per rep of its pattern's reference movement, for the same person.
     * Used to carry an estimate across to a movement the athlete has never done. Default 1.
     * The one value with a citation is the knee push-up at 0.6 of a full push-up (Ebben 2011).
     */
    relativeDifficulty: z.number().positive().optional(),
    video: OptionalL10nSchema.optional(),
    tags: z.array(z.string()).default([]),
    isTest: z.boolean().optional(),
  })
  .superRefine((e, ctx) => {
    if (e.unit === 'reps' && !e.secondsPerRep) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `${e.id}: secondsPerRep is required for reps`,
      });
    }
  });
export type Exercise = z.infer<typeof ExerciseSchema>;

export const BlockFormatSchema = z.enum([
  'sets',
  'circuit',
  'amrap',
  'emom',
  'fortime',
  'tabata',
  'interval',
]);
export type BlockFormat = z.infer<typeof BlockFormatSchema>;
export const BlockTypeSchema = z.enum([
  'warmup',
  'skill',
  'strength',
  'metcon',
  'core',
  'cooldown',
  'test',
]);
export type BlockType = z.infer<typeof BlockTypeSchema>;
export const LoadSchema = z.enum(['light', 'medium', 'heavy']);
export type Load = z.infer<typeof LoadSchema>;

export const WorkoutItemSchema = z
  .object({
    exerciseId: z.string().regex(idRegex),
    reps: z.number().int().positive().optional(),
    seconds: z.number().int().positive().optional(),
    meters: z.number().int().positive().optional(),
    calories: z.number().int().positive().optional(),
    load: LoadSchema.optional(),
    perSide: z.boolean().optional(),
    note: L10nSchema.optional(),
    restAfterSec: z.number().int().nonnegative().optional(),
    /**
     * The coach's own range for this movement in this piece — the «Тренер: 10-20» he already writes
     * in the note, as data. These are HARD limits on everything the adaptation computes.
     *
     * Without them the model walks away from the programme: the worked example that proved it
     * asked a strong athlete for 50 dead bugs against an authored 30 and a written ceiling of 40.
     * An adaptive engine that can leave the coach's range is not adapting his programme, it is
     * writing its own.
     */
    min: z.number().int().positive().optional(),
    max: z.number().int().positive().optional(),
  })
  .superRefine((it, ctx) => {
    const n = [it.reps, it.seconds, it.meters, it.calories].filter((v) => v !== undefined).length;
    const authored = it.reps ?? it.seconds ?? it.meters ?? it.calories;
    if (it.min !== undefined && it.max !== undefined && it.min > it.max) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: `${it.exerciseId}: min above max` });
    }
    // The authored number is what an average person gets, so it must sit inside the coach's own
    // range. One outside it is a typo in one of the two, and worth stopping the build for.
    if (authored !== undefined && it.min !== undefined && authored < it.min) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `${it.exerciseId}: authored ${authored} is below the coach's min ${it.min}`,
      });
    }
    if (authored !== undefined && it.max !== undefined && authored > it.max) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `${it.exerciseId}: authored ${authored} is above the coach's max ${it.max}`,
      });
    }
    if (n !== 1) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `${it.exerciseId}: exactly one of reps/seconds/meters/calories is required`,
      });
    }
  });
export type WorkoutItem = z.infer<typeof WorkoutItemSchema>;

/**
 * One lever, and how far it moves each way.
 *
 * `easier` / `harder` are multipliers on whatever the lever governs, except `swap`, where the move
 * is to a different movement entirely (`Exercise.scaling.easier` / `.harder`).
 */
export const AdaptLeverSchema = z.enum([
  'reps',
  'rounds',
  'rest',
  'window',
  'interval',
  'swap',
  'none',
]);
export type AdaptLever = z.infer<typeof AdaptLeverSchema>;

export const AdaptStepSchema = z.object({
  lever: AdaptLeverSchema,
  /** Multiplier at «полегче». Below 1 for volume levers, above 1 for rest. */
  easier: z.number().positive().optional(),
  /** Multiplier at «посложнее». */
  harder: z.number().positive().optional(),
});
export type AdaptStep = z.infer<typeof AdaptStepSchema>;

export const BlockSchema = z
  .object({
    id: z.string().regex(idRegex),
    type: BlockTypeSchema,
    format: BlockFormatSchema,
    title: L10nSchema.optional(),
    description: L10nSchema.optional(),
    /** Number of sets (format 'sets') or rounds (format 'circuit'). */
    sets: z.number().int().positive().optional(),
    /** EMOM minutes, Tabata rounds (default 8), interval rounds. */
    rounds: z.number().int().positive().optional(),
    /** AMRAP total seconds, For-time cap seconds. */
    durationSec: z.number().int().positive().optional(),
    workSec: z.number().int().positive().optional(),
    restSec: z.number().int().nonnegative().optional(),
    restBetweenSetsSec: z.number().int().nonnegative().optional(),
    restBetweenRoundsSec: z.number().int().nonnegative().optional(),
    /**
     * Rest after the whole block, before the next one starts (s14: two minutes between the 20s and
     * the 40s). The player plays it as a rest step; ignored on the workout's last block.
     */
    restAfterSec: z.number().int().nonnegative().optional(),
    items: z.array(WorkoutItemSchema).min(1),
    scalable: z.boolean().default(true),
    /**
     * What makes THIS piece easier or harder, in the order the engine should reach for it.
     *
     * Reps are not always the right lever, and the twenty workouts of «Старт» prove it: workout 3
     * starts a pair every two minutes, so the honest lever is the rest between pairs; workout 6 is
     * an AMRAP, so it is the window; workout 19 is the benchmark the whole course is measured
     * against, so it is nothing at all. Adding reps to all three would be wrong in two of them.
     *
     * Omitted, a sensible default for the format applies (`DEFAULT_ADAPT` in the engine), so the
     * courses already written need no hand-tuning — tuning is for where the coach wants it.
     */
    adapt: z.array(AdaptStepSchema).optional(),
  })
  .superRefine((b, ctx) => {
    const need = (cond: boolean, msg: string) => {
      if (!cond) ctx.addIssue({ code: z.ZodIssueCode.custom, message: `${b.id}: ${msg}` });
    };
    switch (b.format) {
      case 'sets':
      case 'circuit':
        need(!!b.sets, 'sets is required for sets/circuit');
        break;
      case 'amrap':
      case 'fortime':
        need(!!b.durationSec, 'durationSec is required for amrap/fortime');
        break;
      case 'emom':
        need(!!b.rounds, 'rounds (minutes) is required for emom');
        break;
      case 'tabata':
      case 'interval':
        need(
          !!b.workSec && b.restSec !== undefined,
          'workSec and restSec are required for tabata/interval',
        );
        break;
    }
  });
export type Block = z.infer<typeof BlockSchema>;

export const WorkoutSchema = z.object({
  id: z.string().regex(idRegex),
  name: L10nSchema,
  focus: L10nSchema,
  description: L10nSchema,
  blocks: z.array(BlockSchema).min(1),
  basePoints: z.number().int().min(60).max(250),
  tags: z.array(z.string()).default([]),
});
export type Workout = z.infer<typeof WorkoutSchema>;

export const NodeKindSchema = z.enum(['workout', 'rest', 'test', 'benchmark', 'milestone']);
export type NodeKind = z.infer<typeof NodeKindSchema>;

export const CourseNodeSchema = z
  .object({
    id: z.string().regex(idRegex),
    week: z.number().int().positive(),
    day: z.number().int().min(1).max(7),
    kind: NodeKindSchema,
    workoutId: z.string().regex(idRegex).optional(),
    title: L10nSchema,
    subtitle: L10nSchema.optional(),
    deload: z.boolean().optional(),
  })
  .superRefine((n, ctx) => {
    if (['workout', 'test', 'benchmark'].includes(n.kind) && !n.workoutId) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `${n.id}: workoutId is required for ${n.kind}`,
      });
    }
  });
export type CourseNode = z.infer<typeof CourseNodeSchema>;

export const FaqItemSchema = z.object({ q: L10nSchema, a: L10nSchema });
export type FaqItem = z.infer<typeof FaqItemSchema>;

/**
 * External payment page. The order form sends the visitor there with their email in
 * the query string, so the value must be an absolute `https://` URL — never a
 * relative path and never `javascript:` / `http:` (OrderForm re-checks at runtime).
 */
export const HttpsUrlSchema = z
  .string()
  .url()
  .refine((v) => v.toLowerCase().startsWith('https://'), {
    message: 'must be an absolute https:// URL',
  });

export const PaymentUrlSchema = z.object({
  ru: HttpsUrlSchema.optional(),
  en: HttpsUrlSchema.optional(),
});
export type PaymentUrl = z.infer<typeof PaymentUrlSchema>;

export const CourseSchema = z.object({
  id: z.string().regex(idRegex),
  order: z.number().int().positive(),
  /*
   * Is this course on sale?
   *
   * `false` hides it everywhere a customer could meet it — the catalogue, the home page, the
   * sitemap, llms.txt, OG cards, the app's course list — and stops its landing page being built
   * at all. It stays in `content/` and stays valid, and `getCourse()` still resolves it, so the
   * workouts keep loading for anyone who already has access and the fixtures keep working.
   *
   * This is for a course that is written but not being sold yet: at launch only the beginner
   * course is offered. Deleting the others would take their 83 workouts and every guide link that
   * points at them with it; a flag keeps the work and sells one thing.
   *
   * Defaults to true, so an author opts a course *out* rather than having to remember to opt in.
   */
  published: z.boolean().default(true),
  slug: SlugL10nSchema,
  name: L10nSchema,
  /*
   * The name as the app says it, when the full name is too long to set in display capitals.
   *
   * `name` is written for search and for a customer who has never heard of us — «Форма с нуля:
   * кроссфит дома без оборудования» tells a stranger on Google exactly what they are looking at.
   * Inside the app that same string is four lines of Unbounded capitals above the day list, and
   * the descriptive half is telling the athlete something they decided weeks ago. Everywhere the
   * app names a course it uses this instead, falling back to `name`; the landing, the OG cards and
   * the metadata keep the full one.
   */
  shortName: L10nSchema.optional(),
  tagline: L10nSchema,
  description: L10nSchema,
  longDescription: z.array(L10nSchema).min(2),
  forWhom: z.array(L10nSchema).min(2),
  outcomes: z.array(L10nSchema).min(3),
  equipment: z.array(EquipmentSchema).min(1),
  level: LevelSchema,
  weeks: z.number().int().min(2).max(16),
  sessionsPerWeek: z.number().int().min(2).max(6),
  avgSessionMin: z.number().int().min(10).max(90),
  /*
   * The course's tile colour — the one colour on the screen while this course is open. It paints
   * the cover, the progress and the number of the current day, and never a button.
   *
   * It is a *programme* colour, not a course's own hue: beginners #ff5a00, dumbbells #f4ff3f, yoga
   * #ffe6d0 (--course-* in src/styles/global.css). A course that belongs to none of those
   * programmes takes a neutral surface (--tile-4 #2e2e2e or --tile-5 #383838). The blues are not
   * course colours: electric blue #2038e2 is the club's, bleu ciel #007bff the coach's, and the
   * light blue #afe9fd is the interface's accent.
   *
   * Ink on the tile is derived from the hex by `courseTileVars()` (src/lib/ui/tile.ts) — whichever
   * of #111111 and white measures the better contrast — so content never has to say which it is.
   */
  tile: z.string().regex(hexRegex),
  /*
   * The course's own cover art, as a media reference — `storage:images/courses/<id>/cover.jpg`, an
   * absolute https URL, or a path under `public/`. The same three shapes every other media field
   * in the product accepts (`src/lib/api/storage.ts`), and `publicMediaUrl()` resolves all three.
   *
   * Optional, and the fallback is not a placeholder: a course with no cover takes its programme
   * colour, which is the brandbook's first rule and how the marathon reads orange and «Форма с
   * нуля» yellow. A missing cover is a deliberate state, not a hole.
   *
   * The art is expected to carry the course's name — drawn, not typeset — which is why
   * `CourseTicket` stops printing the title once a cover is set. That rule lives on the ticket
   * rather than here: on Home the same picture sits under the *day's* name, and a day's name is
   * never written on a course's cover.
   */
  cover: z.string().optional(),
  price: z.object({ rub: z.number().nonnegative(), usd: z.number().nonnegative() }),
  paymentUrl: PaymentUrlSchema.optional(),
  introVideo: OptionalL10nSchema.optional(),
  workouts: z.array(WorkoutSchema).min(1),
  nodes: z.array(CourseNodeSchema).min(4),
  faq: z.array(FaqItemSchema).min(3),
});
export type Course = z.infer<typeof CourseSchema>;

/** Input type for authoring (before zod defaults are applied). */
export type ExerciseInput = z.input<typeof ExerciseSchema>;
export type CourseInput = z.input<typeof CourseSchema>;
export type WorkoutInput = z.input<typeof WorkoutSchema>;
