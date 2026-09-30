/**
 * The legal texts say what the product does. Each check here is a sentence that once contradicted
 * it: prices only in roubles while English pays in dollars through lava.top, a Telegram id taken
 * only inside Telegram, coach bookings and messages to the coach missing from the data list, and
 * an acceptance clause that knew only the Course page.
 */
import { describe, expect, it } from 'vitest';
import { PRICING } from '@content/site/pricing';
import { privacyDocument, termsDocument, type LegalDocument } from './legal';

function text(doc: LegalDocument, locale: 'ru' | 'en', id: string): string {
  const section = doc.sections.find((s) => s.id === id);
  if (!section) throw new Error(`no section ${id}`);
  return [...(section.paragraphs ?? []), ...(section.bullets ?? []), ...(section.after ?? [])]
    .map((p) => p[locale])
    .join('\n');
}

const terms = termsDocument();
const privacy = privacyDocument();

describe('terms', () => {
  it('names the currency of the page and both payment services, in both languages', () => {
    const en = text(terms, 'en', 'price');
    const ru = text(terms, 'ru', 'price');
    expect(en).not.toMatch(/Russian roubles/);
    expect(en).toContain('₽ in Russian, $ in English');
    for (const t of [en, ru]) {
      expect(t).toContain('Prodamus');
      expect(t).toContain('lava.top');
    }
  });

  it('calls the subscription the club and accepts on any payment', () => {
    expect(text(terms, 'ru', 'definitions')).toContain('Подписка (клуб)');
    expect(text(terms, 'en', 'definitions')).toContain('Subscription (the club)');
    const ru = text(terms, 'ru', 'subject');
    const en = text(terms, 'en', 'subject');
    expect(ru).toContain('в момент любой оплаты');
    expect(ru).toContain('занятия с тренером');
    expect(en).toContain('at the moment of any payment');
    expect(en).toContain('coaching session');
  });

  it('describes the club week that comes with a course', () => {
    expect(text(terms, 'ru', 'subject')).toContain('неделя клуба в подарок');
    expect(text(terms, 'en', 'subject')).toContain('a week of the club as a gift');
  });
});

describe('privacy policy', () => {
  it('takes the Telegram id in the app or when linking from the website', () => {
    const ru = text(privacy, 'ru', 'data');
    const en = text(privacy, 'en', 'data');
    expect(ru).toContain('привязываешь телеграм к аккаунту с сайта');
    expect(en).toContain('link Telegram to your account from the website');
  });

  it('lists coach bookings and messages to the coach, and the messages they are used for', () => {
    expect(text(privacy, 'ru', 'data')).toContain('Записи к тренеру');
    expect(text(privacy, 'ru', 'data')).toContain('«Написать тренеру»');
    expect(text(privacy, 'en', 'data')).toContain('Coaching bookings');
    expect(text(privacy, 'en', 'data')).toContain('Message the coach');
    expect(text(privacy, 'ru', 'purposes')).toContain('сообщения клуба');
    expect(text(privacy, 'en', 'purposes')).toContain('reminders of coaching sessions');
  });

  it('has no empty sentence in either language', () => {
    for (const doc of [terms, privacy]) {
      for (const s of doc.sections) {
        for (const list of [s.paragraphs, s.bullets, s.after]) {
          for (const item of list ?? []) {
            expect(item.ru.length).toBeGreaterThan(0);
            expect(item.en.length).toBeGreaterThan(0);
          }
        }
      }
    }
  });
});

describe('legal version', () => {
  it('only moves forward: it is also the consent version', () => {
    // 2026-09-30 was the last published version; a merge once moved it back a day.
    expect(PRICING.legalUpdatedAt > '2026-09-30').toBe(true);
  });
});
