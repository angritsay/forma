/**
 * The booked-session card and what stands in its place when the news is bad (0058), rendered to
 * markup on the server: no link says who sends it, a client without Telegram is told no reminder
 * will come (but not inside Telegram, where the link is made on launch), a cancelled session says
 * so with a way forward, and a failed read is said rather than looking like «nothing booked».
 */
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { t } from '@/i18n/index';
import type { CoachBooking } from '@/lib/api/types';
import { BookingsReadError, CancelledSession, UpcomingSession } from './SessionCard';

const NOW = Date.parse('2026-10-05T07:00:00Z');
const booking: CoachBooking = {
  id: 'b1',
  startsAt: '2026-10-07T07:00:00Z',
  endsAt: '2026-10-07T07:30:00Z',
  durationMinutes: 30,
  timezone: 'Europe/Moscow',
  joinUrl: null,
  locationKind: null,
  locationText: null,
  cancelUrl: null,
  rescheduleUrl: null,
  status: 'active',
  eventName: null,
  coachId: 'sergey',
  optionId: 'half',
};

const card = (patch: Partial<Parameters<typeof UpcomingSession>[0]> = {}) =>
  renderToStaticMarkup(
    createElement(UpcomingSession, {
      booking,
      now: NOW,
      telegram: true,
      inTelegram: false,
      onMove: () => {},
      onContact: () => {},
      ...patch,
    }),
  );

describe('UpcomingSession', () => {
  it('without a link, says the coach sends it and offers to write', () => {
    const html = card();
    expect(html).toContain(t('ru', 'app.bookNoLink'));
    expect(html).toContain(t('ru', 'app.bookContact'));
  });

  it('tells a client without Telegram that no reminder will come, and where to link it', () => {
    const html = card({ telegram: false });
    expect(html).toContain(t('ru', 'app.bookTelegramPrompt'));
    expect(html).toContain('https://t.me/forma_training_bot');
  });

  it('says nothing about Telegram when it is linked, unknown, or the app is open inside it', () => {
    expect(card({ telegram: true })).not.toContain(t('ru', 'app.bookTelegramPrompt'));
    expect(card({ telegram: null })).not.toContain(t('ru', 'app.bookTelegramPrompt'));
    expect(card({ telegram: false, inTelegram: true })).not.toContain(
      t('ru', 'app.bookTelegramPrompt'),
    );
  });

  it('draws nothing once the session is over', () => {
    expect(card({ now: Date.parse('2026-10-07T08:00:00Z') })).toBe('');
  });
});

describe('CancelledSession', () => {
  it('says the session was cancelled, when it was, and how to pick another', () => {
    const html = renderToStaticMarkup(
      createElement(CancelledSession, {
        booking: { ...booking, status: 'cancelled' },
        onContact: () => {},
      }),
    );
    expect(html).toContain(t('ru', 'app.bookCancelled'));
    expect(html).toContain(t('ru', 'app.bookContact'));
    expect(html).toContain('role="status"');
  });
});

describe('BookingsReadError', () => {
  it('says the sessions could not be checked, and asks again', () => {
    const html = renderToStaticMarkup(createElement(BookingsReadError, { onRetry: () => {} }));
    expect(html).toContain(t('ru', 'app.bookReadError'));
    expect(html).toContain(t('ru', 'app.bookReadRetry'));
    expect(html).toContain('role="alert"');
  });
});
