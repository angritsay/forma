/**
 * The client's half of our own calendar (0055): free slots, the 20-minute hold, and a move.
 *
 * The order is the owner's: pick a slot, then pay. `holdSlot` takes the slot for 20 minutes; the
 * payment, on the same static till links as before, reaches a webhook that confirms the hold
 * (`apply_session_payment`). Nothing here confirms anything — a front end cannot prove a payment —
 * so after paying the app only waits for the booking to appear in `my_coach_bookings`.
 *
 * Errors arrive as `AppError('validation', <code>)` with the server's code as the message:
 * `coach_unavailable`, `invalid_option`, `rate_limited`, `not_found`, `too_late`, `slot_taken`.
 * `hold_slot` alone answers a taken slot with no row instead (the migration says why), which is
 * `null` here.
 */
import { supabase } from './client';
import { demo } from './demo/load';
import { AppError } from './errors';
import { guard, requireUser, unwrapMaybe } from './internal';
import { asSessionOption } from './mappers';
import { isDemo } from './mode';
import type { BookingHold, FreeSlot, SessionOption } from './types';

const COACH_RE = /^[a-z][a-z0-9_]{1,30}$/;

export interface DbSlot {
  starts_at: string;
  ends_at: string;
}

export interface DbHold {
  id: string;
  coach_id: string;
  option_id: string;
  starts_at: string;
  ends_at: string;
  hold_expires_at: string;
}

export function slotFromDb(r: DbSlot): FreeSlot {
  return { startsAt: r.starts_at, endsAt: r.ends_at };
}

/** A hold row, or null when it is not one (a table function answers with an array). */
export function holdFromDb(raw: unknown): BookingHold | null {
  const r = (Array.isArray(raw) ? raw[0] : raw) as Partial<DbHold> | null | undefined;
  if (!r || typeof r.id !== 'string' || typeof r.hold_expires_at !== 'string') return null;
  const optionId = asSessionOption(r.option_id);
  if (!optionId || typeof r.starts_at !== 'string' || typeof r.ends_at !== 'string') return null;
  return {
    id: r.id,
    coachId: r.coach_id ?? '',
    optionId,
    startsAt: r.starts_at,
    endsAt: r.ends_at,
    holdExpiresAt: r.hold_expires_at,
  };
}

function checkCoach(coach: string): void {
  if (!COACH_RE.test(coach)) throw new AppError('validation', 'coach_unavailable');
}

function checkOption(option: string): asserts option is SessionOption {
  if (asSessionOption(option) === null) throw new AppError('validation', 'invalid_option');
}

function checkInstant(iso: string): void {
  if (!Number.isFinite(Date.parse(iso))) throw new AppError('validation', 'invalid_times');
}

/** Free starts of a coach for a length between two instants (`available_slots`). */
export async function listFreeSlots(
  coach: string,
  option: SessionOption,
  fromIso: string,
  toIso: string,
): Promise<FreeSlot[]> {
  checkCoach(coach);
  checkOption(option);
  checkInstant(fromIso);
  checkInstant(toIso);
  if (isDemo()) return (await demo()).listFreeSlots(coach, option, fromIso, toIso);
  return guard(async () => {
    await requireUser();
    const rows = unwrapMaybe<DbSlot[]>(
      await supabase().rpc('available_slots', {
        p_coach: coach,
        p_option: option,
        p_from: fromIso,
        p_to: toIso,
      }),
    );
    return (rows ?? []).map(slotFromDb);
  });
}

/** Hold a slot for 20 minutes (`hold_slot`); null when somebody else has it. */
export async function holdSlot(
  coach: string,
  option: SessionOption,
  startsAt: string,
): Promise<BookingHold | null> {
  checkCoach(coach);
  checkOption(option);
  checkInstant(startsAt);
  if (isDemo()) return (await demo()).holdSlot(coach, option, startsAt);
  return guard(async () => {
    await requireUser();
    const raw = unwrapMaybe<unknown>(
      await supabase().rpc('hold_slot', {
        p_coach: coach,
        p_option: option,
        p_starts_at: startsAt,
      }),
    );
    return holdFromDb(raw);
  });
}

/** Give the held slot back (`release_hold`): «Выбрать другое время». */
export async function releaseHold(): Promise<void> {
  if (isDemo()) return (await demo()).releaseHold();
  return guard(async () => {
    await requireUser();
    unwrapMaybe<boolean>(await supabase().rpc('release_hold'));
  });
}

/** The caller's live hold, for the countdown after a reload (`my_booking_hold`); null if none. */
export async function getMyHold(): Promise<BookingHold | null> {
  if (isDemo()) return (await demo()).getMyHold();
  return guard(async () => {
    await requireUser();
    return holdFromDb(unwrapMaybe<unknown>(await supabase().rpc('my_booking_hold')));
  });
}

/** Move one's own session to another free start, 24 hours or more ahead (`move_my_booking`). */
export async function moveMyBooking(id: string, startsAt: string): Promise<FreeSlot> {
  checkInstant(startsAt);
  if (isDemo()) return (await demo()).moveMyBooking(id, startsAt);
  return guard(async () => {
    await requireUser();
    const raw = unwrapMaybe<unknown>(
      await supabase().rpc('move_my_booking', { p_id: id, p_new_starts_at: startsAt }),
    );
    const row = (Array.isArray(raw) ? raw[0] : raw) as DbSlot | undefined;
    if (!row) throw new AppError('not_found', 'not_found');
    return slotFromDb(row);
  });
}

/**
 * Demo only: the payment the demo cannot take, taken — the hold becomes a session exactly as the
 * webhook would make it, so the walkthrough reaches the booked card. Refused outside the demo.
 */
export async function confirmDemoHold(): Promise<boolean> {
  if (!isDemo()) throw new AppError('forbidden', 'demo_only');
  return (await demo()).confirmDemoHold();
}
