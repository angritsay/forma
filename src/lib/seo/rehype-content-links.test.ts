import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import rehypeContentLinks, {
  CONTENT_LINK_WARNINGS,
  localeFromPath,
  resetContentLinkCache,
  type HastNode,
} from './rehype-content-links';

let root = '';

beforeAll(() => {
  root = mkdtempSync(join(tmpdir(), 'forma-links-'));
  mkdirSync(join(root, 'content', 'exercises'), { recursive: true });
  mkdirSync(join(root, 'content', 'courses'), { recursive: true });
  mkdirSync(join(root, 'content', 'guides', 'ru'), { recursive: true });
  mkdirSync(join(root, 'content', 'guides', 'en'), { recursive: true });
  writeFileSync(
    join(root, 'content', 'exercises', 'a.ts'),
    /*
     * Two movements: one the coach has filmed and one he has not. `video` is what gives an exercise
     * a public page (`src/content/registry.ts`, FILMED_EXERCISES), so `jump_squat` here stands for
     * the two thirds of the library that is written but not shot.
     */
    `export const EXERCISES_A = [{ id: 'air_squat', slug: { ru: 'prisedaniya', en: 'air-squat' }, name: { ru: 'Приседания', en: 'Air squat' }, video: { ru: 'storage:videos/shared/air_squat.ru.mp4' } }, { id: 'jump_squat', slug: { ru: 'prisedaniya-s-vyprygivaniem', en: 'jump-squat' }, name: { ru: 'Прыжковые приседания', en: 'Jump squat' } }];`,
  );
  writeFileSync(
    join(root, 'content', 'courses', 'start.ts'),
    `export const START = { id: 'start', order: 1, slug: { ru: 'start', en: 'start' }, name: { ru: 'Старт', en: 'Start' }, workouts: [{ id: 'w1' }] };`,
  );
  writeFileSync(
    join(root, 'content', 'guides', 'ru', 'formaty.md'),
    `---\ntitle: Форматы\ntranslationKey: workout-formats\n---\nтекст`,
  );
  writeFileSync(
    join(root, 'content', 'guides', 'en', 'formats.md'),
    `---\ntitle: Formats\ntranslationKey: workout-formats\n---\ntext`,
  );
  resetContentLinkCache();
});

afterAll(() => {
  rmSync(root, { recursive: true, force: true });
});

function a(href: string, text: string): HastNode {
  return {
    type: 'element',
    tagName: 'a',
    properties: { href },
    children: [{ type: 'text', value: text }],
  };
}

function tree(...links: HastNode[]): HastNode {
  return {
    type: 'root',
    children: [{ type: 'element', tagName: 'p', properties: {}, children: links }],
  };
}

describe('rehypeContentLinks', () => {
  it('detects the locale from the markdown path', () => {
    expect(localeFromPath('/x/content/guides/en/a.md')).toBe('en');
    expect(localeFromPath('/x/content/guides/ru/a.md')).toBe('ru');
    expect(localeFromPath('C:\\x\\content\\guides\\en\\a.md')).toBe('en');
    expect(localeFromPath('')).toBe('ru');
  });

  it('rewrites content hrefs to localized, base-prefixed URLs', () => {
    const run = rehypeContentLinks({ root, base: '/forma/' });
    const t = tree(
      a('exercise:air_squat', 'squats'),
      a('course:start', 'course'),
      a('guide:workout-formats', 'guide'),
      a('https://x.y/', 'ext'),
    );
    run(t, { path: join(root, 'content', 'guides', 'en', 'formats.md') });
    const hrefs = (t.children![0]!.children ?? []).map((n) => n.properties?.href);
    expect(hrefs).toEqual([
      '/forma/en/exercises/air-squat/',
      '/forma/en/courses/start/',
      '/forma/en/guides/formats/',
      'https://x.y/',
    ]);

    const ru = tree(a('exercise:air_squat', 'присед'), a('guide:workout-formats', 'гайд'));
    run(ru, { history: [join(root, 'content', 'guides', 'ru', 'formaty.md')] });
    expect((ru.children![0]!.children ?? []).map((n) => n.properties?.href)).toEqual([
      '/forma/exercises/prisedaniya/',
      '/forma/guides/formaty/',
    ]);
  });

  it('unwraps unknown targets to text and records a warning', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const before = CONTENT_LINK_WARNINGS.length;
    const run = rehypeContentLinks({ root, base: '/' });
    const t = tree(a('exercise:ghost', 'ghost text'), a('exercise:air_squat', 'ok'));
    run(t, { path: join(root, 'content', 'guides', 'ru', 'formaty.md') });
    const children = t.children![0]!.children ?? [];
    expect(children).toHaveLength(2);
    expect(children[0]).toEqual({ type: 'text', value: 'ghost text' });
    expect(children[1]?.properties?.href).toBe('/exercises/prisedaniya/');
    expect(CONTENT_LINK_WARNINGS.length).toBe(before + 1);
    expect(CONTENT_LINK_WARNINGS.at(-1)).toMatchObject({
      href: 'exercise:ghost',
      reason: 'unknown exercise "ghost"',
    });
    expect(warn).toHaveBeenCalled();
    warn.mockRestore();
  });
});

/*
 * «С сайта и отовсюду убери упражнения у которых нет видео». An unfilmed movement has no page, so
 * a guide that names one must keep the sentence and lose the link — the same treatment a course
 * held back from sale already gets. The alternative is a link to a 404 in the middle of an article
 * Google is meant to rank.
 */
describe('unfilmed exercises', () => {
  const run = rehypeContentLinks({ root });
  const file = { path: join(root, 'content', 'guides', 'ru', 'formaty.md') };

  it('unwraps a link to a movement with no clip, keeping its words', () => {
    const t = tree(a('exercise:jump_squat', 'прыжковые приседания'));
    run(t, file);
    const kids = t.children![0]!.children ?? [];
    expect(kids.some((n) => n.tagName === 'a')).toBe(false);
    expect(kids.map((n) => n.value ?? '').join('')).toContain('прыжковые приседания');
  });

  it('still links a movement that has one', () => {
    const t = tree(a('exercise:air_squat', 'приседания'));
    run(t, file);
    expect(t.children![0]!.children![0]!.properties?.href).toBe('/exercises/prisedaniya/');
  });
});
