import { describe, expect, it } from 'vitest';
import {
  clusterFromSlug,
  clusterPath,
  clusterSlug,
  clustersWithGuides,
  guideLocale,
  guideLocalizedPaths,
  guidePairs,
  guidePath,
  guideReadingTime,
  guideSlug,
  guidesByCluster,
  guidesForLocale,
  pairedGuide,
  relatedGuidesFor,
  type GuideData,
  type GuideLike,
} from './guides';

function guide(id: string, over: Partial<GuideData> = {}, body = ''): GuideLike {
  const data: GuideData = {
    title: `Title ${id}`,
    description: 'd'.repeat(80),
    h1: `H1 ${id}`,
    targetKeyword: 'kw',
    secondaryKeywords: [],
    cluster: 'beginners',
    translationKey: id.replace(/^(ru|en)\//, ''),
    publishedAt: '2026-09-02',
    updatedAt: '2026-09-02',
    faq: [],
    relatedExercises: [],
    relatedCourses: [],
    relatedGuides: [],
    cta: {},
    priority: 0.7,
    draft: false,
    ...over,
  };
  return { id, data, body };
}

const ruA = guide('ru/a-ru', { translationKey: 'a', publishedAt: '2026-09-01' });
const enA = guide('en/a-en', { translationKey: 'a', publishedAt: '2026-09-01' });
const ruB = guide('ru/b-ru', { translationKey: 'b', cluster: 'formats', publishedAt: '2026-09-03' });
const ruC = guide('ru/c-ru', { translationKey: 'c', relatedGuides: ['b'], publishedAt: '2026-08-01' });
const draft = guide('en/draft', { translationKey: 'draft', draft: true });
const all = [ruA, enA, ruB, ruC, draft];

describe('ids and paths', () => {
  it('derives locale, slug and path from the entry id', () => {
    expect(guideLocale(ruA)).toBe('ru');
    expect(guideLocale(enA)).toBe('en');
    expect(guideLocale({ id: 'x', filePath: 'content/guides/en/x.md' })).toBe('en');
    expect(guideSlug(enA)).toBe('a-en');
    expect(guidePath(ruB)).toBe('/guides/b-ru/');
  });
  it('maps clusters to kebab-case hub slugs and back', () => {
    expect(clusterSlug('no_equipment')).toBe('no-equipment');
    expect(clusterPath('fat_loss')).toBe('/guides/fat-loss/');
    expect(clusterFromSlug('no-equipment')).toBe('no_equipment');
    expect(clusterFromSlug('nope')).toBeUndefined();
  });
});

describe('pairing and hreflang', () => {
  it('pairs by translationKey and yields localized paths', () => {
    const pairs = guidePairs(all);
    expect(pairs.get('a')).toEqual({ ru: ruA, en: enA });
    expect(pairs.has('draft')).toBe(false);
    expect(guideLocalizedPaths(ruA, all)).toEqual({ ru: '/guides/a-ru/', en: '/guides/a-en/' });
    expect(guideLocalizedPaths(ruB, all)).toEqual({ ru: '/guides/b-ru/' });
    expect(pairedGuide(enA, all)).toBe(ruA);
    expect(pairedGuide(ruB, all)).toBeUndefined();
  });
});

describe('lists', () => {
  it('filters by locale, excludes drafts and sorts newest first', () => {
    expect(guidesForLocale(all, 'ru').map((g) => g.id)).toEqual(['ru/b-ru', 'ru/a-ru', 'ru/c-ru']);
    expect(guidesForLocale(all, 'en').map((g) => g.id)).toEqual(['en/a-en']);
  });
  it('groups by cluster in GUIDE_CLUSTERS order, skipping empty clusters', () => {
    const groups = guidesByCluster(guidesForLocale(all, 'ru'));
    expect(groups.map((g) => g.cluster)).toEqual(['beginners', 'formats']);
    expect(groups[0]?.items.map((g) => g.id)).toEqual(['ru/a-ru', 'ru/c-ru']);
    expect(clustersWithGuides(all, 'en')).toEqual(['beginners']);
  });
  it('prefers explicit relatedGuides, then the same cluster', () => {
    expect(relatedGuidesFor(ruC, all).map((g) => g.id)).toEqual(['ru/b-ru', 'ru/a-ru']);
    expect(relatedGuidesFor(enA, all)).toEqual([]);
  });
  it('estimates reading time from the body', () => {
    const long = guide('ru/long', {}, 'слово '.repeat(800));
    expect(guideReadingTime(long)).toBe(5);
    expect(guideReadingTime(ruA)).toBe(1);
  });
});
