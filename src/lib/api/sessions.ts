/**
 * Workout sessions (table `workout_sessions`, own rows).
 * A session is started before the player opens and completed from the summary screen.
 */
import { supabase } from './client';
import { AppError } from './errors';
import { assertLocalDate, guard, requireUser, unwrap } from './internal';
import {
  completeSessionToDb,
  sessionFromDb,
  startSessionToDb,
  type DbWorkoutSession,
} from './mappers';
import type { CompleteSessionInput, StartSessionInput, WorkoutSessionRow } from './types';

const TABLE = 'workout_sessions';

/** Insert a started session and return its id (store it with the local player state). */
export async function startSession(input: StartSessionInput): Promise<{ id: string }> {
  return guard(async () => {
    assertLocalDate(input.localDate, 'local_date');
    const me = await requireUser();
    const row = unwrap<{ id: string }>(
      await supabase().from(TABLE).insert(startSessionToDb(me.id, input)).select('id').single(),
    );
    return { id: row.id };
  });
}

/** Store results + feedback and mark the session completed. */
export async function completeSession(
  id: string,
  patch: CompleteSessionInput,
): Promise<WorkoutSessionRow> {
  return guard(async () => {
    if (!(patch.rpe >= 1 && patch.rpe <= 10)) throw new AppError('validation', 'invalid_rpe');
    if (!(patch.completion >= 0 && patch.completion <= 1)) {
      throw new AppError('validation', 'invalid_completion');
    }
    const me = await requireUser();
    const row = unwrap<DbWorkoutSession>(
      await supabase()
        .from(TABLE)
        .update(completeSessionToDb(patch))
        .eq('id', id)
        .eq('user_id', me.id)
        .select('*')
        .single(),
    );
    return sessionFromDb(row);
  });
}

/** Completed sessions, newest first; optionally for one course. */
export async function listRecentSessions(
  limit = 20,
  courseId?: string,
): Promise<WorkoutSessionRow[]> {
  return guard(async () => {
    const me = await requireUser();
    let query = supabase()
      .from(TABLE)
      .select('*')
      .eq('user_id', me.id)
      .not('completed_at', 'is', null)
      .order('completed_at', { ascending: false })
      .limit(Math.max(1, Math.min(limit, 500)));
    if (courseId) query = query.eq('course_id', courseId);
    const rows = unwrap<DbWorkoutSession[]>(await query);
    return rows.map(sessionFromDb);
  });
}

/** Sessions (completed or not) with local_date in [from, to], oldest first. */
export async function listSessionsBetween(
  fromLocalDate: string,
  toLocalDate: string,
): Promise<WorkoutSessionRow[]> {
  return guard(async () => {
    assertLocalDate(fromLocalDate, 'from');
    assertLocalDate(toLocalDate, 'to');
    const me = await requireUser();
    const rows = unwrap<DbWorkoutSession[]>(
      await supabase()
        .from(TABLE)
        .select('*')
        .eq('user_id', me.id)
        .gte('local_date', fromLocalDate)
        .lte('local_date', toLocalDate)
        .order('local_date', { ascending: true })
        .order('started_at', { ascending: true }),
    );
    return rows.map(sessionFromDb);
  });
}

/** One session by id (own rows only); `not_found` otherwise. */
export async function getSession(id: string): Promise<WorkoutSessionRow> {
  return guard(async () => {
    const me = await requireUser();
    const row = unwrap<DbWorkoutSession>(
      await supabase().from(TABLE).select('*').eq('id', id).eq('user_id', me.id).single(),
    );
    return sessionFromDb(row);
  });
}
