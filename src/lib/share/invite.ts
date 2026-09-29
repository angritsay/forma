/**
 * «Давай с понедельника вместе»: everything the invite is made of, as pure functions.
 *
 * One person sends a friend a link to `/together/` with a Monday in it, and both start workout 1
 * that day (site synthesis §4). The pieces:
 *
 * - **The day.** {@link nextMonday} — the coming Monday in Europe/Moscow, the club circle's own
 *   timezone (0033), or today when today is a Monday. {@link validDate} is the same rule applied
 *   to a `?d=` that came back in a link: an ISO date, a Monday, from today to two weeks out —
 *   anything else is recomputed, so an old or hand-edited link never shows a day in the past.
 * - **The words for it.** {@link mondayLabel} for the chip («понедельник, 5 октября» / «завтра,
 *   5 октября» / «сегодня») and {@link whenPhrase} for the message («с понедельника, 5 октября»).
 *   The weekday, the month and «завтра»/«сегодня» come from `Intl`; the phrases, which need a
 *   grammatical case, are i18n templates (`landing.invite*`, gathered by `inviteCopy.ts`).
 * - **The sender's name.** {@link cleanName}: letters, marks, spaces and hyphens, 1–16 of them, or
 *   nothing. A name from a link is someone else's text: the page sets it with `textContent` only,
 *   never in the title, the H1 or a preview, and it is never sent anywhere.
 * - **The link.** {@link togetherUrl}: the locale's `/together/` with `d`, and `ref` + `from` only
 *   in their valid shapes. No price and no payment address ever goes into it.
 * - **The message and where it goes.** {@link shareText}, `telegramShareUrl` / `waUrl`
 *   (`targets.ts`), and the calendar: a Google template ({@link gcalUrl}) or an `.ics` file
 *   ({@link icsText}). Both are all-day events on the date itself, so no timezone can move them.
 *
 * Nothing here touches the DOM or the app; the island (`ShareInvite.tsx`) and the pages call it,
 * and `invite.test.ts` pins every rule.
 */
import type { Locale } from '@/content/schema';
import { addDays, daysBetween } from '@/lib/util/dates';
import { localePath, withBase } from '@/lib/util/paths';
import { isReferralCode } from '@/lib/referral/pending';

export { telegramShareUrl, waUrl } from './targets';

/** The club circle's timezone (0033): «Monday» is Monday in Moscow, wherever the sender is. */
export const INVITE_TIME_ZONE = 'Europe/Moscow';

/** How far ahead a `?d=` may point before it is treated as stale and recomputed. */
export const INVITE_HORIZON_DAYS = 14;

/** A sender's name as it may travel in `?from=`: letters, marks, spaces, hyphens; 1–16. */
export const NAME_RE = /^[\p{L}\p{M}\s-]{1,16}$/u;

const ISO_RE = /^(\d{4})-(\d{2})-(\d{2})$/;

/** The i18n templates the invite's phrases are built from (see `inviteCopy.ts`). */
export interface InviteCopy {
  /** «с понедельника, {date}» — a Monday two or more days away. */
  when: string;
  /** «с завтрашнего понедельника, {date}». */
  whenTomorrow: string;
  /** «с сегодняшнего понедельника». */
  whenToday: string;
  /** The message, with {when} and {url}. */
  text: string;
  /** The line added when the link is personal: «Оплатишь клуб по этой ссылке — …». */
  refLine: string;
}

function fill(template: string, params: Record<string, string>): string {
  return template.replace(/\{(\w+)\}/g, (all, k: string) => params[k] ?? all);
}

function intlTag(locale: Locale): string {
  return locale === 'ru' ? 'ru-RU' : 'en-GB';
}

/** A YYYY-MM-DD that is a real calendar date. */
export function isIsoDate(value: string | null | undefined): value is string {
  const m = typeof value === 'string' ? ISO_RE.exec(value) : null;
  if (!m) return false;
  const [y, mo, d] = [Number(m[1]), Number(m[2]), Number(m[3])];
  const dt = new Date(Date.UTC(y, mo - 1, d));
  return dt.getUTCFullYear() === y && dt.getUTCMonth() === mo - 1 && dt.getUTCDate() === d;
}

/** Noon UTC on a date: formatting it in UTC can never slip to a neighbouring day. */
function noonUtc(iso: string): Date {
  return new Date(`${iso}T12:00:00Z`);
}

/** Today's date in Moscow, YYYY-MM-DD. */
export function moscowToday(now: Date = new Date()): string {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: INVITE_TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(now);
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? '';
  return `${get('year')}-${get('month')}-${get('day')}`;
}

/** Monday = 0 … Sunday = 6, for a YYYY-MM-DD. */
function weekdayIndex(iso: string): number {
  return (noonUtc(iso).getUTCDay() + 6) % 7;
}

/** The coming Monday in Moscow, YYYY-MM-DD; today, when today is a Monday. */
export function nextMonday(now: Date = new Date()): string {
  const today = moscowToday(now);
  return addDays(today, (7 - weekdayIndex(today)) % 7);
}

/**
 * A `?d=` from a link, kept only when it is a Monday from today to {@link INVITE_HORIZON_DAYS}
 * days ahead (Moscow). Anything else — garbage, a Tuesday, last week's Monday — becomes
 * {@link nextMonday}: the page always names a start that can still happen.
 */
export function validDate(raw: string | null | undefined, now: Date = new Date()): string {
  if (isIsoDate(raw) && weekdayIndex(raw) === 0) {
    const ahead = daysBetween(moscowToday(now), raw);
    if (ahead >= 0 && ahead <= INVITE_HORIZON_DAYS) return raw;
  }
  return nextMonday(now);
}

/** «5 октября» / «5 October». */
export function dayMonth(locale: Locale, date: string): string {
  return new Intl.DateTimeFormat(intlTag(locale), {
    day: 'numeric',
    month: 'long',
    timeZone: 'UTC',
  }).format(noonUtc(date));
}

/**
 * The start as the chip says it: «понедельник, 5 октября», «завтра, 5 октября» or «сегодня»
 * (EN «Monday, 5 October» / «tomorrow, 5 October» / «today»), counted from today in Moscow.
 */
export function mondayLabel(locale: Locale, date: string, now: Date = new Date()): string {
  const tag = intlTag(locale);
  const ahead = daysBetween(moscowToday(now), date);
  const relative = new Intl.RelativeTimeFormat(tag, { numeric: 'auto' });
  if (ahead === 0) return relative.format(0, 'day');
  const tail = dayMonth(locale, date);
  if (ahead === 1) return `${relative.format(1, 'day')}, ${tail}`;
  const weekday = new Intl.DateTimeFormat(tag, { weekday: 'long', timeZone: 'UTC' }).format(
    noonUtc(date),
  );
  return `${weekday}, ${tail}`;
}

/** The start as the message says it: «с понедельника, 5 октября» and its two nearer forms. */
export function whenPhrase(
  locale: Locale,
  copy: Pick<InviteCopy, 'when' | 'whenTomorrow' | 'whenToday'>,
  date: string,
  now: Date = new Date(),
): string {
  const ahead = daysBetween(moscowToday(now), date);
  const template = ahead === 0 ? copy.whenToday : ahead === 1 ? copy.whenTomorrow : copy.when;
  return fill(template, { date: dayMonth(locale, date) });
}

/**
 * A sender's name fit to show: trimmed, inner whitespace collapsed, {@link NAME_RE} and at least
 * one letter — or null, and the page says «Приглашение» instead. Digits, punctuation, markup and
 * links never pass, so the name cannot carry anything but a name.
 */
export function cleanName(raw: string | null | undefined): string | null {
  if (typeof raw !== 'string') return null;
  const name = raw.normalize('NFC').trim().replace(/\s+/g, ' ');
  return NAME_RE.test(name) && /\p{L}/u.test(name) ? name : null;
}

/** The first word of a display name, cleaned — what `?from=` carries for a signed-in sender. */
export function firstName(displayName: string | null | undefined): string | null {
  return cleanName((displayName ?? '').trim().split(/\s+/)[0]);
}

export interface TogetherParams {
  /** The Monday, YYYY-MM-DD; dropped unless it is a real date. */
  d?: string | null;
  /** The sender's name; dropped unless {@link cleanName} keeps it. */
  from?: string | null;
  /** The sender's referral code (0051); dropped unless it has the code's shape. */
  ref?: string | null;
}

/**
 * The link a friend opens: `<origin><base>/[en/]together/?d=…&ref=…&from=…`. Each parameter goes
 * in only in its valid shape, so a caller cannot put anything else into a link people forward.
 */
export function togetherUrl(origin: string, locale: Locale, params: TogetherParams = {}): string {
  const q = new URLSearchParams();
  if (isIsoDate(params.d)) q.set('d', params.d);
  if (isReferralCode(params.ref)) q.set('ref', params.ref);
  const from = cleanName(params.from);
  if (from) q.set('from', from);
  const query = q.toString();
  const path = withBase(localePath(locale, '/together/'));
  return `${origin.replace(/\/+$/, '')}${path}${query ? `?${query}` : ''}`;
}

export interface ShareTextParams {
  /** {@link whenPhrase}. */
  when: string;
  /** {@link togetherUrl}. */
  url: string;
  /** The link carries the sender's code: add the +30 line. Never without one — it would be a lie. */
  withRef: boolean;
}

/**
 * The message: «Давай {when} тренироваться вместе? … Первая — бесплатно: {url}», and with a
 * personal link one more line about the +30 days. The plain link promises nothing.
 */
export function shareText(copy: Pick<InviteCopy, 'text' | 'refLine'>, p: ShareTextParams): string {
  const text = fill(copy.text, { when: p.when, url: p.url });
  return p.withRef ? `${text}\n${copy.refLine}` : text;
}

/** YYYYMMDD, the form both calendar formats use for an all-day date. */
function compact(iso: string): string {
  return iso.replace(/-/g, '');
}

export interface CalendarEvent {
  /** The Monday, YYYY-MM-DD. */
  date: string;
  title: string;
  details: string;
}

/**
 * Google Calendar's «add event» template for an all-day event on `date`: `dates=D/D+1`, where the
 * end is exclusive, as Google's all-day form requires.
 */
export function gcalUrl(e: CalendarEvent): string {
  const dates = `${compact(e.date)}/${compact(addDays(e.date, 1))}`;
  return (
    'https://calendar.google.com/calendar/render?action=TEMPLATE' +
    `&text=${encodeURIComponent(e.title)}` +
    `&dates=${dates}` +
    `&details=${encodeURIComponent(e.details)}`
  );
}

/** RFC 5545 TEXT escaping: backslash, semicolon, comma and line breaks. */
function icsEscape(value: string): string {
  return value
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\r?\n/g, '\\n');
}

/** RFC 5545 §3.1: lines longer than 75 octets are folded, never inside a UTF-8 character. */
function icsFold(line: string): string {
  const enc = new TextEncoder();
  const out: string[] = [];
  let current = '';
  let bytes = 0;
  for (const ch of line) {
    const size = enc.encode(ch).length;
    // The first line holds 75 octets; continuation lines start with a space, so 74 more.
    const limit = out.length === 0 ? 75 : 74;
    if (bytes + size > limit) {
      out.push(current);
      current = '';
      bytes = 0;
    }
    current += ch;
    bytes += size;
  }
  out.push(current);
  return out.join('\r\n ');
}

function icsStamp(now: Date): string {
  return now
    .toISOString()
    .replace(/[-:]/g, '')
    .replace(/\.\d{3}/, '');
}

/**
 * The `.ics` text for the same all-day event: `DTSTART;VALUE=DATE` / `DTEND;VALUE=DATE` (end
 * exclusive), so a phone in any timezone files it under that Monday. The UID is derived from the
 * date and the host, so importing the file twice updates one event instead of adding a second.
 */
export function icsText(e: CalendarEvent & { host: string; now?: Date }): string {
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Forma//Together//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:together-${compact(e.date)}@${e.host.replace(/[^A-Za-z0-9.-]/g, '')}`,
    `DTSTAMP:${icsStamp(e.now ?? new Date())}`,
    `DTSTART;VALUE=DATE:${compact(e.date)}`,
    `DTEND;VALUE=DATE:${compact(addDays(e.date, 1))}`,
    `SUMMARY:${icsEscape(e.title)}`,
    `DESCRIPTION:${icsEscape(e.details)}`,
    'TRANSP:TRANSPARENT',
    'END:VEVENT',
    'END:VCALENDAR',
  ];
  return `${lines.map(icsFold).join('\r\n')}\r\n`;
}

/** {@link icsText} as a file the browser can hand to the calendar. */
export function icsBlob(e: CalendarEvent & { host: string; now?: Date }): Blob {
  return new Blob([icsText(e)], { type: 'text/calendar;charset=utf-8' });
}
