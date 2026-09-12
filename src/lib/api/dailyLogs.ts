/**
 * Steps per local day (table `daily_logs`). Points are recomputed by a database trigger.
 *
 * A day may also carry a screenshot of the athlete's own step counter, in the private `proofs`
 * bucket. It is evidence, not arithmetic: the points still come from `steps`, and nothing here
 * reads the image. See `stepProofPath` below for where it lives.
 */
import { addDays, toLocalDateIso } from '@/lib/util/dates';
import { supabase } from './client';
import { demo } from './demo/load';
import { AppError } from './errors';
import { assertLocalDate, guard, requireUser, unwrap } from './internal';
import { dailyLogFromDb, type DbDailyLog } from './mappers';
import { isDemo } from './mode';
import type { DailyLogRow } from './types';

const TABLE = 'daily_logs';
export const MAX_STEPS = 100_000;

/** The private bucket the screenshot goes into; the same one the marathon's proofs use. */
export const STEP_PROOFS_BUCKET = 'proofs';

/**
 * Where a day's screenshot lives: `steps/<user_id>/<local_date>.<ext>`.
 *
 * One object per day, overwritten on re-upload — a second screenshot of the same day replaces the
 * first rather than leaving an orphan nobody will ever look at. The storage policy reads the
 * `<user_id>` folder to decide who may touch it, so the shape is load-bearing (migration 0012).
 */
export function stepProofPath(userId: string, localDate: string, ext: string): string {
  const safeExt = /^[a-z0-9]{1,5}$/i.test(ext) ? ext.toLowerCase() : 'jpg';
  return `steps/${userId}/${localDate}.${safeExt}`;
}

/**
 * How far back steps may still be edited: the RLS policy on `daily_logs` accepts a
 * write only for `current_date - 7 … current_date + 1` (server clock, UTC), so step
 * points cannot be backfilled or pre-filled into the leaderboard. UI that offers an
 * "edit this day" affordance must use this window.
 */
export const STEPS_EDIT_DAYS_BACK = 7;

/**
 * The client check adds a day of slack on each side, so the device's own calendar
 * day never rejects something the server would have accepted; it exists only to turn
 * a confusing "forbidden" into a validation error.
 */
function assertWritableDate(localDate: string): void {
  const today = toLocalDateIso();
  if (localDate < addDays(today, -(STEPS_EDIT_DAYS_BACK + 1)) || localDate > addDays(today, 2)) {
    throw new AppError('validation', 'local_date_out_of_range');
  }
}

/**
 * Create or update the steps for a local date.
 *
 * `note` and `proofPath` left undefined keep whatever is stored; passing `null` clears it. That
 * distinction matters here — the steps field and the screenshot are saved by the same button, and
 * a day that already has a screenshot must not lose it because the athlete corrected the number.
 */
export async function upsertDailyLog(
  localDate: string,
  steps: number,
  note?: string | null,
  proofPath?: string | null,
): Promise<DailyLogRow> {
  if (isDemo()) return (await demo()).upsertDailyLog(localDate, steps, note, proofPath);
  return guard(async () => {
    assertLocalDate(localDate, 'local_date');
    assertWritableDate(localDate);
    if (!Number.isInteger(steps) || steps < 0 || steps > MAX_STEPS) {
      throw new AppError('validation', 'invalid_steps');
    }
    const me = await requireUser();
    const payload: {
      user_id: string;
      local_date: string;
      steps: number;
      note?: string | null;
      proof_path?: string | null;
    } = {
      user_id: me.id,
      local_date: localDate,
      steps,
    };
    if (note !== undefined) payload.note = note === null ? null : note.trim() || null;
    if (proofPath !== undefined) payload.proof_path = proofPath || null;
    const row = unwrap<DbDailyLog>(
      await supabase()
        .from(TABLE)
        .upsert(payload, { onConflict: 'user_id,local_date' })
        .select('*')
        .single(),
    );
    return dailyLogFromDb(row);
  });
}

/** Logs with local_date in [from, to], oldest first. */
export async function listDailyLogs(
  fromLocalDate: string,
  toLocalDate: string,
): Promise<DailyLogRow[]> {
  if (isDemo()) return (await demo()).listDailyLogs(fromLocalDate, toLocalDate);
  return guard(async () => {
    assertLocalDate(fromLocalDate, 'from');
    assertLocalDate(toLocalDate, 'to');
    const me = await requireUser();
    const rows = unwrap<DbDailyLog[]>(
      await supabase()
        .from(TABLE)
        .select('*')
        .eq('user_id', me.id)
        .gte('local_date', fromLocalDate)
        .lte('local_date', toLocalDate)
        .order('local_date', { ascending: true }),
    );
    return rows.map(dailyLogFromDb);
  });
}
