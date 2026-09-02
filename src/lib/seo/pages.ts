/**
 * Page registry (pure part): every public URL with its sitemap metadata and hreflang pairs.
 * `routes.ts` feeds it the guides collection; endpoints (sitemap, llms.txt) and the audit
 * consume the result. /app/ is never listed.
 */
import type { Locale } from '@/content/schema';
import { LOCALES } from '@/content/schema';
import { COURSES, EXERCISES } from '@/content/registry';
import { l, t } from '@/i18n/index';
import { localePath } from '@/lib/util/paths';
import { BRAND } from '@content/site/brand';
import { type GuideCluster } from './clusters';
import {
  clusterPath,
  clustersWithGuides,
  guideLocale,
  guideLocalizedPaths,
  guidePath,
  guidesForLocale,
  type GuideLike,
} from './guides';
import { exerciseDescription, exerciseTitle } from './meta';

export type Changefreq = 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never';
export type PageKind = 'home' | 'hub' | 'course' | 'exercise' | 'guide' | 'legal' | 'other';

export interface SeoPage {
  /** Locale-agnostic key, e.g. "/courses/start/" (RU slug) or "/about/". */
  sitePath: string;
  locale: Locale;
  /** Locale-prefixed site path without base, e.g. "/en/courses/start/". */
  path: string;
  title: string;
  description: string;
  changefreq: Changefreq;
  priority: number;
  /** YYYY-MM-DD. */
  lastmod?: string;
  /** Site paths (without base) of every locale version, including this one. */
  alternates: Partial<Record<Locale, string>>;
  kind: PageKind;
}

/** Date of the build, used as lastmod for pages generated from TypeScript content. */
export const BUILD_LASTMOD: string = new Date().toISOString().slice(0, 10);

interface StaticDef {
  sitePath: string;
  kind: PageKind;
  changefreq: Changefreq;
  priority: number;
  title: (locale: Locale) => string;
  description: (locale: Locale) => string;
}

const STATIC_PAGES: StaticDef[] = [
  {
    sitePath: '/',
    kind: 'home',
    changefreq: 'weekly',
    priority: 1,
    title: () => BRAND.name,
    description: (loc) => BRAND.tagline[loc],
  },
  {
    sitePath: '/courses/',
    kind: 'hub',
    changefreq: 'weekly',
    priority: 0.9,
    title: (loc) => t(loc, 'seo.coursesHubTitle'),
    description: (loc) => t(loc, 'seo.coursesHubDescription'),
  },
  {
    sitePath: '/exercises/',
    kind: 'hub',
    changefreq: 'weekly',
    priority: 0.8,
    title: (loc) => t(loc, 'seo.exercisesHubTitle'),
    description: (loc) => t(loc, 'seo.exercisesHubDescription'),
  },
  {
    sitePath: '/guides/',
    kind: 'hub',
    changefreq: 'weekly',
    priority: 0.8,
    title: (loc) => t(loc, 'seo.guidesHubTitle'),
    description: (loc) => t(loc, 'seo.guidesHubDescription'),
  },
  {
    sitePath: '/about/',
    kind: 'other',
    changefreq: 'monthly',
    priority: 0.5,
    title: (loc) => t(loc, 'seo.aboutPage'),
    description: (loc) => t(loc, 'seo.aboutPage'),
  },
  {
    sitePath: '/contact/',
    kind: 'other',
    changefreq: 'yearly',
    priority: 0.4,
    title: (loc) => t(loc, 'seo.contactPage'),
    description: (loc) => t(loc, 'seo.contactPage'),
  },
  {
    sitePath: '/privacy/',
    kind: 'legal',
    changefreq: 'yearly',
    priority: 0.3,
    title: (loc) => t(loc, 'seo.privacyPage'),
    description: (loc) => t(loc, 'seo.privacyPage'),
  },
  {
    sitePath: '/terms/',
    kind: 'legal',
    changefreq: 'yearly',
    priority: 0.3,
    title: (loc) => t(loc, 'seo.termsPage'),
    description: (loc) => t(loc, 'seo.termsPage'),
  },
  {
    sitePath: '/refund/',
    kind: 'legal',
    changefreq: 'yearly',
    priority: 0.3,
    title: (loc) => t(loc, 'seo.refundPage'),
    description: (loc) => t(loc, 'seo.refundPage'),
  },
];

function sameForAll(sitePath: string): Partial<Record<Locale, string>> {
  const out: Partial<Record<Locale, string>> = {};
  for (const loc of LOCALES) out[loc] = sitePath;
  return out;
}

/** Build the registry from the (already loaded) guides collection. */
export function buildPages(guides: readonly GuideLike[]): SeoPage[] {
  const pages: SeoPage[] = [];

  for (const def of STATIC_PAGES) {
    for (const locale of LOCALES) {
      pages.push({
        sitePath: def.sitePath,
        locale,
        path: localePath(locale, def.sitePath),
        title: def.title(locale),
        description: def.description(locale),
        changefreq: def.changefreq,
        priority: def.priority,
        lastmod: BUILD_LASTMOD,
        alternates: sameForAll(def.sitePath),
        kind: def.kind,
      });
    }
  }

  for (const course of COURSES) {
    const alternates: Partial<Record<Locale, string>> = {};
    for (const loc of LOCALES) alternates[loc] = `/courses/${course.slug[loc]}/`;
    for (const locale of LOCALES) {
      pages.push({
        sitePath: `/courses/${course.slug.ru}/`,
        locale,
        path: localePath(locale, alternates[locale] ?? '/courses/'),
        title: l(course.name, locale),
        description: l(course.tagline, locale),
        changefreq: 'monthly',
        priority: 0.9,
        lastmod: BUILD_LASTMOD,
        alternates,
        kind: 'course',
      });
    }
  }

  for (const ex of EXERCISES) {
    const alternates: Partial<Record<Locale, string>> = {};
    for (const loc of LOCALES) alternates[loc] = `/exercises/${ex.slug[loc]}/`;
    for (const locale of LOCALES) {
      pages.push({
        sitePath: `/exercises/${ex.slug.ru}/`,
        locale,
        path: localePath(locale, alternates[locale] ?? '/exercises/'),
        title: exerciseTitle(ex, locale),
        description: exerciseDescription(ex, locale),
        changefreq: 'monthly',
        priority: 0.6,
        lastmod: BUILD_LASTMOD,
        alternates,
        kind: 'exercise',
      });
    }
  }

  for (const locale of LOCALES) {
    for (const cluster of clustersWithGuides(guides, locale)) {
      const sitePath = clusterPath(cluster);
      const alternates: Partial<Record<Locale, string>> = {};
      for (const loc of LOCALES) {
        if (clustersWithGuides(guides, loc).includes(cluster)) alternates[loc] = sitePath;
      }
      pages.push({
        sitePath,
        locale,
        path: localePath(locale, sitePath),
        title: t(locale, `seo.cluster_${cluster}_title` as const),
        description: t(locale, `seo.cluster_${cluster}_description` as const),
        changefreq: 'weekly',
        priority: 0.6,
        lastmod: latestUpdate(guidesForLocale(guides, locale), cluster),
        alternates,
        kind: 'hub',
      });
    }
  }

  for (const locale of LOCALES) {
    for (const g of guidesForLocale(guides, locale)) {
      const alternates = guideLocalizedPaths(g, guides);
      pages.push({
        sitePath: alternates.ru ?? guidePath(g),
        locale: guideLocale(g),
        path: localePath(locale, guidePath(g)),
        title: g.data.title,
        description: g.data.description,
        changefreq: 'monthly',
        priority: g.data.priority,
        lastmod: g.data.updatedAt,
        alternates,
        kind: 'guide',
      });
    }
  }

  return pages;
}

function latestUpdate(list: readonly GuideLike[], cluster: GuideCluster): string {
  const dates = list.filter((g) => g.data.cluster === cluster).map((g) => g.data.updatedAt);
  return dates.sort().at(-1) ?? BUILD_LASTMOD;
}
