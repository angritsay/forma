/**
 * Adaptive per-course state (table `user_course_state`, pk user_id + course_id).
 */
import { supabase } from './client';
import { demo } from './demo/load';
import { AppError } from './errors';
import { COURSE_ID_RE, guard, requireUser, unwrap, unwrapMaybe } from './internal';
import { courseStateFromDb, courseStatePatchToDb, type DbCourseState } from './mappers';
import { isDemo } from './mode';
import type { CourseStatePatch, CourseStateRow } from './types';

const TABLE = 'user_course_state';

/** All course states of the current user, most recently updated first. */
export async function listCourseStates(): Promise<CourseStateRow[]> {
  if (isDemo()) return (await demo()).listCourseStates();
  return guard(async () => {
    const me = await requireUser();
    const rows = unwrap<DbCourseState[]>(
      await supabase()
        .from(TABLE)
        .select('*')
        .eq('user_id', me.id)
        .order('updated_at', { ascending: false }),
    );
    return rows.map(courseStateFromDb);
  });
}

/** State for one course, or null when the user has not started it. */
export async function getCourseState(courseId: string): Promise<CourseStateRow | null> {
  if (isDemo()) return (await demo()).getCourseState(courseId);
  return guard(async () => {
    const me = await requireUser();
    const row = unwrapMaybe<DbCourseState>(
      await supabase()
        .from(TABLE)
        .select('*')
        .eq('user_id', me.id)
        .eq('course_id', courseId)
        .maybeSingle(),
    );
    return row ? courseStateFromDb(row) : null;
  });
}

/** Create or partially update the state for a course; returns the stored row. */
export async function upsertCourseState(
  courseId: string,
  patch: CourseStatePatch,
): Promise<CourseStateRow> {
  if (isDemo()) return (await demo()).upsertCourseState(courseId, patch);
  return guard(async () => {
    if (!COURSE_ID_RE.test(courseId)) throw new AppError('validation', 'invalid_course');
    if (patch.scale !== undefined && !(patch.scale >= 0.3 && patch.scale <= 2)) {
      throw new AppError('validation', 'invalid_scale');
    }
    const me = await requireUser();
    const row = unwrap<DbCourseState>(
      await supabase()
        .from(TABLE)
        .upsert(
          { user_id: me.id, course_id: courseId, ...courseStatePatchToDb(patch) },
          { onConflict: 'user_id,course_id' },
        )
        .select('*')
        .single(),
    );
    return courseStateFromDb(row);
  });
}

/**
 * Create the state for a course only when there is none, and return whatever is stored.
 *
 * Insert-only on purpose (`ignoreDuplicates`): the first start of a course writes the starting
 * scale and day one, and a plain upsert with those values was how a device that simply had not
 * seen the row yet — a flaky network, a list read that failed — reset somebody to day one. When
 * the row already exists nothing is written and the stored one is read back instead.
 */
export async function createCourseState(
  courseId: string,
  patch: CourseStatePatch,
): Promise<CourseStateRow> {
  if (isDemo()) return (await demo()).createCourseState(courseId, patch);
  return guard(async () => {
    if (!COURSE_ID_RE.test(courseId)) throw new AppError('validation', 'invalid_course');
    const me = await requireUser();
    const inserted = unwrap<DbCourseState[]>(
      await supabase()
        .from(TABLE)
        .upsert(
          { user_id: me.id, course_id: courseId, ...courseStatePatchToDb(patch) },
          { onConflict: 'user_id,course_id', ignoreDuplicates: true },
        )
        .select('*'),
    );
    if (inserted[0]) return courseStateFromDb(inserted[0]);
    const existing = await getCourseState(courseId);
    if (!existing) throw new AppError('not_found', 'course_state_missing');
    return existing;
  });
}
