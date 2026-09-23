/**
 * The rules behind «Обращения» and «Записи» (0045), out of the components so they are tested.
 */
import type { Locale, TKey } from '@/i18n/index';
import { isAppError } from '@/lib/api/errors';
import type { ReplyDelivery, SupportItem, SyncOutcome } from '@/lib/api/adminInbox';

/** The coach's time zone: every booking and every message is read in Moscow time. */
export const COACH_TIME_ZONE = 'Europe/Moscow';

/** «пт, 26 сент., 18:00» — weekday, date and time in Moscow, whatever the phone's zone. */
export function formatMoscow(iso: string, locale: Locale): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  return new Intl.DateTimeFormat(locale === 'en' ? 'en-GB' : 'ru-RU', {
    timeZone: COACH_TIME_ZONE,
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

/**
 * The chat to open from a card: `t.me/<username>` when the person has one.
 *
 * Only a username gives a link that works everywhere. `tg://user?id=` opens a chat only when the
 * person's privacy settings allow it, and only in some clients, so it is not offered — the reply
 * through the bot reaches everybody who wrote to it anyway.
 */
export function chatLink(item: Pick<SupportItem, 'username'>): string | null {
  const name = (item.username ?? '').replace(/^@/, '');
  return /^[A-Za-z0-9_]{3,32}$/.test(name) ? `https://t.me/${name}` : null;
}

/** A `mailto:` for the person's address, or null. */
export function mailLink(item: Pick<SupportItem, 'email'>): string | null {
  const email = (item.email ?? '').trim();
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? `mailto:${email}` : null;
}

/**
 * Whether a reply goes straight to a Telegram chat, or has to wait for the person to link one.
 * Mirrors `admin_support_reply` (0045): the chat of the request, or of the linked profile.
 */
export function replyRoute(
  item: Pick<SupportItem, 'telegramId' | 'canReply'>,
): 'chat' | 'wait' | 'none' {
  if (item.telegramId) return 'chat';
  return item.canReply ? 'wait' : 'none';
}

/** «RU» / «EN» for a Telegram or app language code, or '' for nothing useful. */
export function langLabel(lang: string | null): string {
  const code = (lang ?? '').trim().slice(0, 2).toLowerCase();
  return /^[a-z]{2}$/.test(code) ? code.toUpperCase() : '';
}

export function deliveryKey(delivery: ReplyDelivery): TKey | null {
  switch (delivery) {
    case 'pending':
      return 'app.inboxDeliveryPending';
    case 'sent':
      return 'app.inboxDeliverySent';
    case 'skipped':
      return 'app.inboxDeliverySkipped';
    case 'failed':
      return 'app.inboxDeliveryFailed';
    default:
      return null;
  }
}

/** The sentence for a failed reply; every failure gets one, none gets a code. */
export function replyErrorKey(e: unknown): TKey {
  if (isAppError(e)) {
    if (e.message.includes('rate_limited')) return 'app.inboxReplyErrorRate';
    if (e.message.includes('no_address')) return 'app.inboxReplyErrorAddress';
    if (e.message.includes('text_too_long')) return 'app.supportErrorLong';
    if (e.message.includes('text_empty')) return 'app.supportErrorEmpty';
    if (e.code === 'network') return 'app.supportErrorNetwork';
  }
  return 'app.inboxReplyError';
}

/** How a booking's source reads to her: the calendar, by hand, or anything else. */
export function bookingSourceKey(source: string): TKey {
  if (source === 'google_calendar') return 'app.bookingsSourceGoogle';
  if (source === 'admin') return 'app.bookingsSourceAdmin';
  return 'app.bookingsSourceOther';
}

export interface SyncMessage {
  key: TKey;
  params?: Record<string, number>;
  /** `error` stays on the screen until the next try; the rest is a toast. */
  tone: 'success' | 'info' | 'error';
}

export function syncMessage(outcome: SyncOutcome): SyncMessage {
  switch (outcome.kind) {
    case 'ok':
      return {
        key: 'app.bookingsSyncOk',
        params: { booked: outcome.booked, cancelled: outcome.cancelled },
        tone: 'success',
      };
    case 'partial':
      return { key: 'app.bookingsSyncPartial', params: { failed: outcome.failed }, tone: 'error' };
    case 'not_configured':
      return { key: 'app.bookingsSyncNotConfigured', tone: 'error' };
    case 'not_deployed':
      return { key: 'app.bookingsSyncNotDeployed', tone: 'error' };
    case 'forbidden':
      return { key: 'app.bookingsSyncForbidden', tone: 'error' };
    case 'busy':
      return { key: 'app.bookingsSyncBusy', tone: 'info' };
    case 'google':
      return { key: 'app.bookingsSyncGoogle', tone: 'error' };
    case 'demo':
      return { key: 'app.bookingsSyncDemo', tone: 'info' };
    case 'network':
      return { key: 'app.bookingsSyncNetwork', tone: 'error' };
  }
}
