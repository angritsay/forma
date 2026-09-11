import { describe, expect, it } from 'vitest';
import { PLANS_ENABLED } from '@content/site/plans';
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

  // Forma publishes Russian only (LOCALES in src/content/schema.ts): one page per site path, no
  // /en/ anywhere. These assertions are what would have to change to publish a second language.
  it('lists every static page once, in Russian, and never /app/', () => {
    const home = pages.filter((p) => p.sitePath === '/');
    expect(home.map((p) => p.path)).toEqual(['/']);
    expect(home[0]?.alternates).toEqual({ ru: '/' });
    for (const sp of [
      '/courses/',
      '/exercises/',
      '/guides/',
      '/about/',
      '/contact/',
      '/privacy/',
      '/terms/',
      '/refund/',
    ]) {
      expect(pages.filter((p) => p.sitePath === sp)).toHaveLength(1);
    }
    /*
     * /subscribe/ comes and goes with the subscription. The sitemap and `subscribe.astro` read the
     * same flag, so this asserts the pair agrees: listed exactly once when the subscription is on
     * sale, absent when it is not. A URL in the sitemap with no page behind it is a 404 served to
     * a crawler, which is the failure this guards.
     */
    expect(pages.filter((p) => p.sitePath === '/subscribe/')).toHaveLength(PLANS_ENABLED ? 1 : 0);
    expect(pages.some((p) => p.path.startsWith('/en/'))).toBe(false);
    expect(pages.some((p) => p.locale !== 'ru')).toBe(false);
    expect(pages.some((p) => p.path.includes('/app'))).toBe(false);
  });

  it('has unique paths, valid priorities and lastmod dates', () => {
    const paths = pages.map((p) => p.path);
    expect(new Set(paths).size).toBe(paths.length);
    for (const p of pages) {
      expect(p.priority).toBeGreaterThan(0);
      expect(p.priority).toBeLessThanOrEqual(1);
      expect(p.lastmod).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(p.path.startsWith('/')).toBe(true);
      expect(p.alternates[p.locale]).toBeDefined();
    }
  });

  it('publishes the Russian guide of a translated pair and uses updatedAt as lastmod', () => {
    const ru = pages.find((p) => p.path === '/guides/a-ru/');
    expect(ru?.kind).toBe('guide');
    expect(ru?.lastmod).toBe('2026-09-05');
    expect(ru?.priority).toBe(0.8);
    // Its English translation exists in the collection and is simply not published.
    expect(pages.find((p) => p.path === '/en/guides/a-en/')).toBeUndefined();
    expect(ru?.alternates).toEqual({ ru: '/guides/a-ru/' });
    const only = pages.find((p) => p.path === '/guides/only-ru/');
    expect(only?.alternates).toEqual({ ru: '/guides/only-ru/' });
  });

  it('builds cluster hubs only for clusters that have guides', () => {
    const hubs = pages.filter(
      (p) => p.kind === 'hub' && p.sitePath.startsWith('/guides/') && p.sitePath !== '/guides/',
    );
    expect(hubs.map((p) => p.path).sort()).toEqual(['/guides/beginners/', '/guides/formats/']);
    const formats = hubs.find((p) => p.path === '/guides/formats/');
    expect(formats?.alternates).toEqual({ ru: '/guides/formats/' });
    expect(formats?.lastmod).toBe('2026-09-05');
  });
});
