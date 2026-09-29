import { describe, expect, it } from 'vitest';
import { appHref, withBase } from './paths';

const APP = withBase('/app/');

describe('appHref', () => {
  it('keeps the output every older caller relies on', () => {
    expect(appHref()).toBe(APP);
    expect(appHref('#/book')).toBe(`${APP}#/book`);
    expect(appHref('#/ref/')).toBe(`${APP}#/ref/`);
  });

  it('accepts a route without its hash', () => {
    expect(appHref('/start')).toBe(`${APP}#/start`);
  });

  it('puts the visit facts in the query, before the hash', () => {
    expect(appHref('/start', { locale: 'en' })).toBe(`${APP}?lang=en#/start`);
    expect(appHref('#/book?len=hour', { locale: 'ru' })).toBe(`${APP}?lang=ru#/book?len=hour`);
    expect(appHref('/start', { locale: 'en', ref: 'ab12cd34' })).toBe(
      `${APP}?lang=en&ref=ab12cd34#/start`,
    );
  });

  it('adds nothing for empty options', () => {
    expect(appHref('/book', {})).toBe(`${APP}#/book`);
    expect(appHref('', { locale: 'ru' })).toBe(`${APP}?lang=ru`);
  });

  it('encodes what it is handed', () => {
    expect(appHref('/start', { ref: 'a&b=c' })).toBe(`${APP}?ref=a%26b%3Dc#/start`);
  });
});
