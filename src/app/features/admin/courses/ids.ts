/**
 * Id rules shared by the course builder's screens.
 *
 * These mirror the check constraints in the migrations rather than merely resembling them: a client
 * that lets a bad id through only turns a clear message into a Postgres error.
 */

/** `admin_courses.slug_id` and `public.courses.id`. */
export const COURSE_ID_RE = /^[a-z0-9_]{2,40}$/;

/** `admin_course_days.node_id`, which is also `workout_sessions.node_id`. */
export const NODE_ID_RE = /^[a-z0-9_]{2,40}$/;

/**
 * The id for a new day.
 *
 * Derived from its position rather than random, so the ids read in order when they show up in the
 * database, in a session row or in a support question. Week and day, not a running count, because
 * days get inserted and removed while a course is being written and a running count would reuse an
 * id that a session had already been recorded against.
 */
export function nodeIdFor(week: number, day: number): string {
  return `w${week}d${day}`;
}

/** The minimum a day needs for {@link nextDaySlot} to place the next one after it. */
export interface DaySlot {
  week: number;
  day: number;
}

/**
 * Where the next day goes: the slot after the last one, rolling into a new week past day 7.
 *
 * `admin_course_days` has a unique (course_id, week, day), so this has to land on a free slot or
 * the insert is rejected. It reads the *latest* slot rather than the array's last element, because
 * the coach can renumber a day by hand and leave the list out of order.
 */
export function nextDaySlot(days: readonly DaySlot[]): DaySlot {
  if (days.length === 0) return { week: 1, day: 1 };
  const latest = days.reduce((a, b) =>
    b.week > a.week || (b.week === a.week && b.day > a.day) ? b : a,
  );
  return latest.day >= 7
    ? { week: latest.week + 1, day: 1 }
    : { week: latest.week, day: latest.day + 1 };
}
