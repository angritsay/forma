import { describe, expect, it } from 'vitest';
import { t } from '@/i18n/index';
import { stripEmoji } from './stripEmoji';

describe('stripEmoji', () => {
  it('takes the emoji off the app’s club lines and keeps every word', () => {
    expect(stripEmoji('Сделано ☕')).toBe('Сделано');
    expect(stripEmoji('Принято: +8 баллов. Третий день подряд 🔥')).toBe(
      'Принято: +8 баллов. Третий день подряд',
    );
    expect(stripEmoji('Победа на этой неделе — твоя 🏆 Приз: час.')).toBe(
      'Победа на этой неделе — твоя Приз: час.',
    );
  });

  it('removes joined sequences, skin tones and the colour selector whole', () => {
    expect(stripEmoji('Готово 👩‍💻!')).toBe('Готово!');
    expect(stripEmoji('Молодец 👍🏽')).toBe('Молодец');
    expect(stripEmoji('Сердце ❤️ тут')).toBe('Сердце тут');
  });

  it('leaves text without emoji and the site’s glyphs untouched', () => {
    expect(stripEmoji('Отжимания с колен · 8 → дальше')).toBe('Отжимания с колен · 8 → дальше');
    expect(stripEmoji('+30 дней — 1 990 ₽')).toBe('+30 дней — 1 990 ₽');
  });

  it('leaves no pictograph in the lines ClubDay quotes, in either language', () => {
    for (const locale of ['ru', 'en'] as const) {
      for (const key of ['app.clubDemoDone', 'app.clubDemoAccepted'] as const) {
        const line = stripEmoji(t(locale, key, { n: 8 }));
        expect(line).not.toMatch(/\p{Extended_Pictographic}/u);
        expect(line.length).toBeGreaterThan(3);
      }
    }
  });
});
