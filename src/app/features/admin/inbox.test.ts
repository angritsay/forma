import { describe, expect, it } from 'vitest';
import { AppError } from '@/lib/api/errors';
import {
  bookingSourceKey,
  chatLink,
  deliveryKey,
  formatMoscow,
  langLabel,
  mailLink,
  replyErrorKey,
  replyRoute,
  syncMessage,
} from './inbox';

describe('formatMoscow', () => {
  /* She arranges the coach's day in Moscow time, whatever zone the phone is in. */
  it('shows Moscow time', () => {
    const s = formatMoscow('2026-09-25T15:00:00Z', 'ru');
    expect(s).toContain('18:00');
    expect(s).toContain('25');
    expect(formatMoscow('2026-09-25T15:00:00Z', 'en')).toContain('18:00');
  });

  it('is empty for a date that is not one', () => {
    expect(formatMoscow('nonsense', 'ru')).toBe('');
  });
});

describe('chatLink and mailLink', () => {
  it('opens t.me only for a real username', () => {
    expect(chatLink({ username: 'oleg_p' })).toBe('https://t.me/oleg_p');
    expect(chatLink({ username: '@oleg_p' })).toBe('https://t.me/oleg_p');
    expect(chatLink({ username: null })).toBeNull();
    expect(chatLink({ username: 'a b' })).toBeNull();
    expect(chatLink({ username: 'x/../evil' })).toBeNull();
  });

  it('writes an email only to an address', () => {
    expect(mailLink({ email: 'masha@example.com' })).toBe('mailto:masha@example.com');
    expect(mailLink({ email: null })).toBeNull();
    expect(mailLink({ email: 'nope' })).toBeNull();
  });
});

describe('replyRoute', () => {
  it('goes to the chat when there is one, waits for an email-only person, else nowhere', () => {
    expect(replyRoute({ telegramId: 1, canReply: true })).toBe('chat');
    expect(replyRoute({ telegramId: null, canReply: true })).toBe('wait');
    expect(replyRoute({ telegramId: null, canReply: false })).toBe('none');
  });
});

describe('labels', () => {
  it('shortens a language code', () => {
    expect(langLabel('en-US')).toBe('EN');
    expect(langLabel('ru')).toBe('RU');
    expect(langLabel(null)).toBe('');
    expect(langLabel('1')).toBe('');
  });

  it('names the delivery of a reply', () => {
    expect(deliveryKey('pending')).toBe('app.inboxDeliveryPending');
    expect(deliveryKey('skipped')).toBe('app.inboxDeliverySkipped');
    expect(deliveryKey(null)).toBeNull();
  });

  it('names the source of a booking', () => {
    expect(bookingSourceKey('google_calendar')).toBe('app.bookingsSourceGoogle');
    expect(bookingSourceKey('admin')).toBe('app.bookingsSourceAdmin');
    expect(bookingSourceKey('calendly_webhook')).toBe('app.bookingsSourceOther');
  });
});

describe('replyErrorKey', () => {
  it('gives every server refusal a sentence', () => {
    expect(replyErrorKey(new AppError('validation', 'rate_limited'))).toBe(
      'app.inboxReplyErrorRate',
    );
    expect(replyErrorKey(new AppError('validation', 'no_address'))).toBe(
      'app.inboxReplyErrorAddress',
    );
    expect(replyErrorKey(new AppError('validation', 'text_too_long'))).toBe('app.supportErrorLong');
    expect(replyErrorKey(new Error('?'))).toBe('app.inboxReplyError');
  });
});

describe('syncMessage', () => {
  it('reports the counts of a good sync as a success', () => {
    expect(syncMessage({ kind: 'ok', booked: 2, cancelled: 1, failed: 0 })).toEqual({
      key: 'app.bookingsSyncOk',
      params: { booked: 2, cancelled: 1 },
      tone: 'success',
    });
  });

  /* The 503 is the one she can fix herself, and the sentence names how. */
  it('keeps the not-configured explanation on screen', () => {
    expect(syncMessage({ kind: 'not_configured' })).toEqual({
      key: 'app.bookingsSyncNotConfigured',
      tone: 'error',
    });
  });

  it('treats a double tap as information, not an error', () => {
    expect(syncMessage({ kind: 'busy' }).tone).toBe('info');
  });
});
