import { describe, expect, it } from 'vitest';
import { composeInvite, signature } from './compose';
import { inviteCopy } from './inviteCopy';

/** Tuesday 29 September 2026, noon in Moscow. */
const TUESDAY = new Date('2026-09-29T09:00:00Z');
const ORIGIN = 'https://forma.fit';
const nobody = { code: null, name: null };

describe('composeInvite', () => {
  it('before the browser runs: no day in the link, «ближайший понедельник» in the words', () => {
    const m = composeInvite({
      locale: 'ru',
      copy: inviteCopy('ru'),
      origin: ORIGIN,
      now: null,
      mine: nobody,
    });
    expect(m.date).toBeNull();
    expect(m.url).toBe('https://forma.fit/together/');
    expect(m.label).toBe('в ближайший понедельник');
    expect(m.text).toContain('Давай с ближайшего понедельника тренироваться вместе?');
    expect(m.text.endsWith('Первая — бесплатно: https://forma.fit/together/')).toBe(true);
    expect(m.withRef).toBe(false);
  });

  it('a plain link: the Monday, the name if any, no ref and no promise of days', () => {
    const m = composeInvite({
      locale: 'ru',
      copy: inviteCopy('ru'),
      origin: ORIGIN,
      now: TUESDAY,
      mine: nobody,
      typedName: '  Маша ',
    });
    expect(m.date).toBe('2026-10-05');
    expect(m.label).toBe('понедельник, 5 октября');
    expect(m.url).toBe(
      `https://forma.fit/together/?d=2026-10-05&from=${encodeURIComponent('Маша')}`,
    );
    expect(m.text).toContain('Давай с понедельника, 5 октября тренироваться вместе?');
    expect(m.text).not.toContain('+30');
  });

  it('a personal link carries ref and from, and adds the +30 line on its own line', () => {
    const m = composeInvite({
      locale: 'en',
      copy: inviteCopy('en'),
      origin: ORIGIN,
      now: TUESDAY,
      mine: { code: 'abcd1234', name: 'Anna' },
    });
    expect(m.url).toBe('https://forma.fit/en/together/?d=2026-10-05&ref=abcd1234&from=Anna');
    expect(m.withRef).toBe(true);
    expect(m.text.split('\n')).toHaveLength(2);
    expect(m.text.split('\n')[1]).toBe(inviteCopy('en').refLine);
  });

  it('gives Telegram the message without the link, which its picker attaches itself', () => {
    const m = composeInvite({
      locale: 'ru',
      copy: inviteCopy('ru'),
      origin: ORIGIN,
      now: TUESDAY,
      mine: { code: 'abcd1234', name: null },
    });
    expect(m.bare).not.toContain('https://');
    expect(m.bare.split('\n')[0]!.endsWith('Первая — бесплатно')).toBe(true);
    expect(m.bare.split('\n')[1]).toBe(inviteCopy('ru').refLine);
  });

  it('never signs with markup, digits or a link', () => {
    for (const typedName of ['<b>x</b>', 'Маша1', 'https://x.y', 'a'.repeat(17)]) {
      const m = composeInvite({
        locale: 'ru',
        copy: inviteCopy('ru'),
        origin: ORIGIN,
        now: TUESDAY,
        mine: nobody,
        typedName,
      });
      expect(m.from).toBeNull();
      expect(m.url).not.toContain('from=');
    }
  });
});

describe('signature', () => {
  it('prefers a valid typed name, then the cached one', () => {
    expect(signature('Оля', 'Маша')).toBe('Оля');
    expect(signature('', 'Маша')).toBe('Маша');
    expect(signature('<script>', 'Маша')).toBe('Маша');
    expect(signature(null, null)).toBeNull();
  });
});
