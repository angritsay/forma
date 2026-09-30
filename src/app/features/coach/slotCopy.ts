/**
 * What the booking screens say about a failed slot call, and how a day and a time are written.
 *
 * The server answers with codes (0055: `slot_taken`, `too_late`, `rate_limited`,
 * `coach_unavailable` …) and the screen needs one sentence for each that tells the person what to
 * do next. Pure, so the mapping is tested without rendering anything.
 */
import type { Locale, TKey } from '@/i18n/index';
import { isAppError } from '@/lib/api/errors';

/**
 * The line for a failed hold or move. A dropped connection and an expired sign-in say so (0058):
 * «попробуй ещё раз» is useless advice for either. Anything unrecognised is the generic «try again».
 * `hold_again_later` takes `{n}`, the minutes from `holdAgainMinutes`.
 */
export function slotErrorKey(e: unknown): TKey {
  if (isAppError(e) && e.code === 'network') return 'common.errorOffline';
  if (isAppError(e) && e.code === 'auth') return 'app.bookErrorAuth';
  const code = isAppError(e) ? e.message : '';
  switch (code) {
    case 'hold_again_later':
      return 'app.bookHoldAgainLater';
    // A move of a session somebody else moved or cancelled meanwhile (0058).
    case 'not_found':
      return 'app.bookMoveGone';
    case 'slot_taken':
      return 'app.bookHoldTaken';
    case 'rate_limited':
      return 'app.bookHoldRateLimited';
    case 'too_late':
      return 'app.bookMoveTooLate';
    case 'too_soon':
      return 'app.bookMoveTooSoon';
    case 'coach_unavailable':
      return 'app.bookCoachUnavailable';
    default:
      return 'app.bookHoldError';
  }
}

/** What the coach is told a message is about (0058): the session, the hold, or the payment. */
export type ContextKind = 'booking' | 'hold' | 'checking';

const CONTEXT_LABEL: Record<ContextKind, string> = {
  booking: 'Запись',
  hold: 'Бронь',
  checking: 'Оплата проверяется, бронь',
};

/**
 * The time a message to the coach is about, as the coach reads it: Russian and Moscow time,
 * whatever the app's language and the phone's zone («Бронь: вт, 6 окт., 10:00 МСК»). Without it a
 * «я оплатил, а записи нет» reaches the topic with nothing to look up.
 */
export function contextTime(kind: ContextKind, iso: string): string {
  const ms = Date.parse(iso);
  if (!Number.isFinite(ms)) return '';
  const when = new Intl.DateTimeFormat('ru-RU', {
    timeZone: 'Europe/Moscow',
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  }).format(ms);
  return `${CONTEXT_LABEL[kind]}: ${when} МСК`;
}

/**
 * The minutes `hold_slot` said to wait before this start may be held again (0058: the DETAIL of
 * `hold_again_later`); 1 when it did not say, so the line never promises «0 min».
 */
export function holdAgainMinutes(e: unknown): number {
  const cause = isAppError(e) ? (e.cause as { details?: unknown } | undefined) : undefined;
  const n = Number(cause?.details);
  return Number.isFinite(n) && n >= 1 ? Math.ceil(n) : 1;
}

const TAG: Record<Locale, string> = { ru: 'ru-RU', en: 'en-GB' };

/** «пн», «Mon» — the weekday of a calendar date, read at noon UTC so no zone can shift it. */
export function weekdayShort(date: string, locale: Locale): string {
  const ms = Date.parse(`${date}T12:00:00Z`);
  if (!Number.isFinite(ms)) return '';
  return new Intl.DateTimeFormat(TAG[locale], { weekday: 'short', timeZone: 'UTC' }).format(ms);
}

/** «5 октября», «5 October» — a calendar date, for labels. */
export function dayLong(date: string, locale: Locale): string {
  const ms = Date.parse(`${date}T12:00:00Z`);
  if (!Number.isFinite(ms)) return date;
  return new Intl.DateTimeFormat(TAG[locale], {
    day: 'numeric',
    month: 'long',
    weekday: 'long',
    timeZone: 'UTC',
  }).format(ms);
}

/** «вт, 6 октября» — an instant's date in a zone, for the hold and the move. */
export function dateOf(iso: string, locale: Locale, timeZone: string | undefined): string {
  const ms = Date.parse(iso);
  if (!Number.isFinite(ms)) return '';
  const options: Intl.DateTimeFormatOptions = { weekday: 'short', day: 'numeric', month: 'long' };
  try {
    return new Intl.DateTimeFormat(TAG[locale], { ...options, timeZone }).format(ms);
  } catch {
    return new Intl.DateTimeFormat(TAG[locale], options).format(ms);
  }
}

/** «Понедельник», «Monday» — an ISO weekday (1 = Monday) by name, for the admin's week. */
export function weekdayLong(weekday: number, locale: Locale): string {
  // 5 Oct 2026 is a Monday; any Monday would do.
  const ms = Date.UTC(2026, 9, 4 + weekday, 12);
  const name = new Intl.DateTimeFormat(TAG[locale], { weekday: 'long', timeZone: 'UTC' }).format(
    ms,
  );
  return name.charAt(0).toUpperCase() + name.slice(1);
}
