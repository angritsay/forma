import { describe, expect, it } from 'vitest';
import { splitKeyWord } from './keyWord';

describe('splitKeyWord', () => {
  it('takes the last word and leaves its punctuation outside', () => {
    expect(splitKeyWord('Все курсы. Одна подписка.')).toEqual({
      head: 'Все курсы. Одна ',
      key: 'подписка',
      tail: '.',
    });
  });

  it('takes several words when asked', () => {
    expect(splitKeyWord('Кроссфит дома, который подстраивается под тебя', 2)).toEqual({
      head: 'Кроссфит дома, который подстраивается ',
      key: 'под тебя',
      tail: '',
    });
  });

  it('makes a one-word headline its own key word', () => {
    expect(splitKeyWord('Курсы')).toEqual({ head: '', key: 'Курсы', tail: '' });
    expect(splitKeyWord('Контакты', 3)).toEqual({ head: '', key: 'Контакты', tail: '' });
  });

  it('never returns an empty key for a word that is all punctuation', () => {
    expect(splitKeyWord('Что дальше —').key).toBe('—');
  });
});
