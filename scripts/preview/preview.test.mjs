import { mkdirSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { SLUG_MAX, noindexDir, noindexHtml, previewSlug } from './preview.mjs';

describe('previewSlug', () => {
  it('takes the name after preview/', () => {
    expect(previewSlug('preview/workout-cards')).toBe('workout-cards');
    expect(previewSlug('refs/heads/preview/workout-cards')).toBe('workout-cards');
    expect(previewSlug('workout-cards')).toBe('workout-cards');
  });

  it('keeps only lowercase letters, digits and single dashes', () => {
    expect(previewSlug('preview/Workout Cards')).toBe('workout-cards');
    expect(previewSlug('preview/a/b_c.d')).toBe('a-b-c-d');
    expect(previewSlug('preview/--x--')).toBe('x');
    expect(previewSlug('preview/../../etc')).toBe('etc');
    expect(previewSlug('preview/тест-1')).toBe('1');
  });

  it('caps the length without leaving a trailing dash', () => {
    const slug = previewSlug(`preview/${'a'.repeat(39)}-bcd`);
    expect(slug).toBe('a'.repeat(39));
    expect(previewSlug(`preview/${'x'.repeat(80)}`)).toHaveLength(SLUG_MAX);
  });

  it('refuses a name with nothing usable in it', () => {
    expect(previewSlug('preview/')).toBeNull();
    expect(previewSlug('preview/..')).toBeNull();
    expect(previewSlug('preview/тест')).toBeNull();
    expect(previewSlug('')).toBeNull();
  });
});

describe('noindexHtml', () => {
  it('replaces an index robots meta', () => {
    const html =
      '<html><head><title>A</title><meta name="robots" content="index, follow, max-image-preview:large"></head></html>';
    const out = noindexHtml(html);
    expect(out).toContain('<meta name="robots" content="noindex, nofollow">');
    expect(out).not.toContain('index, follow');
    expect(out.match(/name="robots"/g)).toHaveLength(1);
  });

  it('adds one when the page has none', () => {
    const out = noindexHtml('<!doctype html><html lang="ru"><head data-x="1"><title>A</title>');
    expect(out).toBe(
      '<!doctype html><html lang="ru"><head data-x="1"><meta name="robots" content="noindex, nofollow"><title>A</title>',
    );
  });

  it('leaves a fragment without a head alone', () => {
    expect(noindexHtml('<p>hi</p>')).toBe('<p>hi</p>');
  });

  it('marks every page in a folder', () => {
    const dir = mkdtempSync(join(tmpdir(), 'preview-'));
    mkdirSync(join(dir, 'app'));
    writeFileSync(join(dir, 'index.html'), '<html><head></head></html>');
    writeFileSync(
      join(dir, 'app', 'index.html'),
      '<html><head><meta name="robots" content="noindex, nofollow"></head></html>',
    );
    writeFileSync(join(dir, 'robots.txt'), 'User-agent: *');
    expect(noindexDir(dir)).toBe(1);
    expect(readFileSync(join(dir, 'index.html'), 'utf8')).toContain('noindex, nofollow');
    expect(readFileSync(join(dir, 'robots.txt'), 'utf8')).toBe('User-agent: *');
  });
});
