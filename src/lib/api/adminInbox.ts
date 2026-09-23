/**
 * «Обращения» and «Записи» in the admin (0045). Every call is re-checked server-side by
 * `is_admin()`; the calendar sync by the function itself, with the caller's own token.
 *
 * Kept out of `admin.ts` on purpose: the two screens own these calls, and the mappers below are
 * pure so they are tested without a database.
 */
import { supabase } from './client';
import { AppError } from './errors';
import { guard, unwrap, unwrapVoid } from './internal';
import { isDemo } from './mode';

// --- «Обращения» ----------------------------------------------------------------------------

/** The screen's three tabs: new, answered (and closed), everything. */
export type SupportTab = 'new' | 'answered' | 'all';
export type SupportState = 'new' | 'answered' | 'closed';
/** Where the message came from: the bot's private chat, or «Написать тренеру» in the app. */
export type SupportChannel = 'bot' | 'app';
/** What happened to the last reply in the bot's queue; null — no reply yet. */
export type ReplyDelivery = 'pending' | 'sent' | 'skipped' | 'failed' | null;

export interface SupportItem {
  id: string;
  createdAt: string;
  channel: SupportChannel;
  status: SupportState;
  name: string | null;
  email: string | null;
  telegramId: number | null;
  /** Without the `@`. */
  username: string | null;
  lang: string | null;
  context: string | null;
  text: string;
  /** `photo`, `video`, … when the text was a caption. */
  attachment: string | null;
  answeredAt: string | null;
  answeredBy: string | null;
  replyText: string | null;
  replyDelivery: ReplyDelivery;
  /** There is somewhere to send a reply: a Telegram chat now, or an email to wait on. */
  canReply: boolean;
}

export interface SupportPage {
  items: SupportItem[];
  /** How many rows the tab has in all, for its counter and «ещё». */
  total: number;
}

/** A row of `admin_support_list()`; snake_case, straight from Postgres. */
export interface DbSupportItem {
  id: string;
  created_at: string;
  channel: string;
  status: string;
  name: string | null;
  email: string | null;
  telegram_id: number | string | null;
  telegram_username: string | null;
  lang: string | null;
  context: string | null;
  text: string | null;
  attachment: string | null;
  answered_at: string | null;
  answered_by: string | null;
  reply_text: string | null;
  reply_status: string | null;
  can_reply: boolean | null;
  total: number | string | null;
}

const DELIVERIES = ['pending', 'sent', 'skipped', 'failed'] as const;
const STATES: readonly SupportState[] = ['new', 'answered', 'closed'];

const blank = (s: string | null | undefined): string | null => {
  const v = (s ?? '').trim();
  return v === '' ? null : v;
};

export function supportItemFromDb(r: DbSupportItem): SupportItem {
  const tg = r.telegram_id === null || r.telegram_id === undefined ? NaN : Number(r.telegram_id);
  return {
    id: r.id,
    createdAt: r.created_at,
    // 0042 named the bot channel `telegram`; the screen calls it what it is to her — the bot.
    channel: r.channel === 'app' ? 'app' : 'bot',
    status: (STATES as readonly string[]).includes(r.status) ? (r.status as SupportState) : 'new',
    name: blank(r.name),
    email: blank(r.email),
    telegramId: Number.isSafeInteger(tg) && tg > 0 ? tg : null,
    username: blank(r.telegram_username)?.replace(/^@/, '') ?? null,
    lang: blank(r.lang),
    context: blank(r.context),
    text: r.text ?? '',
    attachment: blank(r.attachment),
    answeredAt: r.answered_at,
    answeredBy: blank(r.answered_by),
    replyText: blank(r.reply_text),
    replyDelivery: (DELIVERIES as readonly string[]).includes(r.reply_status ?? '')
      ? (r.reply_status as ReplyDelivery)
      : null,
    canReply: r.can_reply === true,
  };
}

export function supportPageFromDb(rows: readonly DbSupportItem[]): SupportPage {
  return {
    items: rows.map(supportItemFromDb),
    total: rows.length > 0 ? Number(rows[0]!.total) || rows.length : 0,
  };
}

export async function listSupport(tab: SupportTab, limit = 50, offset = 0): Promise<SupportPage> {
  if (isDemo()) return { items: [], total: 0 };
  return guard(async () => {
    const rows = unwrap<DbSupportItem[]>(
      await supabase().rpc('admin_support_list', {
        p_status: tab,
        p_limit: limit,
        p_offset: offset,
      }),
    );
    return supportPageFromDb(rows);
  });
}

export async function setSupportStatus(id: string, status: SupportState): Promise<void> {
  if (isDemo()) return;
  return guard(async () => {
    if (!STATES.includes(status)) throw new AppError('validation', 'invalid_status');
    unwrapVoid(await supabase().rpc('admin_support_set_status', { p_id: id, p_status: status }));
  });
}

/**
 * `sent` — in the bot's queue with a chat to go to (within ten minutes, the sender's schedule);
 * `waiting` — the person has no Telegram linked yet, and the reply waits until they open the app
 * from Telegram (up to a week); `demo` — nowhere, on purpose.
 */
export type ReplyResult = 'sent' | 'waiting' | 'demo';

export function replyResultFromDb(x: unknown): Exclude<ReplyResult, 'demo'> {
  return x === 'waiting' ? 'waiting' : 'sent';
}

export async function replySupport(id: string, text: string): Promise<ReplyResult> {
  if (isDemo()) return 'demo';
  return guard(async () => {
    const data = unwrap<string>(
      await supabase().rpc('admin_support_reply', { p_id: id, p_text: text.trim() }),
    );
    return replyResultFromDb(data);
  });
}

// --- «Записи» -------------------------------------------------------------------------------

export type BookingScope = 'upcoming' | 'past' | 'cancelled';

export interface AdminBooking {
  id: string;
  startsAt: string;
  endsAt: string;
  minutes: number;
  status: 'active' | 'cancelled';
  source: string;
  eventName: string | null;
  email: string;
  name: string | null;
  joinUrl: string | null;
  locationText: string | null;
  cancelReason: string | null;
}

export interface DbAdminBooking {
  id: string;
  starts_at: string;
  ends_at: string;
  status: string;
  source: string | null;
  event_name: string | null;
  email: string;
  name: string | null;
  join_url: string | null;
  location_text: string | null;
  cancel_reason: string | null;
}

export function adminBookingFromDb(r: DbAdminBooking): AdminBooking {
  const minutes = Math.round((Date.parse(r.ends_at) - Date.parse(r.starts_at)) / 60_000);
  return {
    id: r.id,
    startsAt: r.starts_at,
    endsAt: r.ends_at,
    minutes: Number.isFinite(minutes) && minutes > 0 ? minutes : 0,
    status: r.status === 'cancelled' ? 'cancelled' : 'active',
    source: r.source ?? '',
    eventName: blank(r.event_name),
    email: r.email,
    name: blank(r.name),
    // The column only ever holds https (0014); checked again because it becomes a link.
    joinUrl: r.join_url && /^https:\/\//.test(r.join_url) ? r.join_url : null,
    locationText: blank(r.location_text),
    cancelReason: blank(r.cancel_reason),
  };
}

export async function listAdminBookings(scope: BookingScope): Promise<AdminBooking[]> {
  if (isDemo()) return [];
  return guard(async () => {
    const rows = unwrap<DbAdminBooking[]>(
      await supabase().rpc('admin_coach_bookings', { p_scope: scope }),
    );
    return rows.map(adminBookingFromDb);
  });
}

/**
 * What «Синхронизировать сейчас» came back with, as the screen needs to say it.
 *
 *   ok             — the calendar was read; counts from the function's own line.
 *   partial        — read, but some rows failed to write (500 with counts).
 *   not_configured — 503: the Google secrets are not set in Supabase.
 *   not_deployed   — 404: the function is not on the project at all.
 *   forbidden      — 401/403: not an admin (or the session expired).
 *   busy           — 429: it has just been run.
 *   google         — 502: Google refused the credentials or the calendar.
 *   network        — no answer at all.
 */
export type SyncOutcome =
  | { kind: 'ok' | 'partial'; booked: number; cancelled: number; failed: number }
  | { kind: 'not_configured' | 'not_deployed' | 'forbidden' | 'busy' | 'google' | 'network' }
  | { kind: 'demo' };

const count = (body: string, name: string): number => {
  const m = new RegExp(`\\b${name}=(\\d+)`).exec(body);
  return m ? Number(m[1]) : 0;
};

export function syncOutcome(status: number, body: string): SyncOutcome {
  const counts = () => ({
    booked: count(body, 'booked'),
    // A booking that vanished from the calendar is cancelled too, as far as she is concerned.
    cancelled: count(body, 'cancelled') + count(body, 'vanished'),
    failed: count(body, 'failed'),
  });
  if (status >= 200 && status < 300) return { kind: 'ok', ...counts() };
  if (status === 500 && /\bscanned=\d+/.test(body)) return { kind: 'partial', ...counts() };
  if (status === 503) return { kind: 'not_configured' };
  if (status === 404) return { kind: 'not_deployed' };
  if (status === 401 || status === 403) return { kind: 'forbidden' };
  if (status === 429) return { kind: 'busy' };
  if (status === 502) return { kind: 'google' };
  return { kind: 'network' };
}

interface FunctionsErrorLike {
  context?: { status?: number; text?: () => Promise<string> };
}

export async function syncCalendarNow(): Promise<SyncOutcome> {
  if (isDemo()) return { kind: 'demo' };
  try {
    const { data, error } = await supabase().functions.invoke<string>('google-calendar-sync', {
      method: 'POST',
      body: {},
    });
    if (!error) return syncOutcome(200, typeof data === 'string' ? data : '');
    const res = (error as FunctionsErrorLike).context;
    if (res && typeof res.status === 'number') {
      const body = typeof res.text === 'function' ? await res.text().catch(() => '') : '';
      return syncOutcome(res.status, body);
    }
    return { kind: 'network' };
  } catch {
    return { kind: 'network' };
  }
}
