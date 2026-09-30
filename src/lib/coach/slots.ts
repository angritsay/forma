/**
 * Our own calendar for sessions with the coach (0055), as the arithmetic the screens need.
 *
 * The server owns the truth: `available_slots` decides what is free, `hold_slot` takes a slot for
 * `HOLD_MINUTES` while the client pays, and `move_my_booking` refuses a move later than
 * `MOVE_CUTOFF_HOURS` before the start. What lives here is everything the app has to *say* about
 * those answers without asking again, and all of it is pure so it is tested without a DOM:
 *
 *   * the date strip — the next `PICKER_DAYS` days in the viewer's zone, with how many free starts
 *     each one has, so a day with none is drawn and cannot be picked;
 *   * the time chips — a day's starts as wall-clock labels in the viewer's zone;
 *   * the hold's countdown — «Слот держится до 14:35» and the minutes and seconds left;
 *   * the two rules on a booked session — «Подключиться» from `JOIN_OPENS_MINUTES` before the
 *     start, «Перенести» only while the start is at least `MOVE_CUTOFF_HOURS` away;
 *   * the admin's weekly rules — «10:00»–«14:00» ranges checked before they are sent.
 *
 * And one more thing that is not a screen's: `generateSlots`, the same rule `booking_slots`
 * applies in SQL (weekly rules, then exceptions, 30-minute grid, lead time, horizon, minus busy
 * time), written again for the demo backend. The demo has no database to ask, and a demo that
 * offered slots the real calendar would not is a demo of a different product.
 *
 * TIMEZONES. A coach's rules are wall-clock times in the coach's zone (`coaches.timezone`,
 * Moscow by default). The viewer sees every time in the device's own zone, the rule the booked
 * session's card already follows (`src/lib/coach/booking.ts`): the same instant, their clock.
 * Only `Intl` knows when a zone changes its offset, so conversions read the offset out of a
 * formatter instead of assuming one.
 */

/** How long a picked slot waits for its payment (`booking_hold_time()`). */
export const HOLD_MINUTES = 20;
/** A client moves a session themselves only this far ahead (`booking_move_cutoff()`). */
export const MOVE_CUTOFF_HOURS = 24;
/** «Подключиться» appears this long before the start and stays until the end. */
export const JOIN_OPENS_MINUTES = 15;
/** How many days the client's date strip shows. `available_slots` defaults to the same 14. */
export const PICKER_DAYS = 14;
/** The grid every start sits on (:00 and :30). */
export const GRID_MINUTES = 30;
/** How far ahead the server offers slots (`booking_horizon()`). */
export const HORIZON_DAYS = 60;

const MINUTE = 60_000;
const DAY = 86_400_000;

/** A free start, as `available_slots` returns it. */
export interface SlotTimes {
  startsAt: string;
  endsAt: string;
}

/** A weekly rule in the coach's wall clock. `weekday` is ISO: 1 = Monday … 7 = Sunday. */
export interface WeeklyRule {
  weekday: number;
  /** `HH:MM`. */
  start: string;
  /** `HH:MM`, after `start`. */
  end: string;
}

/** A per-date exception: a day off (no times), an hour off (times), or an extra window. */
export interface DateException {
  /** `YYYY-MM-DD` in the coach's zone. */
  date: string;
  start: string | null;
  end: string | null;
  kind: 'off' | 'extra';
}

// --- clocks and zones --------------------------------------------------------------------------

const TIME_RE = /^([01]\d|2[0-3]):([0-5]\d)(?::[0-5]\d)?$/;
const DATE_RE = /^(\d{4})-(\d{2})-(\d{2})$/;

/** Minutes since midnight of `HH:MM` (seconds allowed and ignored, as Postgres prints `time`), or null. */
export function parseClock(value: string | null | undefined): number | null {
  const m = TIME_RE.exec((value ?? '').trim());
  if (!m) return null;
  return Number(m[1]) * 60 + Number(m[2]);
}

/**
 * Midnight at the end of the day: `24:00` as Postgres `time` spells it, or `00:00` as a browser's
 * time field can only say it (it has no 24:00). A range cannot end at the start of its own day,
 * so an end at `00:00` means only one thing.
 */
const DAY_END_RE = /^(?:24:00|00:00)(?::00)?$/;
/** Minutes in a day: the end of a range that runs until midnight. */
export const DAY_END = 24 * 60;

/**
 * Minutes since midnight of a range's *end*: everything `parseClock` reads, with midnight as 1440,
 * so a window can run until midnight (23:00–24:00). Only ends — a start at 00:00 is midnight.
 */
export function parseEndClock(value: string | null | undefined): number | null {
  return DAY_END_RE.test((value ?? '').trim()) ? DAY_END : parseClock(value);
}

/** A range's end as the server takes it: midnight is `24:00`, anything else as typed. */
export function endForDb(value: string): string {
  const v = value.trim();
  return parseEndClock(v) === DAY_END ? '24:00' : v;
}

/** `HH:MM` of minutes since midnight (1440 is `24:00`, the end of the day). */
export function formatClock(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

interface Civil {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
}

function civil(ms: number, timeZone: string | undefined): Civil {
  const options: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  };
  let parts: Intl.DateTimeFormatPart[];
  try {
    parts = new Intl.DateTimeFormat('en-GB', { ...options, timeZone }).formatToParts(new Date(ms));
  } catch {
    // An unknown zone must not take a screen down: the device's own zone is the fallback.
    parts = new Intl.DateTimeFormat('en-GB', options).formatToParts(new Date(ms));
  }
  const at = (type: Intl.DateTimeFormatPartTypes): number =>
    Number(parts.find((p) => p.type === type)?.value ?? 0);
  return {
    year: at('year'),
    month: at('month'),
    day: at('day'),
    hour: at('hour') % 24,
    minute: at('minute'),
  };
}

/** The calendar date of an instant in a zone, `YYYY-MM-DD`. */
export function dateIn(ms: number, timeZone: string | undefined): string {
  const c = civil(ms, timeZone);
  return `${c.year}-${String(c.month).padStart(2, '0')}-${String(c.day).padStart(2, '0')}`;
}

/** `YYYY-MM-DD` plus `n` days, as calendar arithmetic (no zone involved). */
export function addDaysIso(date: string, n: number): string {
  const m = DATE_RE.exec(date);
  if (!m) return date;
  const ms = Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3])) + n * DAY;
  return new Date(ms).toISOString().slice(0, 10);
}

/** ISO weekday of a calendar date: 1 = Monday … 7 = Sunday. */
export function isoWeekday(date: string): number {
  const m = DATE_RE.exec(date);
  if (!m) return 0;
  const d = new Date(Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3]))).getUTCDay();
  return d === 0 ? 7 : d;
}

/** How far a zone's wall clock is ahead of UTC at an instant, in ms. */
function offsetAt(ms: number, timeZone: string | undefined): number {
  const c = civil(ms, timeZone);
  const wall = Date.UTC(c.year, c.month - 1, c.day, c.hour, c.minute);
  return wall - Math.floor(ms / MINUTE) * MINUTE;
}

/**
 * The instant a wall-clock reading names in a zone: 10:00 on 2026-10-05 in Moscow is 07:00 UTC.
 * Two passes, because the offset to subtract is the one in force at the answer, not at the guess —
 * the difference is only ever there around a clock change.
 */
export function wallToInstant(date: string, minutes: number, timeZone: string | undefined): number {
  const m = DATE_RE.exec(date);
  if (!m) return Number.NaN;
  const guess = Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3])) + minutes * MINUTE;
  const first = guess - offsetAt(guess, timeZone);
  const second = guess - offsetAt(first, timeZone);
  return second;
}

/** `HH:MM` of an instant in a zone, h23 and zero-padded («09:00», never «9:00 AM»). */
export function clockIn(iso: string | number, timeZone: string | undefined): string {
  const ms = typeof iso === 'number' ? iso : Date.parse(iso);
  if (!Number.isFinite(ms)) return '';
  const c = civil(ms, timeZone);
  return formatClock(c.hour * 60 + c.minute);
}

/**
 * A short name for a zone at an instant, for the line under the time chips: «МСК»-like names
 * where `Intl` has one, «GMT+5» otherwise. Empty when the browser will not say.
 */
export function zoneLabel(timeZone: string | undefined, at: number, locale: 'ru' | 'en'): string {
  try {
    const parts = new Intl.DateTimeFormat(locale === 'ru' ? 'ru-RU' : 'en-GB', {
      timeZone,
      timeZoneName: 'short',
    }).formatToParts(new Date(at));
    return parts.find((p) => p.type === 'timeZoneName')?.value ?? '';
  } catch {
    return '';
  }
}

// --- bookings the hours no longer cover (the admin's schedule editor, 0056) --------------------

/**
 * The bookings that fall outside the coach's hours: not wholly inside the union of that day's
 * weekly windows and `extra` windows, or on a day (or an hour) taken off. The editor lists them
 * under the week and the exceptions, so a change of hours never silently strands a paid session —
 * the schedule does not move or cancel anything by itself.
 *
 * Minute-exact rather than on the 30-minute grid: the admin can put a session at any time
 * (`admin_move_booking`), and a session is outside the hours if any minute of it is. A session
 * that runs past midnight is checked against its start's day, to the end of that day.
 */
export function bookingsOutsideHours<T extends SlotTimes>(
  bookings: readonly T[],
  rules: readonly WeeklyRule[],
  exceptions: readonly DateException[],
  timeZone: string,
): T[] {
  return bookings.filter((b) => {
    const starts = Date.parse(b.startsAt);
    const ends = Date.parse(b.endsAt);
    if (!Number.isFinite(starts) || !Number.isFinite(ends) || ends <= starts) return false;
    const day = dateIn(starts, timeZone);
    const from = parseClock(clockIn(starts, timeZone));
    if (from === null) return false;
    const to = from + Math.round((ends - starts) / MINUTE);

    const todays = exceptions.filter((e) => e.date === day);
    if (todays.some((e) => e.kind === 'off' && e.start === null)) return true;
    const offHit = todays.some((e) => {
      if (e.kind !== 'off') return false;
      const a = parseClock(e.start);
      const z = parseEndClock(e.end);
      return a !== null && z !== null && from < z && to > a;
    });
    if (offHit) return true;

    const windows: [number, number][] = [];
    for (const r of rules) {
      if (r.weekday !== isoWeekday(day)) continue;
      const a = parseClock(r.start);
      const z = parseEndClock(r.end);
      if (a !== null && z !== null && z > a) windows.push([a, z]);
    }
    for (const e of todays) {
      if (e.kind !== 'extra') continue;
      const a = parseClock(e.start);
      const z = parseEndClock(e.end);
      if (a !== null && z !== null && z > a) windows.push([a, z]);
    }
    // Walk the merged windows from the start: touching or overlapping ones join (10–12 + 12–14).
    let reach = from;
    for (const [a, z] of windows.sort((x, y) => x[0] - y[0])) {
      if (a <= reach && z > reach) reach = z;
    }
    return reach < to;
  });
}

// --- the slot engine, for the demo --------------------------------------------------------------

export interface SlotQuery {
  rules: readonly WeeklyRule[];
  exceptions: readonly DateException[];
  /** Active bookings and live holds of this coach. */
  busy: readonly SlotTimes[];
  /** 30 or 60. */
  minutes: number;
  from: number;
  to: number;
  now: number;
  /** The coach's zone. */
  timeZone: string;
  /** `BOOKING.leadTimeMin`. */
  leadMinutes: number;
  horizonDays?: number;
}

/**
 * Free starts, by the rule `booking_slots` (0055) applies:
 *
 *   1. every date in the coach's zone between the bounds;
 *   2. that weekday's rules, unless the day is off entirely, plus the date's `extra` windows;
 *   3. 30-minute cells on the :00/:30 grid that fit inside a window, minus the cells an `off`
 *      window touches;
 *   4. a start is a cell followed by enough cells for the length;
 *   5. at least the lead time from now and less than the horizon ahead;
 *   6. not overlapping anything busy.
 */
export function generateSlots(q: SlotQuery): SlotTimes[] {
  const lo = Math.max(q.from, q.now + q.leadMinutes * MINUTE);
  const hi = Math.min(q.to, q.now + (q.horizonDays ?? HORIZON_DAYS) * DAY);
  if (!(lo < hi) || q.minutes <= 0 || q.minutes % GRID_MINUTES !== 0) return [];

  const busy = q.busy
    .map((b) => [Date.parse(b.startsAt), Date.parse(b.endsAt)] as const)
    .filter(([a, b]) => Number.isFinite(a) && Number.isFinite(b));
  const need = q.minutes / GRID_MINUTES;
  const out: SlotTimes[] = [];

  const last = dateIn(hi, q.timeZone);
  for (let day = dateIn(lo, q.timeZone); day <= last; day = addDaysIso(day, 1)) {
    const todays = q.exceptions.filter((e) => e.date === day);
    const dayOff = todays.some((e) => e.kind === 'off' && e.start === null);
    const windows: [number, number][] = [];
    if (!dayOff) {
      for (const r of q.rules) {
        if (r.weekday !== isoWeekday(day)) continue;
        const a = parseClock(r.start);
        const b = parseEndClock(r.end);
        if (a !== null && b !== null && b > a) windows.push([a, b]);
      }
    }
    for (const e of todays) {
      if (e.kind !== 'extra') continue;
      const a = parseClock(e.start);
      const b = parseEndClock(e.end);
      if (a !== null && b !== null && b > a) windows.push([a, b]);
    }
    const offs = todays
      .filter((e) => e.kind === 'off' && e.start !== null)
      .map((e) => [parseClock(e.start), parseEndClock(e.end)] as const);

    const cells = new Set<number>();
    for (const [a, b] of windows) {
      const first = Math.ceil(a / GRID_MINUTES) * GRID_MINUTES;
      for (let cell = first; cell + GRID_MINUTES <= b; cell += GRID_MINUTES) {
        const blocked = offs.some(
          ([oa, ob]) => oa !== null && ob !== null && cell < ob && cell + GRID_MINUTES > oa,
        );
        if (!blocked) cells.add(cell);
      }
    }

    for (const cell of [...cells].sort((x, y) => x - y)) {
      let run = 1;
      while (run < need && cells.has(cell + run * GRID_MINUTES)) run += 1;
      if (run < need) continue;
      const starts = wallToInstant(day, cell, q.timeZone);
      const ends = starts + q.minutes * MINUTE;
      if (!(starts >= lo && starts < hi)) continue;
      if (busy.some(([a, b]) => a < ends && b > starts)) continue;
      out.push({ startsAt: new Date(starts).toISOString(), endsAt: new Date(ends).toISOString() });
    }
  }
  return out.sort((a, b) => a.startsAt.localeCompare(b.startsAt));
}

// --- the client's picker -----------------------------------------------------------------------

export interface StripDay {
  /** `YYYY-MM-DD` in the viewer's zone — the key and the selection. */
  date: string;
  /** Day of the month, for the chip's figure. */
  day: number;
  /** ISO weekday, for the chip's short name. */
  weekday: number;
  /** Free starts that day; 0 draws the day and does not let it be picked. */
  count: number;
}

/** Free starts grouped by the viewer's calendar date. */
export function slotsByDay<T extends SlotTimes>(
  slots: readonly T[],
  timeZone: string | undefined,
): Map<string, T[]> {
  const out = new Map<string, T[]>();
  for (const s of slots) {
    const ms = Date.parse(s.startsAt);
    if (!Number.isFinite(ms)) continue;
    const key = dateIn(ms, timeZone);
    const list = out.get(key) ?? [];
    list.push(s);
    out.set(key, list);
  }
  for (const list of out.values()) list.sort((a, b) => a.startsAt.localeCompare(b.startsAt));
  return out;
}

/**
 * The strip: today and the next `days - 1` dates in the viewer's zone, each with its count. Every
 * date is there, free or not, so the strip is a calendar and not a list that closes up its gaps —
 * «суббота занята» is information too.
 */
export function dateStrip(
  slots: readonly SlotTimes[],
  now: number,
  timeZone: string | undefined,
  days: number = PICKER_DAYS,
): StripDay[] {
  const grouped = slotsByDay(slots, timeZone);
  const today = dateIn(now, timeZone);
  const out: StripDay[] = [];
  for (let i = 0; i < days; i += 1) {
    const date = addDaysIso(today, i);
    out.push({
      date,
      day: Number(date.slice(8, 10)),
      weekday: isoWeekday(date),
      count: grouped.get(date)?.length ?? 0,
    });
  }
  return out;
}

/** The day the strip opens on: the one already picked if it still has slots, else the first that does. */
export function firstOpenDay(strip: readonly StripDay[], picked?: string | null): string | null {
  if (picked && strip.some((d) => d.date === picked && d.count > 0)) return picked;
  return strip.find((d) => d.count > 0)?.date ?? null;
}

// --- the hold ----------------------------------------------------------------------------------

export interface HoldClock {
  /** Nothing left: the slot is free again for everybody. */
  expired: boolean;
  /** Whole seconds left, never negative. */
  seconds: number;
  /** «19:42» — minutes and seconds left. */
  left: string;
}

/**
 * When a hold runs out on *this device's* clock, fixed at the moment the hold arrived.
 *
 * `hold_expires_at` is the server's instant, and comparing it with `Date.now()` trusts the phone's
 * clock. A clock running behind would show more than `HOLD_MINUTES` left; one running ahead would
 * end the countdown while the server still holds the slot. So the deadline is taken once, on
 * receipt: never later than `HOLD_MINUTES` from `receivedAt` (a hold is never longer than that),
 * and never later than the server's own instant read on the local clock. A clock ahead still ends
 * the countdown early — no answer here carries the server's time — and the screen copes with
 * that by never taking the same hold back once it has lapsed locally (`BookScreen`).
 */
export function holdDeadline(holdExpiresAt: string, receivedAt: number): number {
  const ends = Date.parse(holdExpiresAt);
  const longest = receivedAt + HOLD_MINUTES * MINUTE;
  return Number.isFinite(ends) ? Math.min(ends, longest) : receivedAt;
}

/** What is left of a hold at `now`. An unparseable expiry reads as already over. */
export function holdClock(holdExpiresAt: string | number, now: number): HoldClock {
  const ends = typeof holdExpiresAt === 'number' ? holdExpiresAt : Date.parse(holdExpiresAt);
  const seconds = Number.isFinite(ends) ? Math.max(0, Math.ceil((ends - now) / 1000)) : 0;
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return { expired: seconds === 0, seconds, left: `${m}:${String(s).padStart(2, '0')}` };
}

/** How long the screen waits for a payment whose hold ran out after the till was opened. */
export const PAYMENT_CHECK_MINUTES = 30;

/**
 * What the screen says when a hold runs out (0056).
 *
 *   * `expired` — the till was never opened from here: the slot is free again, pick again;
 *   * `checking` — the till was opened (`sent`): the money may be on its way, and «pick again»
 *     would be an invitation to pay twice. The webhook still confirms a hold that simply ran out
 *     while the slot is free (0055 §10), so the screen waits and asks again;
 *   * `unconfirmed` — `PAYMENT_CHECK_MINUTES` passed with nothing: it stops waiting and says to
 *     write to the coach if the money was taken.
 */
export type HoldLapse = 'expired' | 'checking' | 'unconfirmed';

export function holdLapse(sent: boolean, lapsedAt: number, now: number): HoldLapse {
  if (!sent) return 'expired';
  return now - lapsedAt < PAYMENT_CHECK_MINUTES * MINUTE ? 'checking' : 'unconfirmed';
}

// --- the booked session ------------------------------------------------------------------------

/** «Подключиться» is shown from `JOIN_OPENS_MINUTES` before the start until the end. */
export function joinOpen(startsAt: string, endsAt: string, now: number): boolean {
  const a = Date.parse(startsAt);
  const b = Date.parse(endsAt);
  if (!Number.isFinite(a) || !Number.isFinite(b)) return false;
  return now >= a - JOIN_OPENS_MINUTES * MINUTE && now < b;
}

/** The client may move it themselves: the start is at least `MOVE_CUTOFF_HOURS` away. */
export function canSelfMove(startsAt: string, now: number): boolean {
  const a = Date.parse(startsAt);
  return Number.isFinite(a) && now <= a - MOVE_CUTOFF_HOURS * 3_600_000;
}

// --- the admin's week --------------------------------------------------------------------------

/** One row of the week editor: a range as typed, before it is checked. */
export interface RangeDraft {
  start: string;
  end: string;
}

export type RangeProblem = 'format' | 'order' | 'overlap';

/**
 * What is wrong with one day's ranges, by index, or an empty map. Touching ranges (10–12, 12–14)
 * are fine — the server takes their union — but overlapping ones are almost always a typo.
 */
export function rangeProblems(ranges: readonly RangeDraft[]): Map<number, RangeProblem> {
  const out = new Map<number, RangeProblem>();
  const parsed = ranges.map((r) => [parseClock(r.start), parseEndClock(r.end)] as const);
  parsed.forEach(([a, b], i) => {
    if (a === null || b === null) out.set(i, 'format');
    else if (b <= a) out.set(i, 'order');
  });
  // Decided against the well-formed ranges only, and all at once, so both halves of a clash show.
  const valid = (j: number) => !out.has(j);
  const clashes = parsed.flatMap(([a, b], i) => {
    if (!valid(i) || a === null || b === null) return [];
    const clash = parsed.some(
      ([c, d], j) => j !== i && valid(j) && c !== null && d !== null && a < d && c < b,
    );
    return clash ? [i] : [];
  });
  for (const i of clashes) out.set(i, 'overlap');
  return out;
}

/** The whole week as `admin_set_availability` takes it, ranges sorted within a day. */
export function weekToRules(week: ReadonlyMap<number, readonly RangeDraft[]>): WeeklyRule[] {
  const out: WeeklyRule[] = [];
  for (let weekday = 1; weekday <= 7; weekday += 1) {
    const ranges = [...(week.get(weekday) ?? [])]
      .map((r) => ({ start: r.start.trim(), end: r.end.trim() }))
      .sort((a, b) => a.start.localeCompare(b.start));
    for (const r of ranges) out.push({ weekday, start: r.start, end: endForDb(r.end) });
  }
  return out;
}

/** The rules as the editor holds them: every weekday present, ranges `HH:MM` and sorted. */
export function rulesToWeek(rules: readonly WeeklyRule[]): Map<number, RangeDraft[]> {
  const week = new Map<number, RangeDraft[]>();
  for (let d = 1; d <= 7; d += 1) week.set(d, []);
  for (const r of rules) {
    const a = parseClock(r.start);
    const b = parseEndClock(r.end);
    if (a === null || b === null || r.weekday < 1 || r.weekday > 7) continue;
    // A time field cannot show 24:00; midnight is 00:00 there, and read back as the end of the day.
    week.get(r.weekday)!.push({ start: formatClock(a), end: formatClock(b % DAY_END) });
  }
  for (const list of week.values()) list.sort((x, y) => x.start.localeCompare(y.start));
  return week;
}
