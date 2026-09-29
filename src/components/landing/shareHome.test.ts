import { describe, expect, it } from 'vitest';
import { absoluteShareUrl } from './shareHome';

describe('absoluteShareUrl', () => {
  it('joins the origin, the built path and the anchor', () => {
    expect(absoluteShareUrl('https://forma.fit', '/', '#together')).toBe(
      'https://forma.fit/#together',
    );
    expect(absoluteShareUrl('https://x.github.io/', '/forma/en/', 'together')).toBe(
      'https://x.github.io/forma/en/#together',
    );
  });

  it('leaves the anchor off when there is none', () => {
    expect(absoluteShareUrl('https://forma.fit', 'en/')).toBe('https://forma.fit/en/');
  });
});
