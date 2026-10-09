/**
 * Automatic monthly renewal is prepared and switched off (`RENEWAL`, plans.ts; docs/SETUP.md
 * §7.18). These tests hold three things:
 *
 *   1. **Off means today.** With `'manual'` every string is the one the site has always shown —
 *      the manual variant of every pair is the original key or text, byte for byte.
 *   2. **On is ready.** Every auto variant exists in both languages, says the plan renews until
 *      cancelled and how to cancel, and never says «no auto-renewal» about the 30 days.
 *   3. **The flip cannot be half-done.** Auto mode demands a bumped `legalUpdatedAt`, a subscription
 *      link, and the bot's mirror flipped with it.
 */
import { describe, expect, it } from 'vitest';
import { t } from '@/i18n/index';
import { RENEWAL_KEYS, renewalKey, type RenewalCopy } from '@/lib/renewal';
import { refundDocument, termsDocument, type LegalDocument } from '@/components/landing/legal';
import {
  RENEWAL as BOT_RENEWAL,
  SUPPORT_EMAIL as BOT_SUPPORT_EMAIL,
} from '../../supabase/functions/telegram-notify/copy';
import { BRAND } from './brand';
import { autoRenewalFaq, HOME_FAQ } from './faq';
import { LINKS } from './links';
import {
  AUTO_RENEW_TEXT_DATE,
  MONTHLY_AUTO_PAYMENT_URL,
  MONTHLY_ONE_OFF_PAYMENT_URL,
  PLANS,
  planRenewsAutomatically,
  plansFor,
  RENEWAL,
} from './plans';
import { PRICING } from './pricing';

const SUPPORT = LINKS.supportEmail || BRAND.contactEmail;

function sectionText(doc: LegalDocument, locale: 'ru' | 'en', id: string): string {
  const section = doc.sections.find((s) => s.id === id);
  if (!section) throw new Error(`no section ${id}`);
  return [...(section.paragraphs ?? []), ...(section.bullets ?? []), ...(section.after ?? [])]
    .map((p) => p[locale])
    .join('\n');
}

/*
 * Nothing here asserts which way the switch is set: flipping it must be a change of constants
 * only, never of tests. What the live surfaces show is checked as «whatever `RENEWAL` selects»,
 * and each variant is checked by passing its mode explicitly.
 */
describe('the switch', () => {
  it('covers the monthly plan only, and only in auto mode', () => {
    expect(planRenewsAutomatically('monthly', 'manual')).toBe(false);
    expect(planRenewsAutomatically('annual', 'manual')).toBe(false);
    expect(planRenewsAutomatically('monthly', 'auto')).toBe(true);
    expect(planRenewsAutomatically('annual', 'auto')).toBe(false);
  });

  it('dates the auto-mode legal text as a calendar day', () => {
    expect(AUTO_RENEW_TEXT_DATE).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});

/*
 * The guard on the flip itself. Each of these is vacuous while the switch is off and becomes a
 * hard failure the moment it is flipped without the rest of the checklist.
 */
describe('flipping the switch', () => {
  it('bumps legalUpdatedAt to the auto-mode text or later', () => {
    if (RENEWAL === 'auto') expect(PRICING.legalUpdatedAt >= AUTO_RENEW_TEXT_DATE).toBe(true);
  });

  it('comes with a Prodamus subscription link that is not the one-off one', () => {
    if (RENEWAL !== 'auto') return;
    expect(MONTHLY_AUTO_PAYMENT_URL?.ru).toMatch(/^https:\/\//);
    expect(MONTHLY_AUTO_PAYMENT_URL?.ru).not.toBe(MONTHLY_ONE_OFF_PAYMENT_URL.ru);
  });

  it('flips the bot with it: the edge function keeps its own copy of the switch', () => {
    expect(BOT_RENEWAL).toBe(RENEWAL);
  });

  it('names the same support address in the bot as on the site', () => {
    expect(BOT_SUPPORT_EMAIL).toBe(SUPPORT);
  });
});

describe('the plans', () => {
  it('are the plans the switch selects', () => {
    expect(PLANS).toEqual(plansFor(RENEWAL));
  });

  it('in manual mode, are exactly what has always been sold', () => {
    const monthly = plansFor('manual').find((p) => p.id === 'monthly');
    expect(monthly?.note).toEqual({
      ru: 'Автосписаний нет — продлевается вручную',
      en: 'No auto-renewal — renewed by hand',
    });
    expect(monthly?.paymentUrl).toEqual({ ru: 'https://payform.ru/lvcyfuk/' });
  });

  it('in auto mode, the 30 days say they renew and use the subscription link', () => {
    const monthly = plansFor('auto').find((p) => p.id === 'monthly');
    expect(monthly?.note.ru).toContain('пока не отменишь');
    expect(monthly?.note.en).toContain('until you cancel');
    expect(monthly?.paymentUrl).toBe(MONTHLY_AUTO_PAYMENT_URL);
    expect(monthly?.price).toEqual(plansFor('manual').find((p) => p.id === 'monthly')?.price);
  });

  it('leave the year exactly as it is in both modes', () => {
    const year = (mode: 'manual' | 'auto') => plansFor(mode).find((p) => p.id === 'annual');
    expect(year('auto')).toEqual(year('manual'));
  });
});

describe('the interface strings', () => {
  const manualKeys: Record<RenewalCopy, string> = {
    subscribeDescription: 'landing.subscribeDescription',
    subscribeNote: 'landing.subscribeNote',
    subscribeFaq5A: 'landing.subscribeFaq5A',
    clubNoAutoRenew: 'landing.clubNoAutoRenew',
    ladderFootnoteShort: 'landing.ladderFootnoteShort',
    creatorsClubPriceNote: 'landing.creatorsClubPriceNote',
  };

  it('in manual mode resolve to the original keys, and follow the switch by default', () => {
    for (const which of Object.keys(RENEWAL_KEYS) as RenewalCopy[]) {
      expect(renewalKey(which, 'manual')).toBe(manualKeys[which]);
      expect(renewalKey(which)).toBe(renewalKey(which, RENEWAL));
    }
  });

  it('have an auto twin in both languages, different from the manual one', () => {
    for (const which of Object.keys(RENEWAL_KEYS) as RenewalCopy[]) {
      const key = renewalKey(which, 'auto');
      expect(key).not.toBe(manualKeys[which]);
      for (const locale of ['ru', 'en'] as const) {
        const text = t(locale, key, { email: SUPPORT, days: 14, n: 3, month: 'M', month30: 'T' });
        expect(text).not.toBe(key);
        expect(text).not.toBe(t(locale, renewalKey(which, 'manual')));
        expect(text).not.toMatch(/\{\w+\}/);
      }
    }
  });

  it('in auto mode never promise «no auto-renewal» about the whole club', () => {
    for (const which of Object.keys(RENEWAL_KEYS) as RenewalCopy[]) {
      const ru = t('ru', renewalKey(which, 'auto'), { email: SUPPORT });
      const en = t('en', renewalKey(which, 'auto'), { email: SUPPORT });
      expect(ru).not.toMatch(/[Аа]втосписаний нет/);
      expect(en).not.toMatch(/No auto-renewal/);
    }
    // The line under the year's charge names the year, the only plan it is still true of.
    expect(t('ru', renewalKey('clubNoAutoRenew', 'auto'))).toBe('Год — без автосписаний');
    expect(t('en', renewalKey('clubNoAutoRenew', 'auto'))).toBe(
      'The year does not renew by itself',
    );
  });

  it('tell how to cancel in the auto FAQ answer', () => {
    const ru = t('ru', renewalKey('subscribeFaq5A', 'auto'), { email: SUPPORT });
    const en = t('en', renewalKey('subscribeFaq5A', 'auto'), { email: SUPPORT });
    expect(ru).toContain(SUPPORT);
    expect(ru).toContain('пока не отменишь');
    expect(ru).toContain('за три дня до списания');
    expect(en).toContain(SUPPORT);
    expect(en).toContain('until you cancel');
  });
});

describe('the home FAQ', () => {
  it('shows the answer the switch selects', () => {
    const shown = HOME_FAQ.find((f) => f.q.ru === 'Есть автосписание?');
    expect(shown).toEqual(autoRenewalFaq(RENEWAL)[0]);
  });

  it('in manual mode answers «no»', () => {
    expect(autoRenewalFaq('manual')[0]?.a.ru).toMatch(/^Нет\./);
  });

  it('in auto mode says only the 30 days renew, and how to cancel', () => {
    const [item] = autoRenewalFaq('auto');
    expect(item?.q.ru).toBe('Есть автосписание?');
    expect(item?.a.ru).toMatch(/^Только у доступа на 30 дней/);
    expect(item?.a.ru).toContain(SUPPORT);
    expect(item?.a.ru).toContain('Год оплачивается один раз');
    expect(item?.a.en).toContain('until you cancel');
  });

  it('without a 30-day plan says «no» in either mode', () => {
    const plans = { club: true, thirtyDays: false };
    expect(autoRenewalFaq('auto', plans)).toEqual(autoRenewalFaq('manual', plans));
  });
});

describe('the legal texts', () => {
  it('are the texts the switch selects', () => {
    expect(termsDocument()).toEqual(termsDocument(RENEWAL));
    expect(refundDocument()).toEqual(refundDocument(RENEWAL));
  });

  it('in manual mode say nothing is charged automatically', () => {
    expect(sectionText(termsDocument('manual'), 'ru', 'price')).toContain(
      'Подписка не списывается автоматически',
    );
    expect(sectionText(refundDocument('manual'), 'ru', 'subscription')).toContain(
      'автосписания нет',
    );
  });

  it('in auto mode, the offer has the renewal clauses', () => {
    const terms = termsDocument('auto');
    for (const locale of ['ru', 'en'] as const) {
      const price = sectionText(terms, locale, 'price');
      expect(price).not.toMatch(/не списывается автоматически|is not charged automatically/);
      expect(price).toContain(SUPPORT);
      expect(price).toContain(String(PRICING.priceChangeNoticeDays));
    }
    const ru = sectionText(terms, 'ru', 'price');
    expect(ru).toContain('Автоматическое продление');
    expect(ru).toContain('пока Пользователь не отменит продление');
    expect(ru).toContain('доступ сохраняется до конца уже оплаченного периода');
    expect(ru).toContain('Подписка на год автоматически не продлевается');
    expect(sectionText(terms, 'ru', 'lifetime')).toContain('продлевается автоматически');
    expect(sectionText(terms, 'ru', 'refund')).toContain('возвращается только её первая оплата');
  });

  it('in auto mode, the refund policy refunds the first payment only', () => {
    const ru = sectionText(refundDocument('auto'), 'ru', 'subscription');
    const en = sectionText(refundDocument('auto'), 'en', 'subscription');
    expect(ru).toContain('первая оплата Подписки на 30 дней');
    expect(ru).toContain('Автоматические продления Подписки на 30 дней не возвращаются');
    expect(ru).not.toContain('автосписания нет');
    expect(en).toContain('Automatic renewals of a 30-day Subscription are not refunded');
  });

  it('change nothing else between the modes', () => {
    const ids = (doc: LegalDocument) => doc.sections.map((s) => s.id);
    expect(ids(termsDocument('auto'))).toEqual(ids(termsDocument('manual')));
    const differs = (a: LegalDocument, b: LegalDocument) =>
      a.sections
        .filter((s, i) => JSON.stringify(s) !== JSON.stringify(b.sections[i]))
        .map((s) => s.id);
    expect(differs(termsDocument('auto'), termsDocument('manual'))).toEqual([
      'lifetime',
      'price',
      'refund',
    ]);
    expect(differs(refundDocument('auto'), refundDocument('manual'))).toEqual(['subscription']);
  });
});
