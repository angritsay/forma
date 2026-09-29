import { describe, expect, it } from 'vitest';
import {
  cleanName,
  firstName,
  gcalUrl,
  icsBlob,
  icsText,
  isIsoDate,
  mondayLabel,
  moscowToday,
  nextMonday,
  shareText,
  togetherUrl,
  validDate,
  waUrl,
  whenPhrase,
} from './invite';
import { inviteCopy } from './inviteCopy';

/** Tuesday 29 September 2026, noon in Moscow. */
const TUESDAY = new Date('2026-09-29T09:00:00Z');
/** Sunday 4 October, 23:59 in Moscow — still Sunday there. */
const SUNDAY_LATE = new Date('2026-10-04T20:59:00Z');
/** Monday 5 October, 00:30 in Moscow — while it is still Sunday in UTC. */
const MONDAY_EARLY = new Date('2026-10-04T21:30:00Z');

describe('the day', () => {
  it('reads today in Moscow, not in UTC', () => {
    expect(moscowToday(MONDAY_EARLY)).toBe('2026-10-05');
    expect(moscowToday(SUNDAY_LATE)).toBe('2026-10-04');
  });

  it('is the coming Monday, or today on a Monday', () => {
    expect(nextMonday(TUESDAY)).toBe('2026-10-05');
    expect(nextMonday(SUNDAY_LATE)).toBe('2026-10-05');
    expect(nextMonday(MONDAY_EARLY)).toBe('2026-10-05');
    expect(nextMonday(new Date('2026-10-05T20:59:00Z'))).toBe('2026-10-05');
    expect(nextMonday(new Date('2026-10-05T21:00:00Z'))).toBe('2026-10-12');
  });

  it('checks a date is real', () => {
    expect(isIsoDate('2026-10-05')).toBe(true);
    expect(isIsoDate('2026-02-30')).toBe(false);
    expect(isIsoDate('2026-10-5')).toBe(false);
    expect(isIsoDate(null)).toBe(false);
  });

  it('keeps a ?d= only when it is a Monday from today to two weeks out', () => {
    expect(validDate('2026-10-05', TUESDAY)).toBe('2026-10-05');
    expect(validDate('2026-10-12', TUESDAY)).toBe('2026-10-12');
    expect(validDate('2026-10-19', TUESDAY)).toBe('2026-10-05'); // too far
    expect(validDate('2026-09-28', TUESDAY)).toBe('2026-10-05'); // past
    expect(validDate('2026-10-06', TUESDAY)).toBe('2026-10-05'); // a Tuesday
    expect(validDate('2026-02-30', TUESDAY)).toBe('2026-10-05');
    expect(validDate('<script>', TUESDAY)).toBe('2026-10-05');
    expect(validDate(undefined, TUESDAY)).toBe('2026-10-05');
    expect(validDate('2026-10-05', MONDAY_EARLY)).toBe('2026-10-05'); // today counts
  });
});

describe('the words for it', () => {
  it('names the start on the chip', () => {
    expect(mondayLabel('ru', '2026-10-05', TUESDAY)).toBe('понедельник, 5 октября');
    expect(mondayLabel('ru', '2026-10-05', SUNDAY_LATE)).toBe('завтра, 5 октября');
    expect(mondayLabel('ru', '2026-10-05', MONDAY_EARLY)).toBe('сегодня');
    expect(mondayLabel('en', '2026-10-05', TUESDAY)).toBe('Monday, 5 October');
    expect(mondayLabel('en', '2026-10-05', SUNDAY_LATE)).toBe('tomorrow, 5 October');
    expect(mondayLabel('en', '2026-10-05', MONDAY_EARLY)).toBe('today');
  });

  it('says it in the message in the right case', () => {
    const ru = inviteCopy('ru');
    expect(whenPhrase('ru', ru, '2026-10-05', TUESDAY)).toBe('с понедельника, 5 октября');
    expect(whenPhrase('ru', ru, '2026-10-05', SUNDAY_LATE)).toBe(
      'с завтрашнего понедельника, 5 октября',
    );
    expect(whenPhrase('ru', ru, '2026-10-05', MONDAY_EARLY)).toBe('с сегодняшнего понедельника');
    const en = inviteCopy('en');
    expect(whenPhrase('en', en, '2026-10-05', TUESDAY)).toBe('on Monday, 5 October');
    expect(whenPhrase('en', en, '2026-10-05', MONDAY_EARLY)).toBe('today');
  });
});

describe('cleanName', () => {
  it('keeps a name', () => {
    expect(cleanName('Аня')).toBe('Аня');
    expect(cleanName('  Анна-Мария  ')).toBe('Анна-Мария');
    expect(cleanName('Mary  Jane')).toBe('Mary Jane');
    expect(cleanName('Zoë')).toBe('Zoë');
  });

  it('drops anything that is not only a name', () => {
    for (const bad of [
      '',
      '   ',
      '-',
      'A'.repeat(17),
      'Аня1',
      '<b>Аня</b>',
      'Аня&from=x',
      'https://evil',
      'Аня 🙂',
      null,
      undefined,
    ]) {
      expect(cleanName(bad), String(bad)).toBeNull();
    }
  });

  it('takes the first word of a display name', () => {
    expect(firstName('Настя Иванова')).toBe('Настя');
    expect(firstName('  ')).toBeNull();
    expect(firstName(null)).toBeNull();
    expect(firstName('R2D2')).toBeNull();
  });
});

describe('togetherUrl', () => {
  it('builds the locale page with the day, the code and the name', () => {
    const url = new URL(
      togetherUrl('https://forma.app/', 'ru', { d: '2026-10-05', ref: 'abcd1234', from: 'Аня' }),
    );
    expect(url.pathname).toMatch(/\/together\/$/);
    expect(url.pathname).not.toMatch(/\/en\//);
    expect(url.searchParams.get('d')).toBe('2026-10-05');
    expect(url.searchParams.get('ref')).toBe('abcd1234');
    expect(url.searchParams.get('from')).toBe('Аня');
  });

  it('puts the English page under /en/', () => {
    expect(togetherUrl('https://forma.app', 'en')).toMatch(
      /^https:\/\/forma\.app\/.*en\/together\/$/,
    );
  });

  it('drops every parameter that is not in its shape', () => {
    const url = new URL(
      togetherUrl('https://forma.app', 'ru', {
        d: 'tomorrow',
        ref: 'ABCD1234',
        from: '<img src=x>',
      }),
    );
    expect([...url.searchParams.keys()]).toEqual([]);
  });
});

describe('the message', () => {
  const url = 'https://forma.app/together/?d=2026-10-05';

  it('is the owner’s text, with no reward on a plain link', () => {
    const ru = inviteCopy('ru');
    const when = whenPhrase('ru', ru, '2026-10-05', TUESDAY);
    expect(shareText(ru, { when, url, withRef: false })).toBe(
      'Давай с понедельника, 5 октября тренироваться вместе? Это Forma — кроссфит дома маленькими шагами от тренера Сергея Титова: короткие тренировки без прыжков, нагрузка подстраивается. Первая — бесплатно: ' +
        url,
    );
  });

  it('adds the +30 line only to a personal link', () => {
    const ru = inviteCopy('ru');
    const text = shareText(ru, { when: 'с понедельника, 5 октября', url, withRef: true });
    expect(text.endsWith('\nОплатишь клуб по этой ссылке — нам двоим по +30 дней.')).toBe(true);
    const en = inviteCopy('en');
    expect(shareText(en, { when: 'on Monday, 5 October', url, withRef: true })).toMatch(
      /^Shall we start training together on Monday, 5 October\? .* free: https:\S+\nPay for the club through this link and we both get \+30 days\.$/,
    );
  });

  it('goes to WhatsApp whole', () => {
    expect(new URL(waUrl('Давай? ' + url)).searchParams.get('text')).toBe('Давай? ' + url);
  });
});

describe('the calendar', () => {
  const event = {
    date: '2026-10-05',
    title: 'Forma — тренировка 1',
    details: 'Первая тренировка, вместе. Открыть: https://forma.app/app/?lang=ru#/start',
  };

  it('adds an all-day Google event on that Monday', () => {
    const url = gcalUrl(event);
    expect(url).toContain('action=TEMPLATE');
    expect(url).toContain('&dates=20261005/20261006&');
    const q = new URL(url).searchParams;
    expect(q.get('text')).toBe(event.title);
    expect(q.get('details')).toBe(event.details);
  });

  it('crosses a month boundary in the end date', () => {
    expect(gcalUrl({ ...event, date: '2026-11-30' })).toContain('dates=20261130/20261201');
  });

  const ics = icsText({ ...event, host: 'forma.app', now: new Date('2026-09-29T09:00:00Z') });

  it('writes an all-day .ics with no time and no timezone', () => {
    expect(ics).toContain('\r\nDTSTART;VALUE=DATE:20261005\r\n');
    expect(ics).toContain('\r\nDTEND;VALUE=DATE:20261006\r\n');
    expect(ics).toContain('\r\nDTSTAMP:20260929T090000Z\r\n');
    expect(ics).toContain('\r\nUID:together-20261005@forma.app\r\n');
    expect(ics).not.toMatch(/TZID|DTSTART:/);
    expect(ics.startsWith('BEGIN:VCALENDAR\r\n')).toBe(true);
    expect(ics.endsWith('END:VCALENDAR\r\n')).toBe(true);
  });

  it('escapes text and folds long lines at 75 octets without splitting a letter', () => {
    const enc = new TextEncoder();
    for (const line of ics.split('\r\n')) {
      expect(enc.encode(line).length).toBeLessThanOrEqual(75);
      expect(line).not.toContain('�');
    }
    const unfolded = ics.replace(/\r\n /g, '');
    expect(unfolded).toContain(
      'DESCRIPTION:Первая тренировка\\, вместе. Открыть: https://forma.app/app/?lang=ru#/start',
    );
  });

  it('makes a calendar file', () => {
    const blob = icsBlob({ ...event, host: 'forma.app' });
    expect(blob.type).toBe('text/calendar;charset=utf-8');
  });
});
