/**
 * Courses composed in the admin panel: `admin_courses` + `admin_course_days`, and the publish /
 * unpublish RPCs that make one real.
 *
 * Everything here is admin-only by RLS except {@link listPublishedCourses}, which is what the app
 * uses to show DB courses alongside the compiled ones. The shape returned is deliberately close to
 * the tables; turning a bundle into the `Course` the rest of the product understands is
 * `draftToCourse()` in src/lib/courses/draft.ts, not this module's job.
 */
import { parseCourseContent, parseDayContent } from '@/lib/courses/draft';
import { supabase } from './client';
import { demo } from './demo/load';
import { currentUser, guard, unwrap, unwrapVoid } from './internal';
import { isDemo } from './mode';
import type {
  AdminCourseBundle,
  AdminCourseDayPatch,
  AdminCourseDayRow,
  AdminCoursePatch,
  AdminCourseRow,
  CustomWorkoutRow,
} from './types';

interface DbCourse {
  id: string;
  slug_id: string;
  status: AdminCourseRow['status'];
  sort_order: number;
  level: number;
  weeks: number;
  sessions_per_week: number;
  avg_session_min: number;
  equipment: string[] | null;
  tile: string;
  price_rub: number | string;
  price_usd: number | string;
  content: unknown;
  published_at: string | null;
  created_at: string;
  updated_at: string;
}

interface DbDay {
  id: string;
  course_id: string;
  node_id: string;
  week: number;
  day: number;
  kind: AdminCourseDayRow['kind'];
  custom_workout_id: string | null;
  content: unknown;
  deload: boolean;
  steps_goal: number | null;
  sort_order: number;
}

/** numeric(10,2) arrives as a string from PostgREST; a price must still be a number. */
const num = (v: number | string): number => (typeof v === 'number' ? v : Number(v) || 0);

function courseFromDb(r: DbCourse): AdminCourseRow {
  return {
    id: r.id,
    slugId: r.slug_id,
    status: r.status,
    sortOrder: r.sort_order,
    level: r.level,
    weeks: r.weeks,
    sessionsPerWeek: r.sessions_per_week,
    avgSessionMin: r.avg_session_min,
    equipment: r.equipment ?? [],
    tile: r.tile,
    priceRub: num(r.price_rub),
    priceUsd: num(r.price_usd),
    content: parseCourseContent(r.content),
    publishedAt: r.published_at,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  };
}

function dayFromDb(r: DbDay): AdminCourseDayRow {
  return {
    id: r.id,
    courseId: r.course_id,
    nodeId: r.node_id,
    week: r.week,
    day: r.day,
    kind: r.kind,
    customWorkoutId: r.custom_workout_id,
    content: parseDayContent(r.content),
    deload: r.deload,
    stepsGoal: r.steps_goal,
    sortOrder: r.sort_order,
  };
}

/**
 * Only the fields the caller actually set are sent.
 *
 * The distinction that matters is `undefined` (leave alone) versus `null` (clear): the editor
 * saves one field at a time, and a mapper that spread the whole object would blank everything the
 * form was not showing. Exported for its test.
 */
export function coursePatchToDb(patch: AdminCoursePatch): Record<string, unknown> {
  const db: Record<string, unknown> = {};
  if (patch.slugId !== undefined) db.slug_id = patch.slugId;
  if (patch.sortOrder !== undefined) db.sort_order = patch.sortOrder;
  if (patch.level !== undefined) db.level = patch.level;
  if (patch.weeks !== undefined) db.weeks = patch.weeks;
  if (patch.sessionsPerWeek !== undefined) db.sessions_per_week = patch.sessionsPerWeek;
  if (patch.avgSessionMin !== undefined) db.avg_session_min = patch.avgSessionMin;
  if (patch.equipment !== undefined) db.equipment = patch.equipment;
  if (patch.tile !== undefined) db.tile = patch.tile;
  if (patch.priceRub !== undefined) db.price_rub = patch.priceRub;
  if (patch.priceUsd !== undefined) db.price_usd = patch.priceUsd;
  if (patch.content !== undefined) db.content = patch.content;
  return db;
}

export function dayPatchToDb(patch: AdminCourseDayPatch): Record<string, unknown> {
  const db: Record<string, unknown> = {};
  if (patch.nodeId !== undefined) db.node_id = patch.nodeId;
  if (patch.week !== undefined) db.week = patch.week;
  if (patch.day !== undefined) db.day = patch.day;
  if (patch.kind !== undefined) db.kind = patch.kind;
  // A rest day or milestone must carry no workout; the table's check constraint enforces it, and
  // clearing it here means changing a day's kind in the editor never leaves a stale reference.
  if (patch.customWorkoutId !== undefined) db.custom_workout_id = patch.customWorkoutId;
  if (patch.content !== undefined) db.content = patch.content;
  if (patch.deload !== undefined) db.deload = patch.deload;
  if (patch.stepsGoal !== undefined) db.steps_goal = patch.stepsGoal;
  if (patch.sortOrder !== undefined) db.sort_order = patch.sortOrder;
  return db;
}

const COURSE_COLS = '*';
const DAY_COLS = '*';

// --- admin: courses ---------------------------------------------------------

/** Every course the coach has, drafts included, in catalogue order. */
export async function listAdminCourses(): Promise<AdminCourseRow[]> {
  if (isDemo()) return (await demo()).listAdminCourses();
  return guard(async () => {
    const rows = unwrap<DbCourse[]>(
      await supabase()
        .from('admin_courses')
        .select(COURSE_COLS)
        .order('sort_order', { ascending: true })
        .order('created_at', { ascending: true }),
    );
    return rows.map(courseFromDb);
  });
}

/** One course with its days and the workouts those days play — everything the editor needs. */
export async function getAdminCourse(id: string): Promise<AdminCourseBundle> {
  if (isDemo()) return (await demo()).getAdminCourse(id);
  return guard(async () => {
    const course = courseFromDb(
      unwrap<DbCourse>(
        await supabase().from('admin_courses').select(COURSE_COLS).eq('id', id).single(),
      ),
    );
    const days = unwrap<DbDay[]>(
      await supabase()
        .from('admin_course_days')
        .select(DAY_COLS)
        .eq('course_id', id)
        .order('sort_order', { ascending: true }),
    ).map(dayFromDb);

    const ids = [...new Set(days.map((d) => d.customWorkoutId).filter((v): v is string => !!v))];
    const workouts = ids.length
      ? unwrap<
          {
            id: string;
            short_id: string;
            title: string;
            description: string | null;
            structure: unknown;
            est_sec: number | null;
            points: number | null;
            share_token: string | null;
            created_at: string;
            updated_at: string;
          }[]
        >(await supabase().from('custom_workouts').select('*').in('id', ids)).map(
          (r): CustomWorkoutRow => ({
            id: r.id,
            shortId: r.short_id,
            title: r.title,
            description: r.description,
            structure: r.structure,
            estSec: r.est_sec,
            points: r.points,
            shareToken: r.share_token,
            createdAt: r.created_at,
            updatedAt: r.updated_at,
          }),
        )
      : [];

    return { course, days, workouts };
  });
}

/**
 * Start a new course. Only `slugId` is required — everything else has a column default, because a
 * course is written over many sittings and the editor must be able to save an almost-empty one.
 */
export async function createAdminCourse(
  slugId: string,
  patch: AdminCoursePatch = {},
): Promise<AdminCourseRow> {
  if (isDemo()) return (await demo()).createAdminCourse(slugId, patch);
  return guard(async () => {
    const me = await currentUser();
    const row = unwrap<DbCourse>(
      await supabase()
        .from('admin_courses')
        .insert({ ...coursePatchToDb(patch), slug_id: slugId, author_id: me?.id ?? null })
        .select(COURSE_COLS)
        .single(),
    );
    return courseFromDb(row);
  });
}

export async function updateAdminCourse(
  id: string,
  patch: AdminCoursePatch,
): Promise<AdminCourseRow> {
  if (isDemo()) return (await demo()).updateAdminCourse(id, patch);
  return guard(async () => {
    const row = unwrap<DbCourse>(
      await supabase()
        .from('admin_courses')
        .update(coursePatchToDb(patch))
        .eq('id', id)
        .select(COURSE_COLS)
        .single(),
    );
    return courseFromDb(row);
  });
}

/**
 * Delete a course and its days.
 *
 * The generated `public.courses` / `public.workouts` rows a publish created are left alone on
 * purpose: someone may have bought the course, and removing them would strip their entitlement and
 * re-score their history. Unpublish is the reversible action; this one is for a draft.
 */
export async function deleteAdminCourse(id: string): Promise<void> {
  if (isDemo()) return (await demo()).deleteAdminCourse(id);
  return guard(async () => {
    unwrapVoid(await supabase().from('admin_courses').delete().eq('id', id));
  });
}

/** Publish. Throws with `course_too_short` / `course_has_empty_days` when the draft is not ready. */
export async function publishAdminCourse(id: string): Promise<void> {
  if (isDemo()) return (await demo()).publishAdminCourse(id);
  return guard(async () => {
    unwrapVoid(await supabase().rpc('admin_publish_course', { p_course: id }));
  });
}

/** Take a course off the catalogue; existing owners keep it. */
export async function unpublishAdminCourse(id: string): Promise<void> {
  if (isDemo()) return (await demo()).unpublishAdminCourse(id);
  return guard(async () => {
    unwrapVoid(await supabase().rpc('admin_unpublish_course', { p_course: id }));
  });
}

// --- admin: days ------------------------------------------------------------

export async function createCourseDay(
  courseId: string,
  patch: AdminCourseDayPatch & { nodeId: string; week: number; day: number; kind: string },
): Promise<AdminCourseDayRow> {
  if (isDemo()) return (await demo()).createCourseDay(courseId, patch);
  return guard(async () => {
    const row = unwrap<DbDay>(
      await supabase()
        .from('admin_course_days')
        .insert({ ...dayPatchToDb(patch), course_id: courseId })
        .select(DAY_COLS)
        .single(),
    );
    return dayFromDb(row);
  });
}

export async function updateCourseDay(
  id: string,
  patch: AdminCourseDayPatch,
): Promise<AdminCourseDayRow> {
  if (isDemo()) return (await demo()).updateCourseDay(id, patch);
  return guard(async () => {
    const row = unwrap<DbDay>(
      await supabase()
        .from('admin_course_days')
        .update(dayPatchToDb(patch))
        .eq('id', id)
        .select(DAY_COLS)
        .single(),
    );
    return dayFromDb(row);
  });
}

export async function deleteCourseDay(id: string): Promise<void> {
  if (isDemo()) return (await demo()).deleteCourseDay(id);
  return guard(async () => {
    unwrapVoid(await supabase().from('admin_course_days').delete().eq('id', id));
  });
}

/**
 * Write a new order for a course's days.
 *
 * One request per day rather than an upsert: `admin_course_days` has a unique (course_id, week,
 * day), and an upsert of the whole list would transiently collide whenever two days swap slots.
 * Reordering is rare and a course is tens of days, so the round trips are affordable and the
 * constraint stays honest.
 */
export async function reorderCourseDays(
  days: readonly { id: string; sortOrder: number; week: number; day: number }[],
): Promise<void> {
  if (isDemo()) return (await demo()).reorderCourseDays(days);
  return guard(async () => {
    for (const d of days) {
      unwrapVoid(
        await supabase()
          .from('admin_course_days')
          .update({ sort_order: d.sortOrder, week: d.week, day: d.day })
          .eq('id', d.id),
      );
    }
  });
}

// --- the app ----------------------------------------------------------------

/**
 * Published DB courses, for the app's catalogue. Readable by any signed-in user (RLS), same as the
 * compiled courses are readable by anyone who has the bundle.
 */
export async function listPublishedCourses(): Promise<AdminCourseBundle[]> {
  if (isDemo()) return (await demo()).listPublishedCourses();
  return guard(async () => {
    const courses = unwrap<DbCourse[]>(
      await supabase()
        .from('admin_courses')
        .select(COURSE_COLS)
        .eq('status', 'published')
        .order('sort_order', { ascending: true }),
    ).map(courseFromDb);
    if (courses.length === 0) return [];

    const days = unwrap<DbDay[]>(
      await supabase()
        .from('admin_course_days')
        .select(DAY_COLS)
        .in(
          'course_id',
          courses.map((c) => c.id),
        )
        .order('sort_order', { ascending: true }),
    ).map(dayFromDb);

    /*
     * The workouts come back only for courses the caller owns — that is the RLS policy, not a bug
     * to work around. A catalogue entry for a course you have not bought shows its shape (the days)
     * without its content (the workouts), exactly as the compiled courses behave.
     */
    const ids = [...new Set(days.map((d) => d.customWorkoutId).filter((v): v is string => !!v))];
    const workouts = ids.length
      ? unwrap<
          {
            id: string;
            short_id: string;
            title: string;
            description: string | null;
            structure: unknown;
            est_sec: number | null;
            points: number | null;
            created_at: string;
            updated_at: string;
          }[]
        >(
          await supabase()
            .from('custom_workouts')
            .select(
              'id, short_id, title, description, structure, est_sec, points, created_at, updated_at',
            )
            .in('id', ids),
        ).map((r): CustomWorkoutRow => ({
          id: r.id,
          shortId: r.short_id,
          title: r.title,
          description: r.description,
          structure: r.structure,
          estSec: r.est_sec,
          points: r.points,
          shareToken: null,
          createdAt: r.created_at,
          updatedAt: r.updated_at,
        }))
      : [];

    const byCourse = new Map<string, AdminCourseDayRow[]>();
    for (const d of days) {
      const list = byCourse.get(d.courseId);
      if (list) list.push(d);
      else byCourse.set(d.courseId, [d]);
    }
    const workoutById = new Map(workouts.map((w) => [w.id, w]));

    return courses.map((course) => {
      const courseDays = byCourse.get(course.id) ?? [];
      const used = [
        ...new Set(courseDays.map((d) => d.customWorkoutId).filter((v): v is string => !!v)),
      ];
      return {
        course,
        days: courseDays,
        workouts: used.map((id) => workoutById.get(id)).filter((w): w is CustomWorkoutRow => !!w),
      };
    });
  });
}
