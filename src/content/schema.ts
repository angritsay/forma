/**
 * Content contract: exercises, workouts, courses.
 * Every content file in /content is validated against these schemas
 * (see src/content/registry.ts and scripts/content/validate.mjs).
 */
import { z } from 'zod';

export const LOCALES = ['ru', 'en'] as const;
export type Locale = (typeof LOCALES)[number];
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
    /** Id of the pose set in src/components/anim/poses. */
    animation: z.string().regex(idRegex),
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
  })
  .superRefine((it, ctx) => {
    const n = [it.reps, it.seconds, it.meters, it.calories].filter((v) => v !== undefined).length;
    if (n !== 1) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `${it.exerciseId}: exactly one of reps/seconds/meters/calories is required`,
      });
    }
  });
export type WorkoutItem = z.infer<typeof WorkoutItemSchema>;

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
    items: z.array(WorkoutItemSchema).min(1),
    scalable: z.boolean().default(true),
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
    stepsGoal: z.number().int().positive().optional(),
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
  slug: SlugL10nSchema,
  name: L10nSchema,
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
  accent: z.string().regex(hexRegex),
  gradient: z.tuple([z.string().regex(hexRegex), z.string().regex(hexRegex)]),
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
