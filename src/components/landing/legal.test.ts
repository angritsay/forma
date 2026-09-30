/**
 * The legal texts say what the product does. Each check here is a sentence that once contradicted
 * it: prices only in roubles while English pays in dollars through lava.top, coach bookings and
 * messages to the coach missing from the data list (and then said to be kept without their text),
 * a subscription that did not mention the club, and an acceptance clause that knew only the Course
 * page.
 */
import { describe, expect, it } from 'vitest';
import { PRICING } from '@content/site/pricing';
import { GAME_TRIAL_DAYS } from '@/app/features/marathon/gameAccess';
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
    expect(ru).toContain('в рублях (₽) на русской версии, в долларах США ($) на английской');
    for (const t of [en, ru]) {
      expect(t).toContain('Prodamus');
      expect(t).toContain('lava.top');
    }
  });

  it('calls the subscription the club and accepts on any payment', () => {
    expect(text(terms, 'ru', 'definitions')).toContain('Подписка (клуб)');
    expect(text(terms, 'en', 'definitions')).toContain('Subscription (the club)');
    expect(text(terms, 'ru', 'subject')).toContain('по Подписке, к клубу и ко всем Курсам');
    expect(text(terms, 'en', 'subject')).toContain(
      'under a Subscription, to the club and every Course',
    );
    expect(text(terms, 'ru', 'lifetime')).toContain('Подписка открывает клуб и все Курсы');
    expect(text(terms, 'en', 'lifetime')).toContain(
      'A Subscription opens the club and every Course',
    );
    const ru = text(terms, 'ru', 'subject');
    const en = text(terms, 'en', 'subject');
    expect(ru).toContain('в момент любой оплаты');
    expect(ru).toContain('занятия с тренером');
    expect(en).toContain('at the moment of any payment');
    expect(en).toContain('coaching session');
  });

  it('describes the club week that comes with a course', () => {
    expect(text(terms, 'ru', 'subject')).toContain(
      `неделя клуба в подарок: ${GAME_TRIAL_DAYS} дней`,
    );
    expect(text(terms, 'en', 'subject')).toContain(
      `a week of the club as a gift: ${GAME_TRIAL_DAYS} days`,
    );
    expect(GAME_TRIAL_DAYS).toBe(7);
  });
});

describe('privacy policy', () => {
  it('takes the Telegram id only where the product takes it: the app opened inside Telegram', () => {
    const ru = text(privacy, 'ru', 'data');
    const en = text(privacy, 'en', 'data');
    // The only link is `link-telegram` (signed initData); there is no linking from a browser.
    expect(ru).toContain('если ты открываешь приложение внутри телеграма');
    expect(ru).toContain('в том числе к тому, что ты завёл на сайте');
    expect(en).toContain('if you open the app inside Telegram');
    expect(en).toContain('including one you created on the website');
    expect(ru).not.toContain('с сайта. Он нужен');
    expect(en).not.toMatch(/link Telegram to your account from the website/);
  });

  it('says messages to the coach are kept with their text, as 0045 stores them', () => {
    const ru = text(privacy, 'ru', 'data');
    const en = text(privacy, 'en', 'data');
    expect(ru).not.toContain('храним только то, кто и когда');
    expect(en).not.toContain('keep only who wrote and when');
    expect(ru).toContain('текст (до 1000 символов)');
    expect(ru).toContain('имя и @username');
    expect(en).toContain('the text (up to 1,000 characters)');
    expect(en).toContain('name and @username');
  });

  it('lists coach bookings and messages to the coach, and the messages they are used for', () => {
    expect(text(privacy, 'ru', 'data')).toContain('Записи к тренеру');
    expect(text(privacy, 'ru', 'data')).toContain('«Написать тренеру»');
    expect(text(privacy, 'en', 'data')).toContain('Coaching bookings');
    expect(text(privacy, 'en', 'data')).toContain('Message the coach');
    expect(text(privacy, 'ru', 'purposes')).toContain('сообщения клуба');
    expect(text(privacy, 'en', 'purposes')).toContain(
      'reminders, moves and cancellations of coaching sessions',
    );
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
