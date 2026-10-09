/**
 * The renewal reminder under automatic monthly renewal (`RENEWAL`, off today; docs/SETUP.md
 * §7.18). Since 0068 the queue row carries the subscription's `plan` and `status`; the mode is
 * passed explicitly, so the auto message is tested while the switch stays `'manual'`.
 */
import { describe, expect, it } from 'vitest';
import { messageFor, RENEWAL, renewsByItself, SUPPORT_EMAIL } from './copy';

const EXPIRES = '2026-10-02T21:30:00Z';
const row = (params: Record<string, unknown>) => ({ kind: 'subscription_ending', params });
const MANUAL_RU =
  '<b>Клуб открыт до 3 октября</b>\n\n' +
  'Автопродления нет: чтобы остаться в клубе, продли подписку в приложении.';

describe('renewsByItself', () => {
  it('only with the switch on, for an active monthly subscription', () => {
    expect(renewsByItself({ plan: 'monthly', status: 'active' }, 'auto')).toBe(true);
    expect(renewsByItself({ plan: 'monthly', status: 'active' }, 'manual')).toBe(false);
    expect(renewsByItself({ plan: 'monthly', status: 'cancelled' }, 'auto')).toBe(false);
    expect(renewsByItself({ plan: 'annual', status: 'active' }, 'auto')).toBe(false);
    // A row queued before 0068 has neither field: it was manual renewal then.
    expect(renewsByItself({}, 'auto')).toBe(false);
  });
});

describe('subscription_ending', () => {
  it('in manual mode is today’s message, whatever the row carries', () => {
    const params = { expires_at: EXPIRES, plan: 'monthly', status: 'active' };
    expect(messageFor(row(params), 'ru', undefined, 'manual')?.text).toBe(MANUAL_RU);
  });

  it('follows the switch by default', () => {
    const params = { expires_at: EXPIRES, plan: 'monthly', status: 'active' };
    expect(messageFor(row(params), 'ru')).toEqual(
      messageFor(row(params), 'ru', undefined, RENEWAL),
    );
  });

  it('in auto mode, says when the charge is and how to cancel', () => {
    const params = { expires_at: EXPIRES, plan: 'monthly', status: 'active' };
    const ru = messageFor(row(params), 'ru', undefined, 'auto');
    expect(ru?.text).toBe(
      '<b>Клуб продлится 3 октября</b>\n\n' +
        'В этот день спишем оплату за следующие 30 дней — столько же, сколько в прошлый раз, с той же карты. ' +
        `Не хочешь продлевать — отмени до этого дня: по ссылке в письме с чеком или написав на ${SUPPORT_EMAIL}. ` +
        'Оплаченные дни останутся.',
    );
    expect(ru?.buttonText).toBe('Открыть приложение');
    const en = messageFor(row(params), 'en', undefined, 'auto');
    expect(en?.text).toContain('<b>Your club renews on 3 October</b>');
    expect(en?.text).toContain(SUPPORT_EMAIL);
    expect(en?.text).not.toContain('no auto-renewal');
  });

  it('in auto mode, keeps the manual message for a cancelled, an annual or an old row', () => {
    for (const params of [
      { expires_at: EXPIRES, plan: 'monthly', status: 'cancelled' },
      { expires_at: EXPIRES, plan: 'annual', status: 'active' },
      { expires_at: EXPIRES },
    ]) {
      expect(messageFor(row(params), 'ru', undefined, 'auto')?.text).toBe(MANUAL_RU);
    }
  });

  it('in auto mode, still sends nothing without a readable date', () => {
    expect(
      messageFor(
        row({ expires_at: 'soon', plan: 'monthly', status: 'active' }),
        'ru',
        undefined,
        'auto',
      ),
    ).toBeNull();
  });
});
