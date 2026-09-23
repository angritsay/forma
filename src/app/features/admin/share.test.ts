import { describe, expect, it } from 'vitest';
import { telegramShareUrl } from './share';

describe('telegramShareUrl', () => {
  it('encodes the link and the text so neither cuts the other short', () => {
    const url = telegramShareUrl('https://forma.app/app/#/shared/abc', 'Ноги & спина #1');
    expect(url.startsWith('https://t.me/share/url?url=')).toBe(true);
    const params = new URL(url).searchParams;
    expect(params.get('url')).toBe('https://forma.app/app/#/shared/abc');
    expect(params.get('text')).toBe('Ноги & спина #1');
  });
});
