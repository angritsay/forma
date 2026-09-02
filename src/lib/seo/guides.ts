/**
 * Guide (content collection) helpers: locale/slug from the entry id, cluster paths,
 * translation pairing for hreflang, grouping and related-article selection.
 * Functions accept a structural `GuideLike` so tests can pass fixtures without `astro:content`.
 */
import type { CollectionEntry } from 'astro:content';
import type { Locale } from '@/content/schema';
import { wordCount } from '../../../scripts/seo/lib.mjs';
import { GUIDE_CLUSTERS, isGuideCluster, type GuideCluster } from './clusters';
import { readingTimeMinutes } from './meta';

export type GuideEntry = CollectionEntry<'guides'>;
export type GuideData = GuideEntry['data'];

export interface GuideLike {
  id: string;
  body?: string;
  data: GuideData;
  filePath?: string;
}

/** Locale from the entry id ("en/slug") or file path; RU is the default locale. */
export function guideLocale(g: Pick<GuideLike, 'id' | 'filePath'>): Locale {
  if (/^en\//.test(g.id) || /[\\/]guides[\\/]en[\\/]/.test(g.filePath ?? '')) return 'en';
  return 'ru';
}

export function guideSlug(g: Pick<GuideLike, 'id'>): string {
  return g.id.replace(/^(ru|en)\//, '');
}

export function guidePath(g: Pick<GuideLike, 'id'>): string {
  return `/guides/${guideSlug(g)}/`;
}

export function clusterSlug(cluster: GuideCluster): string {
  return cluster.replace(/_/g, '-');
}

export function clusterFromSlug(slug: string): GuideCluster | undefined {
  const id = slug.replace(/-/g, '_');
  return isGuideCluster(id) ? id : undefined;
}

export function clusterPath(cluster: GuideCluster): string {
  return `/guides/${clusterSlug(cluster)}/`;
}

export function isPublished(g: GuideLike): boolean {
  return !g.data.draft;
}

/** Newest first (publishedAt desc), then title for a stable order. */
export function sortGuides<T extends GuideLike>(list: readonly T[]): T[] {
  return [...list].sort(
    (a, b) =>
      b.data.publishedAt.localeCompare(a.data.publishedAt) ||
      a.data.title.localeCompare(b.data.title),
  );
}

export function guidesForLocale<T extends GuideLike>(all: readonly T[], locale: Locale): T[] {
  return sortGuides(all.filter((g) => isPublished(g) && guideLocale(g) === locale));
}

/** translationKey → { ru?, en? } for published entries. */
export function guidePairs<T extends GuideLike>(
  all: readonly T[],
): Map<string, Partial<Record<Locale, T>>> {
  const map = new Map<string, Partial<Record<Locale, T>>>();
  for (const g of all) {
    if (!isPublished(g)) continue;
    const key = g.data.translationKey;
    const pair = map.get(key) ?? {};
    pair[guideLocale(g)] = g;
    map.set(key, pair);
  }
  return map;
}

/** hreflang paths for a guide: its translation pair when present, otherwise only itself. */
export function guideLocalizedPaths(
  g: GuideLike,
  all: readonly GuideLike[],
): Partial<Record<Locale, string>> {
  const out: Partial<Record<Locale, string>> = { [guideLocale(g)]: guidePath(g) };
  const pair = guidePairs(all).get(g.data.translationKey);
  if (pair) {
    for (const [loc, entry] of Object.entries(pair) as [Locale, GuideLike][]) {
      if (entry.id !== g.id) out[loc] = guidePath(entry);
    }
  }
  return out;
}

/** The same article in the other locale, when it exists. */
export function pairedGuide<T extends GuideLike>(g: T, all: readonly T[]): T | undefined {
  const other: Locale = guideLocale(g) === 'ru' ? 'en' : 'ru';
  return guidePairs(all).get(g.data.translationKey)?.[other];
}

export function guidesByCluster<T extends GuideLike>(
  list: readonly T[],
): { cluster: GuideCluster; items: T[] }[] {
  const out: { cluster: GuideCluster; items: T[] }[] = [];
  for (const cluster of GUIDE_CLUSTERS) {
    const items = sortGuides(list.filter((g) => g.data.cluster === cluster));
    if (items.length) out.push({ cluster, items });
  }
  return out;
}

/** Clusters that have at least one published guide in the locale (hub pages are built for these). */
export function clustersWithGuides(all: readonly GuideLike[], locale: Locale): GuideCluster[] {
  return guidesByCluster(guidesForLocale(all, locale)).map((x) => x.cluster);
}

/** Related guides: explicit `relatedGuides` keys first, then the same cluster, newest first. */
export function relatedGuidesFor<T extends GuideLike>(
  g: T,
  all: readonly T[],
  max = 3,
): T[] {
  const locale = guideLocale(g);
  const pool = guidesForLocale(all, locale).filter((x) => x.id !== g.id);
  const picked: T[] = [];
  for (const key of g.data.relatedGuides) {
    const hit = pool.find((x) => x.data.translationKey === key);
    if (hit && !picked.includes(hit)) picked.push(hit);
  }
  for (const x of pool) {
    if (picked.length >= max) break;
    if (x.data.cluster === g.data.cluster && !picked.includes(x)) picked.push(x);
  }
  return picked.slice(0, max);
}

export function guideWords(g: Pick<GuideLike, 'body'>): number {
  return wordCount(g.body ?? '');
}

export function guideReadingTime(g: GuideLike): number {
  return readingTimeMinutes(guideWords(g), guideLocale(g));
}
