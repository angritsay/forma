/**
 * Чтение и запись одной половины L10n. Всё, что здесь проверяется, — это то, чем обычно ломают
 * двуязычное поле: затирают соседнюю половину и кладут пустую строку вместо «не написано».
 */
import { describe, expect, it } from 'vitest';
import { otherHalf, pick, put } from './adminLocale';

describe('pick', () => {
  it('reads the half being edited', () => {
    expect(pick({ ru: 'Разминка', en: 'Warm-up' }, 'ru')).toBe('Разминка');
    expect(pick({ ru: 'Разминка', en: 'Warm-up' }, 'en')).toBe('Warm-up');
  });

  it('gives an empty field for a half nobody wrote', () => {
    expect(pick({ ru: 'Разминка' }, 'en')).toBe('');
    expect(pick(undefined, 'ru')).toBe('');
    expect(pick({}, 'en')).toBe('');
  });
});

describe('put', () => {
  it('leaves the other half alone', () => {
    expect(put({ ru: 'Разминка', en: 'Warm-up' }, 'en', 'Warm up')).toEqual({
      ru: 'Разминка',
      en: 'Warm up',
    });
    expect(put({ ru: 'Разминка' }, 'en', 'Warm-up')).toEqual({ ru: 'Разминка', en: 'Warm-up' });
  });

  /*
   * Самое важное здесь. Пустая строка — это «не написано», а не «написано ничего»: `l10n()` в
   * src/lib/courses/draft.ts подставляет русское вместо отсутствующего английского, но `''` он
   * подставлять не станет — это написанный текст. Английский читатель получил бы пустое название
   * там, где мог бы увидеть русское.
   */
  it('erases a half rather than storing an empty string', () => {
    expect(put({ ru: 'Разминка', en: 'Warm-up' }, 'en', '')).toEqual({ ru: 'Разминка' });
    expect(put({ ru: 'Разминка', en: 'Warm-up' }, 'en', '   ')).toEqual({ ru: 'Разминка' });
    expect(put({ ru: 'Разминка' }, 'en', '')).toEqual({ ru: 'Разминка' });
  });

  it('keeps the spacing the coach typed inside the text', () => {
    // Стирает только полностью пустое; «Два круга » с хвостовым пробелом — это текст.
    expect(put({}, 'ru', 'Два круга ')).toEqual({ ru: 'Два круга ' });
  });

  it('starts a value that did not exist', () => {
    expect(put(undefined, 'ru', 'Заминка')).toEqual({ ru: 'Заминка' });
  });

  it('does not mutate what it was given', () => {
    const before = { ru: 'Разминка', en: 'Warm-up' };
    put(before, 'en', 'Something else');
    expect(before).toEqual({ ru: 'Разминка', en: 'Warm-up' });
  });
});

describe('otherHalf', () => {
  /* Это весь интерфейс перевода: переключил на английский — в подсказке стоит русский оригинал. */
  it('gives the text to translate from', () => {
    expect(otherHalf({ ru: 'Разминка', en: 'Warm-up' }, 'en')).toBe('Разминка');
    expect(otherHalf({ ru: 'Разминка', en: 'Warm-up' }, 'ru')).toBe('Warm-up');
  });

  it('gives nothing when the other half is empty too', () => {
    expect(otherHalf({ ru: 'Разминка' }, 'ru')).toBe('');
    expect(otherHalf(undefined, 'en')).toBe('');
  });
});
