/**
 * schema.org JSON-LD builders. Each returns a plain node (no @context); JsonLd.astro wraps a
 * list of nodes in one @graph. Only real config/content values are emitted — placeholder
 * emails and empty fields are skipped.
 */
import type { Course, Exercise, Locale } from '@/content/schema';
import { l, t } from '@/i18n/index';
import { absoluteUrl } from '@/lib/util/paths';
import { BRAND } from '@content/site/brand';
import { COACH } from '@content/site/coach';
import { canonicalUrl, langTag } from './urls';

export type JsonLd = Record<string, unknown>;

export function organizationId(site: string): string {
  return `${absoluteUrl(site, '/')}#organization`;
}

function isPlaceholderEmail(email: string): boolean {
  return !email || /@example\.(com|org|net)$/i.test(email);
}

export function organizationJsonLd(site: string, locale: Locale): JsonLd {
  const sameAs = [BRAND.telegram, BRAND.instagram, BRAND.youtube].filter((x) => x.length > 0);
  return {
    '@type': 'Organization',
    '@id': organizationId(site),
    name: BRAND.organization,
    url: absoluteUrl(site, '/'),
    description: BRAND.tagline[locale],
    logo: { '@type': 'ImageObject', url: absoluteUrl(site, '/favicon.svg') },
    ...(isPlaceholderEmail(BRAND.contactEmail) ? {} : { email: BRAND.contactEmail }),
    ...(sameAs.length ? { sameAs } : {}),
  };
}

export function websiteJsonLd(site: string, locale: Locale): JsonLd {
  return {
    '@type': 'WebSite',
    '@id': `${absoluteUrl(site, '/')}#website`,
    name: BRAND.name,
    url: canonicalUrl(site, locale, '/'),
    inLanguage: langTag(locale),
    publisher: { '@id': organizationId(site) },
  };
}

/** The coach as a schema.org Person; only filled config fields are emitted. */
export function personJsonLd(site: string, locale: Locale): JsonLd {
  const links = COACH.links.map((x) => x.url).filter((x) => x.length > 0);
  return {
    '@type': 'Person',
    name: l(COACH.name, locale),
    jobTitle: l(COACH.role, locale),
    description: l(COACH.bio, locale),
    worksFor: { '@id': organizationId(site) },
    ...(COACH.photo ? { image: absoluteUrl(site, COACH.photo) } : {}),
    ...(links.length ? { sameAs: links } : {}),
  };
}

export function breadcrumbJsonLd(items: { name: string; url: string }[]): JsonLd {
  return {
    '@type': 'BreadcrumbList',
    itemListElement: items.map((it, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: it.name,
      item: it.url,
    })),
  };
}

export function faqJsonLd(items: { q: string; a: string }[]): JsonLd | null {
  if (items.length === 0) return null;
  return {
    '@type': 'FAQPage',
    mainEntity: items.map((it) => ({
      '@type': 'Question',
      name: it.q,
      acceptedAnswer: { '@type': 'Answer', text: it.a },
    })),
  };
}

export function itemListJsonLd(
  items: { name: string; url: string; description?: string }[],
  name?: string,
): JsonLd {
  return {
    '@type': 'ItemList',
    ...(name ? { name } : {}),
    numberOfItems: items.length,
    itemListElement: items.map((it, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: it.name,
      url: it.url,
      ...(it.description ? { description: it.description } : {}),
    })),
  };
}

export function collectionPageJsonLd(opts: {
  site: string;
  locale: Locale;
  name: string;
  description: string;
  url: string;
  items: { name: string; url: string; description?: string }[];
}): JsonLd {
  return {
    '@type': 'CollectionPage',
    name: opts.name,
    description: opts.description,
    url: opts.url,
    inLanguage: langTag(opts.locale),
    isPartOf: { '@id': `${absoluteUrl(opts.site, '/')}#website` },
    mainEntity: itemListJsonLd(opts.items, opts.name),
  };
}

/** HowTo for an exercise page: steps from `howTo`, tools from equipment. */
export function howToJsonLd(opts: {
  exercise: Exercise;
  locale: Locale;
  url: string;
  image: string;
  description: string;
}): JsonLd {
  const { exercise: ex, locale } = opts;
  const tools = ex.equipment
    .filter((eq) => eq !== 'none')
    .map((eq) => ({ '@type': 'HowToTool', name: t(locale, `common.equipment_${eq}` as const) }));
  return {
    '@type': 'HowTo',
    name: l(ex.name, locale),
    description: opts.description,
    inLanguage: langTag(locale),
    url: opts.url,
    image: opts.image,
    ...(tools.length ? { tool: tools } : {}),
    step: ex.howTo.map((s, i) => ({
      '@type': 'HowToStep',
      position: i + 1,
      text: l(s, locale),
    })),
  };
}

export type VideoEmbed =
  | { kind: 'youtube'; embedUrl: string }
  | { kind: 'vimeo'; embedUrl: string }
  | { kind: 'file'; contentUrl: string };

/** Classify a public video URL for rendering and for VideoObject. */
export function videoEmbed(url: string): VideoEmbed {
  const yt = url.match(
    /^https?:\/\/(?:www\.)?(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([\w-]{6,})/,
  );
  if (yt) return { kind: 'youtube', embedUrl: `https://www.youtube-nocookie.com/embed/${yt[1]}` };
  const vimeo = url.match(/^https?:\/\/(?:www\.)?vimeo\.com\/(\d+)/);
  if (vimeo) return { kind: 'vimeo', embedUrl: `https://player.vimeo.com/video/${vimeo[1]}` };
  return { kind: 'file', contentUrl: url };
}

/**
 * VideoObject for a public exercise video. `uploadDate` is required by Google's rich results
 * but is not part of the content schema; add it there before relying on video rich results.
 */
export function videoObjectJsonLd(opts: {
  name: string;
  description: string;
  url: string;
  thumbnailUrl: string;
  locale: Locale;
}): JsonLd {
  const embed = videoEmbed(opts.url);
  return {
    '@type': 'VideoObject',
    name: opts.name,
    description: opts.description,
    thumbnailUrl: opts.thumbnailUrl,
    inLanguage: langTag(opts.locale),
    ...(embed.kind === 'file' ? { contentUrl: embed.contentUrl } : { embedUrl: embed.embedUrl }),
  };
}

export function articleJsonLd(opts: {
  site: string;
  locale: Locale;
  headline: string;
  description: string;
  url: string;
  image: string;
  datePublished: string;
  dateModified: string;
  wordCount?: number;
  keywords?: string[];
}): JsonLd {
  return {
    '@type': 'Article',
    headline: opts.headline,
    description: opts.description,
    inLanguage: langTag(opts.locale),
    url: opts.url,
    mainEntityOfPage: { '@type': 'WebPage', '@id': opts.url },
    image: opts.image,
    datePublished: opts.datePublished,
    dateModified: opts.dateModified,
    author: {
      '@type': 'Person',
      name: l(COACH.name, opts.locale),
      jobTitle: l(COACH.role, opts.locale),
    },
    publisher: { '@id': organizationId(opts.site) },
    ...(opts.wordCount ? { wordCount: opts.wordCount } : {}),
    ...(opts.keywords?.length ? { keywords: opts.keywords.join(', ') } : {}),
  };
}

/** ISO-8601 duration for a whole course (weeks × sessions × minutes). */
export function courseWorkload(course: Course): string {
  const totalMin = course.weeks * course.sessionsPerWeek * course.avgSessionMin;
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  return `PT${h > 0 ? `${h}H` : ''}${m > 0 || h === 0 ? `${m}M` : ''}`;
}

/** schema.org Course for a course page (landing pages may pass it to SeoHead). */
export function courseJsonLd(opts: {
  course: Course;
  locale: Locale;
  site: string;
  url: string;
  image?: string;
}): JsonLd {
  const { course, locale } = opts;
  const price = locale === 'ru' ? course.price.rub : course.price.usd;
  const priceCurrency = locale === 'ru' ? 'RUB' : 'USD';
  return {
    '@type': 'Course',
    name: l(course.name, locale),
    description: l(course.description, locale),
    inLanguage: langTag(locale),
    url: opts.url,
    ...(opts.image ? { image: opts.image } : {}),
    provider: { '@id': organizationId(opts.site) },
    educationalLevel: t(locale, `common.level_${course.level}` as const),
    timeRequired: courseWorkload(course),
    hasCourseInstance: [
      {
        '@type': 'CourseInstance',
        courseMode: 'Online',
        courseWorkload: courseWorkload(course),
        courseSchedule: {
          '@type': 'Schedule',
          repeatFrequency: 'Weekly',
          repeatCount: course.weeks,
        },
      },
    ],
    offers: [
      {
        '@type': 'Offer',
        price,
        priceCurrency,
        category: price > 0 ? 'Paid' : 'Free',
        availability: 'https://schema.org/InStock',
        url: opts.url,
      },
    ],
  };
}
