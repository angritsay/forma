/**
 * Our own calendar (0055) for the demo backend: free slots, the hold, the move, and the admin's
 * editor, over the local store and by the same rules as the SQL.
 *
 * Slots come from `generateSlots` (`src/lib/coach/slots.ts`), the rule `booking_slots` applies,
 * so the demo offers what the real calendar would for the same week. A demo stored before the
 * calendar existed gets both coaches and a plausible week on first read — nobody has to open the
 * admin to see the picker work.
 *
 * Two liberties, both because the demo has no till and no roles:
 *   * `confirmDemoHold` is the payment: it turns the hold into a session the way
 *     `apply_session_payment` does, room link included;
 *   * the admin calls are open to whoever is signed in, like the rest of the demo's admin.
 */
import { BOOKING } from '@content/site/booking';
import {
  canSelfMove,
  generateSlots,
  HOLD_MINUTES,
  type SlotTimes,
  type WeeklyRule,
} from '@/lib/coach/slots';
import { guard } from '../internal';
import { AppError } from '../errors';
import type { AdminBooking, BookingScope } from '../adminInbox';
import type { AdminCoach, CoachAvailability, CoachPatch, ExceptionDraft } from '../adminCoaches';
import { exceptionToDb } from '../adminCoaches';
import type { BookingHold, FreeSlot, SessionOption } from '../types';
import { delay } from './latency';
import {
  currentDemoUser,
  demoId,
  mutateDb,
  nowIso,
  readDb,
  type DemoCoach,
  type DemoCoachBooking,
  type DemoCoachRule,
  type DemoDb,
} from './store';

const MINUTE = 60_000;

async function run<T>(fn: () => T): Promise<T> {
  await delay();
  return guard(async () => fn());
}

function requireUser() {
  const user = currentDemoUser();
  if (!user) throw new AppError('auth', 'not_signed_in');
  return user;
}

const SEED_COACHES: DemoCoach[] = [
  {
    id: 'sergey',
    name: 'Сергей',
    nameEn: 'Sergey',
    email: null,
    roomUrl: 'https://example.com/room/sergey',
    timezone: 'Europe/Moscow',
    active: true,
    flag: null,
  },
  {
    id: 'nastia',
    name: 'Nastia',
    nameEn: 'Nastia',
    email: null,
    roomUrl: 'https://example.com/room/nastia',
    timezone: 'Europe/Moscow',
    active: true,
    flag: 'coach_nastia',
  },
];

/** A plausible week: his mornings and evenings on weekdays and a Saturday morning; her two days. */
const SEED_RULES: DemoCoachRule[] = [
  ...[1, 2, 3, 4, 5].flatMap((weekday) => [
    { coachId: 'sergey', weekday, start: '10:00', end: '13:00' },
    { coachId: 'sergey', weekday, start: '18:00', end: '21:00' },
  ]),
  { coachId: 'sergey', weekday: 6, start: '11:00', end: '14:00' },
  { coachId: 'nastia', weekday: 2, start: '12:00', end: '16:00' },
  { coachId: 'nastia', weekday: 4, start: '12:00', end: '16:00' },
];

/** The calendar tables, seeded on first use (they are optional in a stored demo). */
function calendar(db: DemoDb) {
  db.coaches ??= SEED_COACHES.map((c) => ({ ...c }));
  db.coachRules ??= SEED_RULES.map((r) => ({ ...r }));
  db.coachExceptions ??= [];
  return { coaches: db.coaches, rules: db.coachRules, exceptions: db.coachExceptions };
}

function minutesOf(option: SessionOption): number {
  const found = BOOKING.options.find((o) => o.id === option);
  if (!found) throw new AppError('validation', 'invalid_option');
  return found.durationMin;
}

/** `booking_coach_visible`: active, and open or behind a flag the caller has. */
function visibleCoach(db: DemoDb, coach: string): DemoCoach {
  const found = calendar(db).coaches.find((c) => c.id === coach && c.active);
  const user = currentDemoUser();
  const flagged =
    !found?.flag ||
    (db.featureFlags ?? []).some((f) => f.flag === found.flag && f.userId === user?.id);
  if (!found || !flagged) throw new AppError('validation', 'coach_unavailable');
  return found;
}

/** Busy time of a coach: active sessions and live holds, minus the booking being moved. */
function busyOf(db: DemoDb, coach: string, now: number, ignore?: string): SlotTimes[] {
  return db.coachBookings
    .filter(
      (b) =>
        b.id !== ignore &&
        (b.coach_id ?? 'sergey') === coach &&
        (b.status === 'active' ||
          (b.status === 'pending' && Date.parse(b.hold_expires_at ?? '') > now)),
    )
    .map((b) => ({ startsAt: b.starts_at, endsAt: b.ends_at }));
}

function slotsFor(
  db: DemoDb,
  coach: DemoCoach,
  option: SessionOption,
  from: number,
  to: number,
  ignore?: string,
): SlotTimes[] {
  const now = Date.now();
  const { rules, exceptions } = calendar(db);
  return generateSlots({
    rules: rules.filter((r) => r.coachId === coach.id),
    exceptions: exceptions.filter((e) => e.coachId === coach.id),
    busy: busyOf(db, coach.id, now, ignore),
    minutes: minutesOf(option),
    from,
    to,
    now,
    timeZone: coach.timezone,
    leadMinutes: BOOKING.leadTimeMin,
  });
}

function isFree(
  db: DemoDb,
  coach: DemoCoach,
  option: SessionOption,
  startsAt: string,
  ignore?: string,
) {
  const at = Date.parse(startsAt);
  return slotsFor(db, coach, option, at, at + MINUTE, ignore).some(
    (s) => Date.parse(s.startsAt) === at,
  );
}

function asHold(b: DemoCoachBooking): BookingHold {
  return {
    id: b.id,
    coachId: b.coach_id ?? '',
    optionId: b.option_id === 'hour' ? 'hour' : 'half',
    startsAt: b.starts_at,
    endsAt: b.ends_at,
    holdExpiresAt: b.hold_expires_at ?? nowIso(),
  };
}

function liveHold(db: DemoDb, email: string): DemoCoachBooking | undefined {
  const now = Date.now();
  return db.coachBookings.find(
    (b) => b.email === email && b.status === 'pending' && Date.parse(b.hold_expires_at ?? '') > now,
  );
}

// --- client ------------------------------------------------------------------------------------

export async function listFreeSlots(
  coach: string,
  option: SessionOption,
  fromIso: string,
  toIso: string,
): Promise<FreeSlot[]> {
  return run(() => {
    requireUser();
    return mutateDb((db) => {
      const c = visibleCoach(db, coach);
      return slotsFor(db, c, option, Date.parse(fromIso), Date.parse(toIso));
    });
  });
}

export async function holdSlot(
  coach: string,
  option: SessionOption,
  startsAt: string,
): Promise<BookingHold | null> {
  return run(() => {
    const user = requireUser();
    return mutateDb((db) => {
      const c = visibleCoach(db, coach);
      const at = new Date(Date.parse(startsAt)).toISOString();
      const same = liveHold(db, user.email);
      if (same && same.coach_id === coach && same.option_id === option && same.starts_at === at) {
        return asHold(same);
      }
      // The caller's own hold does not stand in the way of their new pick.
      if (!isFree(db, c, option, at, same?.id)) return null;
      for (const b of db.coachBookings) {
        if (b.email === user.email && b.status === 'pending') {
          b.status = 'expired';
          b.cancel_reason = 'released';
        }
      }
      const row: DemoCoachBooking = {
        id: demoId('booking'),
        email: user.email,
        starts_at: at,
        ends_at: new Date(Date.parse(at) + minutesOf(option) * MINUTE).toISOString(),
        timezone: c.timezone,
        join_url: null,
        location_kind: null,
        location_text: null,
        cancel_url: null,
        reschedule_url: null,
        status: 'pending',
        event_name: null,
        coach_id: coach,
        option_id: option,
        source: 'forma',
        hold_expires_at: new Date(Date.now() + HOLD_MINUTES * MINUTE).toISOString(),
      };
      db.coachBookings.push(row);
      return asHold(row);
    });
  });
}

export async function releaseHold(): Promise<void> {
  return run(() => {
    const user = requireUser();
    mutateDb((db) => {
      for (const b of db.coachBookings) {
        if (b.email === user.email && b.status === 'pending') {
          b.status = 'expired';
          b.cancel_reason = 'released';
        }
      }
    });
  });
}

export async function getMyHold(): Promise<BookingHold | null> {
  return run(() => {
    const hold = liveHold(readDb(), requireUser().email);
    return hold ? asHold(hold) : null;
  });
}

export async function moveMyBooking(id: string, startsAt: string): Promise<FreeSlot> {
  return run(() => {
    const user = requireUser();
    return mutateDb((db) => {
      const row = db.coachBookings.find(
        (b) => b.id === id && b.email === user.email && b.status === 'active' && b.coach_id,
      );
      if (!row || !row.coach_id) throw new AppError('validation', 'not_found');
      if (!canSelfMove(row.starts_at, Date.now())) throw new AppError('validation', 'too_late');
      const coach = calendar(db).coaches.find((c) => c.id === row.coach_id);
      const option: SessionOption = row.option_id === 'half' ? 'half' : 'hour';
      const at = new Date(Date.parse(startsAt)).toISOString();
      if (!coach || !isFree(db, coach, option, at, row.id)) {
        throw new AppError('validation', 'slot_taken');
      }
      const length = Date.parse(row.ends_at) - Date.parse(row.starts_at);
      row.starts_at = at;
      row.ends_at = new Date(Date.parse(at) + length).toISOString();
      return { startsAt: row.starts_at, endsAt: row.ends_at };
    });
  });
}

/** The demo's stand-in for the payment webhook: the live hold becomes a session. */
export async function confirmDemoHold(): Promise<boolean> {
  return run(() => {
    const user = requireUser();
    return mutateDb((db) => {
      const hold = liveHold(db, user.email);
      if (!hold) return false;
      const coach = calendar(db).coaches.find((c) => c.id === hold.coach_id);
      hold.status = 'active';
      hold.hold_expires_at = null;
      hold.join_url = coach?.roomUrl ?? null;
      hold.location_kind = coach?.roomUrl ? 'room' : null;
      hold.event_name = 'Персональная тренировка';
      return true;
    });
  });
}

// --- admin -------------------------------------------------------------------------------------

export async function listCoaches(): Promise<AdminCoach[]> {
  return run(() => {
    requireUser();
    return mutateDb((db) => calendar(db).coaches.map((c) => ({ ...c })));
  });
}

export async function saveCoach(id: string, patch: CoachPatch): Promise<void> {
  return run(() => {
    requireUser();
    mutateDb((db) => {
      const coach = calendar(db).coaches.find((c) => c.id === id);
      if (!coach) throw new AppError('validation', 'not_found');
      if (patch.roomUrl !== undefined) coach.roomUrl = patch.roomUrl || null;
      if (patch.email !== undefined) coach.email = patch.email || null;
      if (patch.active !== undefined) coach.active = patch.active;
      // A new room reaches the sessions already booked with the old one (`admin_save_coach`).
      if (patch.roomUrl) {
        const now = Date.now();
        for (const b of db.coachBookings) {
          if (b.coach_id === id && b.status === 'active' && Date.parse(b.ends_at) > now) {
            b.join_url = patch.roomUrl;
          }
        }
      }
    });
  });
}

export async function getAvailability(coach: string, today: string): Promise<CoachAvailability> {
  return run(() => {
    requireUser();
    return mutateDb((db) => {
      const { rules, exceptions } = calendar(db);
      return {
        rules: rules
          .filter((r) => r.coachId === coach)
          .map((r): WeeklyRule => ({ weekday: r.weekday, start: r.start, end: r.end }))
          .sort((a, b) => a.weekday - b.weekday || a.start.localeCompare(b.start)),
        exceptions: exceptions
          .filter((e) => e.coachId === coach && e.date >= today)
          .sort(
            (a, b) => a.date.localeCompare(b.date) || (a.start ?? '').localeCompare(b.start ?? ''),
          )
          .map(({ coachId: _coach, ...e }) => e),
      };
    });
  });
}

export async function setWeeklyRules(coach: string, rules: readonly WeeklyRule[]): Promise<void> {
  return run(() => {
    requireUser();
    mutateDb((db) => {
      const cal = calendar(db);
      if (!cal.coaches.some((c) => c.id === coach)) throw new AppError('validation', 'not_found');
      db.coachRules = [
        ...cal.rules.filter((r) => r.coachId !== coach),
        ...rules.map((r) => ({ coachId: coach, weekday: r.weekday, start: r.start, end: r.end })),
      ];
    });
  });
}

export async function addException(coach: string, draft: ExceptionDraft): Promise<void> {
  return run(() => {
    requireUser();
    const row = exceptionToDb(coach, draft);
    mutateDb((db) => {
      calendar(db).exceptions.push({
        id: demoId('exc'),
        coachId: coach,
        date: row.date,
        start: row.start_time,
        end: row.end_time,
        kind: row.kind === 'extra' ? 'extra' : 'off',
        note: row.note,
      });
    });
  });
}

export async function deleteException(id: string): Promise<void> {
  return run(() => {
    requireUser();
    mutateDb((db) => {
      db.coachExceptions = calendar(db).exceptions.filter((e) => e.id !== id);
    });
  });
}

export async function adminMoveBooking(id: string, startsAt: string): Promise<void> {
  return run(() => {
    requireUser();
    mutateDb((db) => {
      const row = db.coachBookings.find((b) => b.id === id && b.status === 'active');
      if (!row) throw new AppError('validation', 'not_found');
      const at = Date.parse(startsAt);
      if (!(at > Date.now())) throw new AppError('validation', 'invalid_times');
      const length = Date.parse(row.ends_at) - Date.parse(row.starts_at);
      const clash = busyOf(db, row.coach_id ?? 'sergey', Date.now(), row.id).some(
        (b) => Date.parse(b.startsAt) < at + length && Date.parse(b.endsAt) > at,
      );
      if (clash) throw new AppError('validation', 'slot_taken');
      row.starts_at = new Date(at).toISOString();
      row.ends_at = new Date(at + length).toISOString();
    });
  });
}

export async function adminCancelBooking(id: string, reason: string | null): Promise<void> {
  return run(() => {
    requireUser();
    mutateDb((db) => {
      const row = db.coachBookings.find(
        (b) => b.id === id && (b.status === 'active' || b.status === 'pending'),
      );
      if (!row) throw new AppError('validation', 'not_found');
      if (row.status === 'pending') {
        row.status = 'expired';
        row.cancel_reason = 'cancelled_by_admin';
      } else {
        row.status = 'cancelled';
        row.cancel_reason = reason?.trim() || null;
      }
    });
  });
}

/** `admin_coach_bookings(scope)` over the store: sessions only, never holds. */
export async function listAdminBookings(scope: BookingScope): Promise<AdminBooking[]> {
  return run(() => {
    requireUser();
    const db = readDb();
    const now = Date.now();
    const rows = db.coachBookings.filter((b) => {
      const over = Date.parse(b.ends_at) <= now;
      if (scope === 'cancelled') return b.status === 'cancelled';
      return b.status === 'active' && (scope === 'past' ? over : !over);
    });
    rows.sort((a, b) =>
      scope === 'upcoming'
        ? a.starts_at.localeCompare(b.starts_at)
        : b.starts_at.localeCompare(a.starts_at),
    );
    return rows.map((b) => ({
      id: b.id,
      startsAt: b.starts_at,
      endsAt: b.ends_at,
      minutes: Math.round((Date.parse(b.ends_at) - Date.parse(b.starts_at)) / MINUTE),
      status: b.status === 'cancelled' ? 'cancelled' : 'active',
      source: b.source ?? 'google_calendar',
      eventName: b.event_name,
      email: b.email,
      name: db.profiles.find((p) => p.email === b.email)?.display_name ?? null,
      joinUrl: b.join_url,
      locationText: b.location_text,
      cancelReason: b.cancel_reason ?? null,
      coachId: b.coach_id ?? null,
    }));
  });
}
