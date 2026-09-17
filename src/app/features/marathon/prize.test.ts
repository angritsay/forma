import { describe, expect, it } from 'vitest';
import { t } from '@/i18n/index';
import type { Translator } from '@/app/hooks/useT';
import { publishableClubResults } from '@content/site/club';
import { clubPrize } from './prize';

const tr: Translator = {
  locale: 'ru',
  t: (key, params) => t('ru', key, params),
  l: (value) => value?.ru ?? '',
};

describe('clubPrize', () => {
  it('falls back to the standing prize when the round names none', () => {
    expect(clubPrize(tr, null)).toBe('Час с тренером и создателем Forma');
    expect(clubPrize(tr, '')).toBe('Час с тренером и создателем Forma');
    // Whitespace is "none" too: an admin field cleared by hand often leaves a space behind.
    expect(clubPrize(tr, '   ')).toBe('Час с тренером и создателем Forma');
  });

  it('lets a round name its own prize', () => {
    expect(clubPrize(tr, 'Гиря 16 кг')).toBe('Гиря 16 кг');
  });
});

describe('publishableClubResults', () => {
  /*
   * The selling screen's «Результаты участников» must be real or absent. Today it is absent —
   * `CLUB_RESULTS` is empty and says at length why — and this is the guard for the day it is not:
   * nothing reaches a public, paid-for screen without a recorded consent date and a quote in the
   * person's own words.
   */
  it('publishes only entries with consent and something to say', () => {
    for (const r of publishableClubResults()) {
      expect(r.consent, `club result ${r.id} has no consent date`).toBeTruthy();
      expect(r.quote.ru.trim().length, `club result ${r.id} has no quote`).toBeGreaterThan(0);
      expect(r.name.ru.trim().length, `club result ${r.id} has no name`).toBeGreaterThan(0);
    }
  });
});
