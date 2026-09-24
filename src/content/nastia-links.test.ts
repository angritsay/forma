/**
 * The owner's card follows the app's language: each language has its own Instagram and both carry
 * her LinkedIn (content/site/nastia.ts). Sergey's Telegram is in his link list once it is set.
 */
import { describe, expect, it } from 'vitest';
import { NASTIA } from '@content/site/nastia';
import { COACH } from '@content/site/coach';

describe('the owner card links', () => {
  it('gives each language its own Instagram and the same LinkedIn', () => {
    const insta = (l: 'ru' | 'en') => NASTIA.links[l].filter((x) => x.kind === 'instagram');
    const linkedin = (l: 'ru' | 'en') => NASTIA.links[l].filter((x) => x.kind === 'linkedin');
    expect(insta('ru')).toHaveLength(1);
    expect(insta('en')).toHaveLength(1);
    expect(insta('ru')[0]?.url).not.toBe(insta('en')[0]?.url);
    expect(linkedin('ru')).toEqual(linkedin('en'));
    expect(linkedin('ru')).toHaveLength(1);
  });

  it('carries no tracking parameters in any address', () => {
    const urls = [...NASTIA.links.ru, ...NASTIA.links.en, ...COACH.links].map((x) => x.url);
    for (const url of urls) expect(url, url).not.toMatch(/[?&](utm_|stkn)/);
  });

  it('lists Sergey’s Telegram among his links', () => {
    expect(COACH.links.find((x) => x.kind === 'telegram')?.url).toBe('https://t.me/titovtrener');
  });
});
