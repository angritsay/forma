import { describe, expect, it } from 'vitest';
import { cleanedUrl, parseEntryParams, rememberSource, SRC_KEY } from './params';

describe('parseEntryParams', () => {
  it('reads nothing from an empty query', () => {
    expect(parseEntryParams('')).toEqual({ lang: null, ref: null, startParam: null, src: null });
  });

  it('takes a published language and nothing else', () => {
    expect(parseEntryParams('?lang=en').lang).toBe('en');
    expect(parseEntryParams('?lang=ru').lang).toBe('ru');
    expect(parseEntryParams('?lang=de').lang).toBeNull();
    expect(parseEntryParams('?lang=EN').lang).toBeNull();
  });

  it('takes a referral code only in the shape the database issues', () => {
    expect(parseEntryParams('?ref=ab12cd34').ref).toBe('ab12cd34');
    expect(parseEntryParams('?ref=AB12CD34').ref).toBeNull();
    expect(parseEntryParams('?ref=short').ref).toBeNull();
    expect(parseEntryParams('?ref=ab12cd34x').ref).toBeNull();
    expect(parseEntryParams('?ref=').ref).toBeNull();
  });

  it('takes a launch parameter from either name', () => {
    expect(parseEntryParams('?startapp=ref_ab12cd34').startParam).toBe('ref_ab12cd34');
    expect(parseEntryParams('?tgWebAppStartParam=duo_x').startParam).toBe('duo_x');
    expect(parseEntryParams('?startapp=a&tgWebAppStartParam=b').startParam).toBe('a');
    expect(parseEntryParams('?startapp=bad%20value').startParam).toBeNull();
    expect(parseEntryParams(`?startapp=${'a'.repeat(65)}`).startParam).toBeNull();
  });

  it('takes a short lower-case source label', () => {
    expect(parseEntryParams('?src=hero').src).toBe('hero');
    expect(parseEntryParams('?src=vk_ads-2').src).toBe('vk_ads-2');
    expect(parseEntryParams('?src=Hero').src).toBeNull();
    expect(parseEntryParams(`?src=${'a'.repeat(41)}`).src).toBeNull();
    expect(parseEntryParams(`?src=${'a'.repeat(40)}`).src).toBe('a'.repeat(40));
    expect(parseEntryParams('?src=<script>').src).toBeNull();
  });

  it('reads them all together', () => {
    expect(parseEntryParams('?lang=en&ref=ab12cd34&src=hero')).toEqual({
      lang: 'en',
      ref: 'ab12cd34',
      startParam: null,
      src: 'hero',
    });
  });
});

describe('cleanedUrl', () => {
  it('drops our keys and keeps the path and the hash', () => {
    expect(cleanedUrl('/app/', '?lang=en&ref=ab12cd34', '#/start')).toBe('/app/#/start');
  });

  it("keeps a query that is somebody else's", () => {
    expect(cleanedUrl('/app/', '?lang=en&utm_source=x&tgWebAppStartParam=y', '#/book')).toBe(
      '/app/?utm_source=x&tgWebAppStartParam=y#/book',
    );
  });
});

describe('rememberSource', () => {
  it('keeps the first touch only', () => {
    const map = new Map<string, string>();
    const store = {
      getItem: (k: string) => map.get(k) ?? null,
      setItem: (k: string, v: string) => void map.set(k, v),
    };
    expect(rememberSource('hero', store)).toBe(true);
    expect(rememberSource('footer', store)).toBe(false);
    expect(map.get(SRC_KEY)).toBe('hero');
    expect(rememberSource('hero', null)).toBe(false);
  });
});
