import { describe, expect, it } from 'vitest';
import {
  adminBookingFromDb,
  replyResultFromDb,
  supportItemFromDb,
  supportPageFromDb,
  syncOutcome,
  type DbAdminBooking,
  type DbSupportItem,
} from './adminInbox';

const row = (over: Partial<DbSupportItem> = {}): DbSupportItem => ({
  id: 'r1',
  created_at: '2026-09-23T10:00:00Z',
  channel: 'telegram',
  status: 'new',
  name: 'Oleg',
  email: null,
  telegram_id: '45045045',
  telegram_username: 'oleg_p',
  lang: 'en',
  context: null,
  text: 'Hi, a question',
  attachment: null,
  answered_at: null,
  answered_by: null,
  reply_text: null,
  reply_status: null,
  can_reply: true,
  total: '3',
  ...over,
});

describe('supportItemFromDb', () => {
  it('maps a message from the bot', () => {
    expect(supportItemFromDb(row())).toEqual({
      id: 'r1',
      createdAt: '2026-09-23T10:00:00Z',
      channel: 'bot',
      status: 'new',
      name: 'Oleg',
      email: null,
      telegramId: 45045045,
      username: 'oleg_p',
      lang: 'en',
      context: null,
      text: 'Hi, a question',
      attachment: null,
      answeredAt: null,
      answeredBy: null,
      replyText: null,
      replyDelivery: null,
      canReply: true,
    });
  });

  it('maps a message from the app, answered, with the reply in the queue', () => {
    const item = supportItemFromDb(
      row({
        channel: 'app',
        status: 'answered',
        email: 'masha@example.com',
        telegram_id: null,
        telegram_username: null,
        context: 'Тренер: 60 минут',
        answered_at: '2026-09-23T11:00:00Z',
        answered_by: 'admin@example.com',
        reply_text: 'Можно',
        reply_status: 'pending',
      }),
    );
    expect(item).toMatchObject({
      channel: 'app',
      status: 'answered',
      telegramId: null,
      username: null,
      context: 'Тренер: 60 минут',
      replyText: 'Можно',
      replyDelivery: 'pending',
    });
  });

  it('survives what the database should never send', () => {
    const item = supportItemFromDb(
      row({
        status: 'weird',
        telegram_id: 'abc',
        telegram_username: '  ',
        name: '',
        reply_status: 'lost',
        can_reply: null,
        text: null,
      }),
    );
    expect(item).toMatchObject({
      status: 'new',
      telegramId: null,
      username: null,
      name: null,
      replyDelivery: null,
      canReply: false,
      text: '',
    });
  });
});

describe('supportPageFromDb', () => {
  it('takes the total from the window count', () => {
    expect(supportPageFromDb([row(), row({ id: 'r2' })]).total).toBe(3);
    expect(supportPageFromDb([])).toEqual({ items: [], total: 0 });
  });
});

describe('replyResultFromDb', () => {
  it('reads waiting and treats anything else as sent', () => {
    expect(replyResultFromDb('waiting')).toBe('waiting');
    expect(replyResultFromDb('sent')).toBe('sent');
    expect(replyResultFromDb(null)).toBe('sent');
  });
});

describe('adminBookingFromDb', () => {
  const booking = (over: Partial<DbAdminBooking> = {}): DbAdminBooking => ({
    id: 'b1',
    starts_at: '2026-09-25T15:00:00Z',
    ends_at: '2026-09-25T16:00:00Z',
    status: 'active',
    source: 'google_calendar',
    event_name: 'Онлайн-тренировка',
    email: 'masha@example.com',
    name: 'Маша',
    join_url: 'https://meet.google.com/abc',
    location_text: null,
    cancel_reason: null,
    ...over,
  });

  it('counts the minutes and keeps an https join link', () => {
    expect(adminBookingFromDb(booking())).toMatchObject({
      minutes: 60,
      status: 'active',
      source: 'google_calendar',
      name: 'Маша',
      joinUrl: 'https://meet.google.com/abc',
    });
  });

  it('drops a link that is not https and a name that is empty', () => {
    const b = adminBookingFromDb(
      booking({ join_url: 'javascript:alert(1)', name: ' ', status: 'cancelled' }),
    );
    expect(b.joinUrl).toBeNull();
    expect(b.name).toBeNull();
    expect(b.status).toBe('cancelled');
  });

  it('never reports negative minutes', () => {
    expect(adminBookingFromDb(booking({ ends_at: 'nonsense' })).minutes).toBe(0);
  });
});

describe('syncOutcome', () => {
  const line = 'scanned=12 booked=3 cancelled=1 vanished=2 ignored=6 failed=0 interval=10m';

  it('reads the counts from the function’s own line', () => {
    expect(syncOutcome(200, line)).toEqual({ kind: 'ok', booked: 3, cancelled: 3, failed: 0 });
  });

  it('tells a partial write from a crash', () => {
    expect(syncOutcome(500, line.replace('failed=0', 'failed=2'))).toEqual({
      kind: 'partial',
      booked: 3,
      cancelled: 3,
      failed: 2,
    });
    expect(syncOutcome(500, 'boom').kind).toBe('network');
  });

  it('names every refusal', () => {
    expect(syncOutcome(503, 'not configured').kind).toBe('not_configured');
    expect(syncOutcome(404, '').kind).toBe('not_deployed');
    expect(syncOutcome(403, 'not an admin').kind).toBe('forbidden');
    expect(syncOutcome(401, '').kind).toBe('forbidden');
    expect(syncOutcome(429, 'just synced').kind).toBe('busy');
    expect(syncOutcome(502, 'google refused the credentials').kind).toBe('google');
  });
});
