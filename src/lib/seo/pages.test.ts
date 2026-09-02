import { describe, expect, it } from 'vitest';
import type { GuideData, GuideLike } from './guides';
import { buildPages } from './pages';

function guide(id: string, over: Partial<GuideData> = {}): GuideLike {
  const data: GuideData = {
    title: `Title ${id}`,
    description: 'd'.repeat(80),
    h1: `H1 ${id}`,
    targetKeyword: 'kw',
    secondaryKeywords: [],
    cluster: 'beginners',
    translationKey: id.replace(/^(ru|en)\//, ''),
    publishedAt: '2026-09-02',
    updatedAt: '2026-09-05',
    faq: [],
    relatedExercises: [],
    relatedCourses: [],
    relatedGuides: [],
    cta: {},
    priority: 0.8,
    draft: false,
    ...over,
  };
  return { id, data, body: '' };
}

const guides = [
  guide('ru/a-ru', { translationKey: 'a' }),
  guide('en/a-en', { translationKey: 'a' }),
  guide('ru/only-ru', { translationKey: 'only', cluster: 'formats' }),
];

describe('buildPages', () => {
  const pages = buildPages(guides);

  it('lists every static page in both locales with shared alternates and never /app/', () => {
    const home = pages.filter((p) => p.sitePath === '/');
    expect(home.map((p) => p.path).sort()).toEqual(['/', '/en/']);
    expect(home[0]?.alternates).toEqual({ ru: '/', en: '/' });
    for (const sp of ['/courses/', '/exercises/', '/guides/', '/about/', '/contact/', '/privacy/', '/terms/', '/refund/']) {
      expect(pages.filter((p) => p.sitePath === sp)).toHaveLength(2);
    }
    expect(pages.some((p) => p.path.includes('/app'))).toBe(false);
  });

  it('has unique paths, valid priorities and lastmod dates', () => {
    const paths = pages.map((p) => p.path);
    expect(new Set(paths).size).toBe(paths.length);
    for (const p of pages) {
      expect(p.priority).toBeGreaterThan(0);
      expect(p.priority).toBeLessThanOrEqual(1);
      expect(p.lastmod).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(p.path.startsWith(p.locale === 'en' ? '/en/' : '/')).toBe(true);
      expect(p.alternates[p.locale]).toBeDefined();
    }
  });

  it('pairs guides by translationKey and uses updatedAt as lastmod', () => {
    const ru = pages.find((p) => p.path === '/guides/a-ru/');
    const en = pages.find((p) => p.path === '/en/guides/a-en/');
    expect(ru?.kind).toBe('guide');
    expect(ru?.alternates).toEqual({ ru: '/guides/a-ru/', en: '/guides/a-en/' });
    expect(en?.alternates).toEqual({ ru: '/guides/a-ru/', en: '/guides/a-en/' });
    expect(ru?.lastmod).toBe('2026-09-05');
    expect(ru?.priority).toBe(0.8);
    const only = pages.find((p) => p.path === '/guides/only-ru/');
    expect(only?.alternates).toEqual({ ru: '/guides/only-ru/' });
  });

  it('builds cluster hubs only for clusters that have guides in the locale', () => {
    const hubs = pages.filter((p) => p.kind === 'hub' && p.sitePath.startsWith('/guides/') && p.sitePath !== '/guides/');
    expect(hubs.map((p) => p.path).sort()).toEqual(['/en/guides/beginners/', '/guides/beginners/', '/guides/formats/']);
    const formats = hubs.find((p) => p.path === '/guides/formats/');
    expect(formats?.alternates).toEqual({ ru: '/guides/formats/' });
    expect(formats?.lastmod).toBe('2026-09-05');
    const beginnersEn = hubs.find((p) => p.path === '/en/guides/beginners/');
    expect(beginnersEn?.alternates).toEqual({ ru: '/guides/beginners/', en: '/guides/beginners/' });
  });
});
