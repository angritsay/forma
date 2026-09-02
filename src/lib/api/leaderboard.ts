/**
 * Leaderboard (RPC `get_leaderboard`, security definer — never exposes emails).
 */
import { supabase } from './client';
import { AppError } from './errors';
import { COURSE_ID_RE, guard, requireUser, unwrap } from './internal';
import { leaderboardRowFromDb, type DbLeaderboardRow } from './mappers';
import type { LeaderboardPeriod, LeaderboardRow } from './types';

/** Top `limit` athletes for the period (+ the caller's own row, always included). */
export async function getLeaderboard(
  period: LeaderboardPeriod,
  courseId?: string,
  limit = 100,
): Promise<LeaderboardRow[]> {
  return guard(async () => {
    if (courseId !== undefined && !COURSE_ID_RE.test(courseId)) {
      throw new AppError('validation', 'invalid_course');
    }
    await requireUser();
    const rows = unwrap<DbLeaderboardRow[]>(
      await supabase().rpc('get_leaderboard', {
        p_period: period,
        p_course_id: courseId ?? null,
        p_limit: Math.max(1, Math.min(limit, 500)),
      }),
    );
    return rows.map(leaderboardRowFromDb);
  });
}
