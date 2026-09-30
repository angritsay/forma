/**
 * The payments journal's buttons (0058), rendered on the server: a paid session with no time gets
 * «Записать на время» and «Возврат сделан», an unmatched course payment «Это занятие», and a
 * refunded session reads «Закрыт без записи» with no buttons at all.
 */
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { t } from '@/i18n/index';
import type { PaymentRow } from '@/lib/api/adminPayments';
import { PaymentList } from './PaymentList';

const pay = (over: Partial<PaymentRow> = {}): PaymentRow => ({
  id: 'p1',
  email: 'buyer@example.com',
  amount: 2600,
  currency: 'RUB',
  intent: 'course',
  provider: 'prodamus',
  providerRef: 'R-1',
  paidAt: '2026-09-23T10:00:00Z',
  applied: false,
  claimedAt: null,
  accountEmail: null,
  resolution: null,
  resolvedAt: null,
  boundEmail: null,
  resolveNote: null,
  courseId: null,
  hasAccount: false,
  sessionOption: null,
  ...over,
});

const render = (row: PaymentRow) =>
  renderToStaticMarkup(
    createElement(PaymentList, {
      rows: [row],
      busyId: null,
      onBind: () => {},
      onDismiss: () => {},
      onBook: () => {},
      onRefund: () => {},
    }),
  );

describe('PaymentList', () => {
  it('offers «Это занятие» for money that opened nothing', () => {
    expect(render(pay())).toContain(t('ru', 'app.adminPayAsSession'));
    expect(render(pay({ courseId: 'start', applied: true }))).not.toContain(
      t('ru', 'app.adminPayAsSession'),
    );
  });

  it('lets a paid session with no time be booked or closed as a refund', () => {
    const html = render(pay({ intent: 'session', amount: 2500 }));
    expect(html).toContain(t('ru', 'app.adminPayBook'));
    expect(html).toContain(t('ru', 'app.adminPayRefund'));
  });

  it('a refunded session is closed, not «Оплачено», and asks for nothing', () => {
    const html = render(
      pay({ intent: 'session', resolution: 'dismissed', resolveNote: 'Возврат' }),
    );
    expect(html).toContain(t('ru', 'app.adminPayStateSessionClosed'));
    expect(html).not.toContain(t('ru', 'app.adminPayBook'));
    expect(html).not.toContain(t('ru', 'app.adminPayRefund'));
  });
});
