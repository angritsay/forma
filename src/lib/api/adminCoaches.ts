/**
 * The admin's half of our own calendar (0055): each coach's room link, weekly hours and per-date
 * exceptions, and moving or cancelling a session.
 *
 * Every call is re-checked server-side. The coach's address and room link are not readable from
 * the table at all (column grants), so they come through `admin_coaches()` and go back through
 * `admin_save_coach()`; the week is replaced whole by `admin_set_availability()`, so a half-saved
 * week never offers slots nobody meant. Exceptions are plain rows under the «admins write» policy.
 *
 * Kept out of `admin.ts` for the reason `adminInbox.ts` is: one screen owns these calls, and the
 * mappers are pure so they are tested without a database.
 */
import { formatClock, parseClock, type WeeklyRule } from '@/lib/coach/slots';
import { supabase } from './client';
import { demo } from './demo/load';
import { AppError } from './errors';
import { assertLocalDate, EMAIL_RE, guard, unwrap, unwrapMaybe, unwrapVoid } from './internal';
import { isDemo } from './mode';

export interface AdminCoach {
  id: string;
  name: string;
  nameEn: string | null;
  email: string | null;
  roomUrl: string | null;
  timezone: string;
  active: boolean;
  /** The feature flag a client needs to book this coach (`coach_nastia`); null = everybody. */
  flag: string | null;
}

export interface CoachException {
  id: string;
  /** `YYYY-MM-DD` in the coach's zone. */
  date: string;
  /** `HH:MM`, or null for the whole day. */
  start: string | null;
  end: string | null;
  kind: 'off' | 'extra';
  note: string | null;
}

export interface CoachAvailability {
  rules: WeeklyRule[];
  /** Today's and later, soonest first. */
  exceptions: CoachException[];
}

export interface CoachPatch {
  /** Empty string clears it. */
  roomUrl?: string;
  /** Empty string clears it. */
  email?: string;
  active?: boolean;
}

export interface ExceptionDraft {
  date: string;
  start: string | null;
  end: string | null;
  kind: 'off' | 'extra';
  note?: string | null;
}

// --- mappers -----------------------------------------------------------------------------------

export interface DbAdminCoach {
  id: string;
  name: string;
  name_en: string | null;
  email: string | null;
  room_url: string | null;
  timezone: string | null;
  active: boolean | null;
  flag: string | null;
}

export function adminCoachFromDb(r: DbAdminCoach): AdminCoach {
  return {
    id: r.id,
    name: r.name,
    nameEn: r.name_en ?? null,
    email: r.email ?? null,
    // The column only ever holds https; checked again because it becomes a link.
    roomUrl: r.room_url && /^https:\/\//.test(r.room_url) ? r.room_url : null,
    timezone: r.timezone || 'Europe/Moscow',
    active: r.active !== false,
    flag: r.flag ?? null,
  };
}

export interface DbRule {
  weekday: number;
  start_time: string;
  end_time: string;
}

/** A rule from the table; Postgres prints `time` as `HH:MM:SS`. Unreadable rows are dropped. */
export function ruleFromDb(r: DbRule): WeeklyRule | null {
  const a = parseClock(r.start_time);
  const b = parseClock(r.end_time);
  if (a === null || b === null || !(r.weekday >= 1 && r.weekday <= 7)) return null;
  return { weekday: r.weekday, start: formatClock(a), end: formatClock(b) };
}

export interface DbException {
  id: string;
  date: string;
  start_time: string | null;
  end_time: string | null;
  kind: string;
  note: string | null;
}

export function exceptionFromDb(r: DbException): CoachException {
  const a = parseClock(r.start_time);
  const b = parseClock(r.end_time);
  const timed = a !== null && b !== null;
  return {
    id: r.id,
    date: r.date,
    start: timed ? formatClock(a) : null,
    end: timed ? formatClock(b) : null,
    kind: r.kind === 'extra' ? 'extra' : 'off',
    note: r.note ?? null,
  };
}

/**
 * The row an exception is written as, or a validation error named for the field: an extra window
 * needs both times, a day off needs neither, a timed one runs forwards.
 */
export function exceptionToDb(
  coach: string,
  draft: ExceptionDraft,
): Omit<DbException, 'id'> & {
  coach_id: string;
} {
  assertLocalDate(draft.date, 'date');
  const start = draft.start?.trim() || null;
  const end = draft.end?.trim() || null;
  if ((start === null) !== (end === null)) throw new AppError('validation', 'invalid_times');
  if (draft.kind === 'extra' && start === null) throw new AppError('validation', 'invalid_times');
  if (start !== null && end !== null) {
    const a = parseClock(start);
    const b = parseClock(end);
    if (a === null || b === null || b <= a) throw new AppError('validation', 'invalid_times');
  }
  const note = draft.note?.trim() || null;
  return {
    coach_id: coach,
    date: draft.date,
    start_time: start,
    end_time: end,
    kind: draft.kind,
    note: note ? note.slice(0, 200) : null,
  };
}

/** The room link as the server will accept it, or a validation error. Empty clears it. */
export function cleanRoomUrl(value: string): string {
  const v = value.trim();
  if (v === '') return '';
  if (!/^https:\/\/\S+$/.test(v) || v.length > 2000) {
    throw new AppError('validation', 'invalid_room_url');
  }
  return v;
}

// --- calls -------------------------------------------------------------------------------------

export async function listCoaches(): Promise<AdminCoach[]> {
  if (isDemo()) return (await demo()).listCoaches();
  return guard(async () => {
    const rows = unwrap<DbAdminCoach[]>(await supabase().rpc('admin_coaches'));
    return rows.map(adminCoachFromDb);
  });
}

export async function saveCoach(id: string, patch: CoachPatch): Promise<void> {
  const roomUrl = patch.roomUrl === undefined ? undefined : cleanRoomUrl(patch.roomUrl);
  const email = patch.email === undefined ? undefined : patch.email.trim().toLowerCase();
  if (email && !EMAIL_RE.test(email)) throw new AppError('validation', 'invalid_email');
  if (isDemo()) return (await demo()).saveCoach(id, { ...patch, roomUrl, email });
  return guard(async () => {
    unwrapMaybe<string>(
      await supabase().rpc('admin_save_coach', {
        p_id: id,
        p_room_url: roomUrl ?? null,
        p_email: email ?? null,
        p_active: patch.active ?? null,
      }),
    );
  });
}

export async function getAvailability(coach: string, today: string): Promise<CoachAvailability> {
  assertLocalDate(today, 'date');
  if (isDemo()) return (await demo()).getAvailability(coach, today);
  return guard(async () => {
    const [rules, exceptions] = await Promise.all([
      supabase()
        .from('coach_availability')
        .select('weekday, start_time, end_time')
        .eq('coach_id', coach)
        .order('weekday')
        .order('start_time'),
      supabase()
        .from('coach_availability_exceptions')
        .select('id, date, start_time, end_time, kind, note')
        .eq('coach_id', coach)
        .gte('date', today)
        .order('date')
        .order('start_time', { nullsFirst: true }),
    ]);
    return {
      rules: (unwrapMaybe<DbRule[]>(rules) ?? [])
        .map(ruleFromDb)
        .filter((r): r is WeeklyRule => r !== null),
      exceptions: (unwrapMaybe<DbException[]>(exceptions) ?? []).map(exceptionFromDb),
    };
  });
}

/** Replace the coach's whole week (`admin_set_availability`). */
export async function setWeeklyRules(coach: string, rules: readonly WeeklyRule[]): Promise<void> {
  if (isDemo()) return (await demo()).setWeeklyRules(coach, rules);
  return guard(async () => {
    unwrapMaybe<number>(
      await supabase().rpc('admin_set_availability', { p_coach: coach, p_rules: rules }),
    );
  });
}

export async function addException(coach: string, draft: ExceptionDraft): Promise<void> {
  const row = exceptionToDb(coach, draft);
  if (isDemo()) return (await demo()).addException(coach, draft);
  return guard(async () => {
    unwrapVoid(await supabase().from('coach_availability_exceptions').insert(row));
  });
}

export async function deleteException(id: string): Promise<void> {
  if (isDemo()) return (await demo()).deleteException(id);
  return guard(async () => {
    unwrapVoid(await supabase().from('coach_availability_exceptions').delete().eq('id', id));
  });
}

/** Move a session to any future time the coach agreed to (`admin_move_booking`). */
export async function adminMoveBooking(id: string, startsAt: string): Promise<void> {
  if (!Number.isFinite(Date.parse(startsAt))) throw new AppError('validation', 'invalid_times');
  if (isDemo()) return (await demo()).adminMoveBooking(id, startsAt);
  return guard(async () => {
    unwrapMaybe<unknown>(
      await supabase().rpc('admin_move_booking', { p_id: id, p_new_starts_at: startsAt }),
    );
  });
}

/** Cancel a session; the row stays, money goes back by hand if at all (`admin_cancel_booking`). */
export async function adminCancelBooking(id: string, reason: string | null): Promise<void> {
  if (isDemo()) return (await demo()).adminCancelBooking(id, reason);
  return guard(async () => {
    unwrapMaybe<string>(
      await supabase().rpc('admin_cancel_booking', { p_id: id, p_reason: reason?.trim() || null }),
    );
  });
}
