import { describe, expect, it } from 'vitest';
import { telegramShareUrl, waUrl } from './targets';

describe('telegramShareUrl', () => {
  it('encodes the link and the text so neither cuts the other short', () => {
    const url = telegramShareUrl('https://forma.app/app/#/shared/abc', 'Ноги & спина #1');
    expect(url.startsWith('https://t.me/share/url?url=')).toBe(true);
    const params = new URL(url).searchParams;
    expect(params.get('url')).toBe('https://forma.app/app/#/shared/abc');
    expect(params.get('text')).toBe('Ноги & спина #1');
  });
});

describe('waUrl', () => {
  it('puts the whole message, link included, into one encoded text', () => {
    const url = waUrl('Давай вместе? https://x.co/together/?d=2026-10-05&from=Аня');
    expect(url.startsWith('https://wa.me/?text=')).toBe(true);
    expect(new URL(url).searchParams.get('text')).toBe(
      'Давай вместе? https://x.co/together/?d=2026-10-05&from=Аня',
    );
  });
});
