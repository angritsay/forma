import { describe, expect, it } from 'vitest';
import { splitKeyWord } from './keyWord';

describe('splitKeyWord', () => {
  it('takes the last word as the key word and keeps the space in the lead', () => {
    expect(splitKeyWord('Форма с нуля')).toEqual(['Форма с ', 'нуля']);
    expect(splitKeyWord('Форма с нуля').join('')).toBe('Форма с нуля');
  });

  it('keeps words joined by a no-break space together', () => {
    expect(splitKeyWord('Планка 60\u00a0сек')).toEqual(['Планка ', '60\u00a0сек']);
  });

  it('keeps trailing punctuation with the key word', () => {
    expect(splitKeyWord('Готово, молодец!')).toEqual(['Готово, ', 'молодец!']);
  });

  it('treats a single word as all key word, and ignores trailing space', () => {
    expect(splitKeyWord('Клуб')).toEqual(['', 'Клуб']);
    expect(splitKeyWord('Клуб  ')).toEqual(['', 'Клуб']);
    expect(splitKeyWord('')).toEqual(['', '']);
  });
});
