/**
 * The «Тренер» tab after a hold ran out with the payment page already opened (0056): it must say
 * the payment is being checked — never «the time ran out, pick again», which is how a client paid
 * twice — and offer the coach once it stops waiting.
 */
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { t } from '@/i18n/index';
import { holdLapse } from '@/lib/coach/slots';
import { PaymentChecking } from './PaymentChecking';

const render = (state: 'checking' | 'unconfirmed') =>
  renderToStaticMarkup(
    createElement(PaymentChecking, { state, onContact: () => {}, onDismiss: () => {} }),
  );

describe('PaymentChecking', () => {
  it('a hold that lapsed after the till opened is checked, not offered again', () => {
    const T = Date.parse('2026-10-05T07:00:00Z');
    expect(holdLapse(true, T, T + 1_000)).toBe('checking');
    const html = render('checking');
    expect(html).toContain('aria-busy="true"');
    expect(html).toContain(t('ru', 'app.bookPaymentChecking'));
    expect(html).not.toContain(t('ru', 'app.bookHoldExpired'));
    // No coach button while it is still waiting: the booking may appear any second.
    expect(html).not.toContain(t('ru', 'app.bookContact'));
    expect(html).toContain(t('ru', 'app.bookPaymentNotPaid'));
  });

  it('stops waiting and points to the coach', () => {
    const html = render('unconfirmed');
    expect(html).not.toContain('aria-busy');
    expect(html).toContain(t('ru', 'app.bookPaymentCheckingLong'));
    expect(html).toContain(t('ru', 'app.bookContact'));
  });
});
