import { describe, expect, it } from 'vitest';
import { PLANS_ENABLED } from '@content/site/plans';
import { SITE_COURSES } from '@/content/published';
import type { SiteCreator } from '@/content/creators';
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

  /*
   * Forma publishes both languages (LOCALES in src/content/schema.ts): Russian keeps the bare
   * paths, English lives under /en/. A *static* page exists in both without exception — its text
   * comes from the dictionaries, and those are complete by construction (src/i18n/index.ts types
   * the RU dictionary against the EN one, so a missing key fails `astro check`, not the build).
   */
  it('lists every static page in both languages and never /app/', () => {
    const home = pages.filter((p) => p.sitePath === '/');
    expect(home.map((p) => p.path).sort()).toEqual(['/', '/en/']);
    // `alternates` holds *site* paths; the /en/ prefix is added by localePath when the URL is built.
    expect(home[0]?.alternates).toEqual({ ru: '/', en: '/' });
    for (const sp of [
      '/courses/',
      '/exercises/',
      '/guides/',
      '/about/',
      '/contact/',
      '/privacy/',
      '/terms/',
      '/refund/',
      '/together/',
    ]) {
      expect(
        pages
          .filter((p) => p.sitePath === sp)
          .map((p) => p.locale)
          .sort(),
      ).toEqual(['en', 'ru']);
    }
    /*
     * /subscribe/ comes and goes with the subscription. The sitemap and `subscribe.astro` read the
     * same flag, so this asserts the pair agrees: listed once per language when the subscription
     * is on sale, absent when it is not. A URL in the sitemap with no page behind it is a 404
     * served to a crawler, which is the failure this guards.
     */
    expect(pages.filter((p) => p.sitePath === '/subscribe/')).toHaveLength(PLANS_ENABLED ? 2 : 0);
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

  it('publishes both halves of a translated pair, pointing at each other', () => {
    const ru = pages.find((p) => p.path === '/guides/a-ru/');
    expect(ru?.kind).toBe('guide');
    expect(ru?.lastmod).toBe('2026-09-05');
    expect(ru?.priority).toBe(0.8);
    const en = pages.find((p) => p.path === '/en/guides/a-en/');
    expect(en?.kind).toBe('guide');
    const pair = { ru: '/guides/a-ru/', en: '/guides/a-en/' };
    expect(ru?.alternates).toEqual(pair);
    expect(en?.alternates).toEqual(pair);
  });

  /*
   * Guides are the one surface where a language can be genuinely missing: an article is written,
   * not generated from a dictionary. An untranslated one must claim no English URL and no English
   * hreflang — a hreflang pointing at a page that does not exist is worse than none at all.
   */
  it('gives an untranslated guide no English URL and no English hreflang', () => {
    const only = pages.find((p) => p.path === '/guides/only-ru/');
    expect(only?.alternates).toEqual({ ru: '/guides/only-ru/' });
    expect(pages.some((p) => p.path.startsWith('/en/guides/only-'))).toBe(false);
  });

  it('builds cluster hubs only for clusters that have guides in that language', () => {
    const hubs = pages.filter(
      (p) => p.kind === 'hub' && p.sitePath.startsWith('/guides/') && p.sitePath !== '/guides/',
    );
    // «formats» holds only the untranslated guide, so it has no English hub — and therefore no
    // English alternate either.
    expect(hubs.map((p) => p.path).sort()).toEqual([
      '/en/guides/beginners/',
      '/guides/beginners/',
      '/guides/formats/',
    ]);
    const formats = hubs.find((p) => p.path === '/guides/formats/');
    expect(formats?.alternates).toEqual({ ru: '/guides/formats/' });
    expect(formats?.lastmod).toBe('2026-09-05');
    const beginners = hubs.find((p) => p.path === '/guides/beginners/');
    expect(beginners?.alternates).toEqual({ ru: '/guides/beginners/', en: '/guides/beginners/' });
  });

  /*
   * Creator pages (0066) enter the sitemap only through `SITE_CREATORS`, which holds creators with
   * at least one course that has a page. With none — the build with no backend — there are none.
   */
  it('lists a creator page in both languages, and none without creators', () => {
    expect(pages.some((p) => p.kind === 'creator')).toBe(false);
    const course = SITE_COURSES[0]!;
    const alla: SiteCreator = {
      slug: 'alla-yoga',
      name: 'Alla',
      about: 'Yoga for people who sit all day.',
      audienceUrl: 'https://t.me/alla',
      courses: [course],
    };
    const withCreator = buildPages(guides, [alla]);
    const mine = withCreator.filter((p) => p.kind === 'creator');
    expect(mine.map((p) => p.path).sort()).toEqual(['/c/alla-yoga/', '/en/c/alla-yoga/']);
    for (const p of mine) {
      expect(p.alternates).toEqual({ ru: '/c/alla-yoga/', en: '/c/alla-yoga/' });
      expect(p.title.startsWith('Alla')).toBe(true);
      expect(p.description.length).toBeLessThanOrEqual(160);
      expect(p.description).toContain('Yoga for people who sit all day.');
    }
  });
});
