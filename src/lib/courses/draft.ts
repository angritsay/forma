/**
 * The bridge between a course authored in the admin panel and the `Course` shape the rest of the
 * product already understands.
 *
 * A course used to be a TypeScript file validated against `CourseSchema` and compiled into the
 * build. Now it can also be rows in `admin_courses` + `admin_course_days`, each training day
 * pointing at a `custom_workouts` row. Rather than teach the path screen, the player, the landing
 * generator and the SEO pages about a second kind of course, {@link draftToCourse} converts the
 * rows into exactly the same `Course` object. Everything downstream stays unchanged.
 *
 * The two jsonb blobs those tables carry are validated here, on the way in and on the way out:
 * the database bounds their size, this module bounds their shape.
 */
import { z } from 'zod';
import {
  CourseSchema,
  EquipmentSchema,
  L10nSchema,
  LevelSchema,
  type Block,
  type Course,
  type CourseNode,
  type L10n,
  type NodeKind,
  type Workout,
  type WorkoutItem,
} from '@/content/schema';
import type {
  CustomSectionKind,
  CustomWorkoutSection,
  CustomWorkoutStructure,
} from '@/lib/training/customWorkout';

// --- the stored jsonb shapes ------------------------------------------------

const SlugPairSchema = z.object({
  ru: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'latin kebab-case slug'),
  en: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'latin kebab-case slug'),
});

const MediaRefSchema = z.object({ ru: z.string().optional(), en: z.string().optional() });

/**
 * `admin_courses.content` — every piece of prose a course carries.
 *
 * Nothing here is required: the editor saves continuously, and a course half-written must still
 * round-trip. Completeness is checked at publish time by {@link draftToCourse}, which runs the
 * real `CourseSchema` over the assembled result.
 */
export const CourseDraftContentSchema = z.object({
  slug: SlugPairSchema.optional(),
  name: L10nSchema.partial().optional(),
  tagline: L10nSchema.partial().optional(),
  description: L10nSchema.partial().optional(),
  longDescription: z.array(L10nSchema.partial()).default([]),
  forWhom: z.array(L10nSchema.partial()).default([]),
  outcomes: z.array(L10nSchema.partial()).default([]),
  faq: z.array(z.object({ q: L10nSchema.partial(), a: L10nSchema.partial() })).default([]),
  coverImage: z.string().nullable().optional(),
  introVideo: MediaRefSchema.optional(),
  paymentUrl: MediaRefSchema.optional(),
});
export type CourseDraftContent = z.infer<typeof CourseDraftContentSchema>;

/** `admin_course_days.content` — the day's own words. `body` is what a yoga day needs. */
export const CourseDayContentSchema = z.object({
  title: L10nSchema.partial().optional(),
  subtitle: L10nSchema.partial().optional(),
  body: z.array(L10nSchema.partial()).default([]),
  image: z.string().nullable().optional(),
});
export type CourseDayContent = z.infer<typeof CourseDayContentSchema>;

/** Parse a stored blob, falling back to an empty draft rather than throwing on legacy rows. */
export function parseCourseContent(value: unknown): CourseDraftContent {
  const parsed = CourseDraftContentSchema.safeParse(value ?? {});
  return parsed.success ? parsed.data : CourseDraftContentSchema.parse({});
}

export function parseDayContent(value: unknown): CourseDayContent {
  const parsed = CourseDayContentSchema.safeParse(value ?? {});
  return parsed.success ? parsed.data : CourseDayContentSchema.parse({});
}

// --- assembling a Course ----------------------------------------------------

/** The rows {@link draftToCourse} needs, named in the product's own terms rather than the DB's. */
export interface CourseDraft {
  slugId: string;
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
}

export interface CourseDayDraft {
  nodeId: string;
  week: number;
  day: number;
  kind: NodeKind;
  /** The custom workout's *short id* — the id a session is recorded against. */
  workoutShortId: string | null;
  deload: boolean;
  stepsGoal: number | null;
  sortOrder: number;
  content: CourseDayContent;
}

export interface WorkoutDraft {
  shortId: string;
  title: string;
  description: string | null;
  points: number | null;
  structure: CustomWorkoutStructure;
}

/**
 * A partial {ru, en} becomes a full L10n.
 *
 * Product copy is Russian and the English half of the content model exists so a translation is
 * never lost — not because anything renders it today (`LOCALES` is `['ru']`). An untranslated
 * field therefore falls back to the Russian rather than blocking the author, and `fallback` covers
 * the case where neither has been written yet.
 */
function l10n(value: Partial<L10n> | undefined, fallback: string): L10n {
  const ru = value?.ru?.trim() || value?.en?.trim() || fallback;
  const en = value?.en?.trim() || ru;
  return { ru, en };
}

function l10nList(values: Partial<L10n>[] | undefined, fallback: string): L10n[] {
  return (values ?? [])
    .map((v) => l10n(v, fallback))
    .filter((v) => v.ru !== fallback || v.en !== fallback);
}

const SECTION_TYPE: Record<CustomSectionKind, Block['type']> = {
  warmup: 'warmup',
  main: 'strength',
  cooldown: 'cooldown',
};

const SECTION_TITLE: Record<CustomSectionKind, L10n> = {
  warmup: { ru: 'Разминка', en: 'Warm-up' },
  main: { ru: 'Основная часть', en: 'Main' },
  cooldown: { ru: 'Заминка', en: 'Cool-down' },
};

function sectionToBlock(section: CustomWorkoutSection, index: number): Block {
  const items: WorkoutItem[] = section.items.map((it) => ({
    exerciseId: it.exerciseId,
    // WorkoutItemSchema demands exactly one measure; the builder only ever writes these two.
    ...(it.unit === 'seconds' ? { seconds: it.target } : { reps: it.target }),
    ...(it.perSide ? { perSide: true } : {}),
    ...(it.restAfterSec > 0 ? { restAfterSec: it.restAfterSec } : {}),
    ...(it.note?.trim() ? { note: { ru: it.note.trim(), en: it.note.trim() } } : {}),
  }));

  return {
    id: `b_${index + 1}_${section.kind}`,
    type: SECTION_TYPE[section.kind],
    format: section.format,
    title: section.title ? { ru: section.title, en: section.title } : SECTION_TITLE[section.kind],
    sets: Math.max(1, section.sets),
    ...(section.restBetweenRoundsSec ? { restBetweenRoundsSec: section.restBetweenRoundsSec } : {}),
    items,
    scalable: true,
  };
}

/**
 * `custom_workouts.points` is the builder's own estimate and may be anything the column allows;
 * `WorkoutSchema.basePoints` is bounded 60..250. Clamp rather than reject — this must match
 * admin_publish_course(), which writes the same number into public.workouts as the server-side
 * ceiling for a session.
 */
/** `yoga_flow` → `yoga-flow`: the default URL slug for a course whose slug is not set yet. */
export function slugFromId(id: string): string {
  return id.replace(/_/g, '-');
}

export function clampBasePoints(points: number | null | undefined): number {
  const n = Math.round(points ?? 100);
  if (!Number.isFinite(n)) return 100;
  return Math.max(60, Math.min(250, n));
}

function workoutFromDraft(w: WorkoutDraft): Workout {
  const blocks = w.structure.sections
    .filter((s) => s.items.length > 0)
    .map((s, i) => sectionToBlock(s, i));
  const name: L10n = { ru: w.title, en: w.title };
  const description: L10n = w.description?.trim()
    ? { ru: w.description.trim(), en: w.description.trim() }
    : name;
  return {
    id: w.shortId,
    name,
    focus: name,
    description,
    blocks,
    basePoints: clampBasePoints(w.points),
    tags: [],
  };
}

function nodeFromDay(day: CourseDayDraft): CourseNode {
  return {
    id: day.nodeId,
    week: day.week,
    day: day.day,
    kind: day.kind,
    ...(day.workoutShortId ? { workoutId: day.workoutShortId } : {}),
    title: l10n(day.content.title, `День ${day.sortOrder + 1}`),
    ...(day.content.subtitle?.ru || day.content.subtitle?.en
      ? { subtitle: l10n(day.content.subtitle, '') }
      : {}),
    ...(day.deload ? { deload: true } : {}),
    ...(day.stepsGoal ? { stepsGoal: day.stepsGoal } : {}),
  };
}

export interface DraftToCourseResult {
  /** The assembled course, whether or not it validates. */
  course: Course;
  /** Empty when the course is complete enough to publish; otherwise the zod messages. */
  issues: string[];
}

/**
 * Assemble the rows into a `Course`, and say whether it satisfies `CourseSchema`.
 *
 * The course is returned either way: the admin's preview has to render a half-written draft, and
 * the issues list is what the editor shows as "still missing". Only a course with no issues may
 * be published — the same standard a course written as a file has to meet.
 */
export function draftToCourse(
  draft: CourseDraft,
  days: CourseDayDraft[],
  workouts: readonly WorkoutDraft[],
): DraftToCourseResult {
  const ordered = [...days].sort(
    (a, b) => a.sortOrder - b.sortOrder || a.week - b.week || a.day - b.day,
  );
  const used = new Set(ordered.map((d) => d.workoutShortId).filter((id): id is string => !!id));
  const name = l10n(draft.content.name, draft.slugId);

  const course: Course = {
    id: draft.slugId,
    // CourseSchema wants a positive integer; sort_order defaults to 0 and is free to be anything.
    order: Math.max(1, draft.sortOrder || 1),
    // Ids are snake_case, URL slugs are kebab-case: a raw slug_id would fail SlugL10nSchema.
    slug: draft.content.slug ?? { ru: slugFromId(draft.slugId), en: slugFromId(draft.slugId) },
    name,
    tagline: l10n(draft.content.tagline, ''),
    description: l10n(draft.content.description, ''),
    longDescription: l10nList(draft.content.longDescription, ''),
    forWhom: l10nList(draft.content.forWhom, ''),
    outcomes: l10nList(draft.content.outcomes, ''),
    equipment: draft.equipment.filter(
      (e): e is Course['equipment'][number] => EquipmentSchema.safeParse(e).success,
    ),
    level: LevelSchema.safeParse(draft.level).success ? (draft.level as Course['level']) : 1,
    weeks: draft.weeks,
    sessionsPerWeek: draft.sessionsPerWeek,
    avgSessionMin: draft.avgSessionMin,
    tile: draft.tile,
    price: { rub: draft.priceRub, usd: draft.priceUsd },
    ...(draft.content.paymentUrl && (draft.content.paymentUrl.ru || draft.content.paymentUrl.en)
      ? { paymentUrl: draft.content.paymentUrl }
      : {}),
    ...(draft.content.introVideo && (draft.content.introVideo.ru || draft.content.introVideo.en)
      ? { introVideo: draft.content.introVideo }
      : {}),
    // Only the workouts the course actually uses, in the order the days first reach them.
    workouts: workouts.filter((w) => used.has(w.shortId)).map(workoutFromDraft),
    nodes: ordered.map(nodeFromDay),
    faq: (draft.content.faq ?? []).map((item) => ({
      q: l10n(item.q, ''),
      a: l10n(item.a, ''),
    })),
  };

  const parsed = CourseSchema.safeParse(course);
  const issues = parsed.success ? [] : parsed.error.issues.map((i) => i.message);
  return { course, issues };
}
