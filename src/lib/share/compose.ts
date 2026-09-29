/**
 * One invite, put together: the day, the link and the message, from the pieces in `invite.ts`.
 *
 * Every «Позвать с собой» on the site ends here — the `ShareInvite` island, and the plain share
 * buttons in the hero, the footer and the phone's sticky bar (`shareHome.ts`) — so the text a
 * friend receives is the same whichever button sent it:
 *
 * - **The day** is {@link nextMonday} counted from `now`. Before the browser has said what `now`
 *   is (the static HTML, built days earlier) there is no day: the chip says «в ближайший
 *   понедельник» and the link carries no `d`, which `/together/` reads as the coming Monday.
 * - **The link** is `/together/` on the visitor's origin with `d`, `from` when there is a name to
 *   sign with, and `ref` only when this browser holds the sender's own code (`forma.myRef`,
 *   `mine.ts`). A name typed into the island wins over the cached one; either way it passes
 *   `cleanName` or is dropped.
 * - **The message** is `shareText`, with the +30 line only when the link is personal. Telegram's
 *   picker puts the link above the text on its own, so it gets the same message with the link
 *   left out ({@link InviteMessage.bare}), rather than the link twice.
 *
 * Pure: `now`, the origin and the cached code are passed in, never read here.
 */
import type { Locale } from '@/content/schema';
import {
  cleanName,
  mondayLabel,
  nextMonday,
  shareText,
  togetherUrl,
  whenPhrase,
  type InviteCopy,
} from './invite';

/** The templates the composition needs; `whenSoon` covers the moment before the day is known. */
export type ComposeCopy = InviteCopy & {
  /** «с ближайшего понедельника» — the message's day before the browser knows today's date. */
  whenSoon: string;
  /** «в ближайший понедельник» — the chip's day, likewise. */
  soonLabel: string;
};

export interface ComposeInput {
  locale: Locale;
  copy: ComposeCopy;
  /** `location.origin` in the browser; the site's canonical origin at build time. */
  origin: string;
  /** Today, or null before the browser has run (the static HTML). */
  now: Date | null;
  /** The sender's cached code and first name (`myRef()`), each null when absent or malformed. */
  mine: { code: string | null; name: string | null };
  /** A name typed into the island; blank or invalid falls back to the cached one. */
  typedName?: string | null;
}

export interface InviteMessage {
  /** The Monday, YYYY-MM-DD, or null while `now` is unknown. */
  date: string | null;
  /** «понедельник, 5 октября» / «завтра, 5 октября» / «сегодня» / «в ближайший понедельник». */
  label: string;
  /** The name the link signs with, or null. */
  from: string | null;
  /** The link carries the sender's code. */
  withRef: boolean;
  /** The `/together/` link. */
  url: string;
  /** The whole message, link included. */
  text: string;
  /** The message without the link, for pickers that attach the link themselves (Telegram). */
  bare: string;
}

/** The name to sign with: a valid typed one, else the cached one, else none. */
export function signature(typed: string | null | undefined, cached: string | null): string | null {
  return cleanName(typed) ?? cleanName(cached);
}

/** Drop the link's place from a message line: «… бесплатно: » → «… бесплатно». */
function withoutLink(line: string): string {
  return line.replace(/[\s:：—-]+$/u, '');
}

export function composeInvite(input: ComposeInput): InviteMessage {
  const { locale, copy, origin, now, mine } = input;
  const date = now ? nextMonday(now) : null;
  const from = signature(input.typedName, mine.name);
  const withRef = mine.code !== null;
  const url = togetherUrl(origin, locale, {
    d: date,
    ref: mine.code,
    from,
  });
  const when = date && now ? whenPhrase(locale, copy, date, now) : copy.whenSoon;
  const text = shareText(copy, { when, url, withRef });
  const [first = '', ...rest] = shareText(copy, { when, url: '', withRef }).split('\n');
  const bare = [withoutLink(first), ...rest].join('\n');
  const label = date && now ? mondayLabel(locale, date, now) : copy.soonLabel;
  return { date, label, from, withRef, url, text, bare };
}
