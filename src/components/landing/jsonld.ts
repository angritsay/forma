/**
 * schema.org builders for landing pages. Each returns a plain object; JsonLd.astro merges them
 * into one @graph. Only real config values are emitted — empty fields are omitted.
 */
import { BRAND } from '@content/site/brand';
import { COACH } from '@content/site/coach';
import type { Course, FaqItem, Locale } from '@/content/schema';
import { l } from '@/i18n/index';
import { canonicalUrl } from '@/lib/seo/urls';
import { absoluteUrl } from '@/lib/util/paths';
import { priceForLocale } from '@content/site/pricing';

type Json = Record<string, unknown>;

function compact(obj: Json): Json {
  const out: Json = {};
  for (const [k, v] of Object.entries(obj)) {
    if (v === undefined || v === null || v === '') continue;
    if (Array.isArray(v) && v.length === 0) continue;
    out[k] = v;
  }
  return out;
}

export function organizationId(site: string): string {
  return `${absoluteUrl(site, '/')}#organization`;
}

export function organizationLd(site: string, locale: Locale): Json {
  return compact({
    '@type': 'Organization',
    '@id': organizationId(site),
    name: BRAND.organization,
    url: canonicalUrl(site, locale, '/'),
    logo: absoluteUrl(site, '/favicon.svg'),
    email: BRAND.contactEmail,
    sameAs: [BRAND.telegram, BRAND.instagram, BRAND.youtube].filter(Boolean),
  });
}

export function websiteLd(site: string, locale: Locale, description: string): Json {
  return {
    '@type': 'WebSite',
    '@id': `${absoluteUrl(site, '/')}#website`,
    url: canonicalUrl(site, locale, '/'),
    name: BRAND.name,
    description,
    inLanguage: locale,
    publisher: { '@id': organizationId(site) },
  };
}

export function faqLd(items: readonly FaqItem[], locale: Locale): Json {
  return {
    '@type': 'FAQPage',
    mainEntity: items.map((it) => ({
      '@type': 'Question',
      name: l(it.q, locale),
      acceptedAnswer: { '@type': 'Answer', text: l(it.a, locale) },
    })),
  };
}

export function itemListLd(items: readonly { name: string; url: string }[], name?: string): Json {
  return compact({
    '@type': 'ItemList',
    name,
    itemListElement: items.map((it, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: it.name,
      url: it.url,
    })),
  });
}

export function breadcrumbLd(items: readonly { name: string; url: string }[]): Json {
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

export function personLd(site: string, locale: Locale): Json {
  return compact({
    '@type': 'Person',
    '@id': `${absoluteUrl(site, '/')}#coach`,
    name: l(COACH.name, locale),
    jobTitle: l(COACH.role, locale),
    description: l(COACH.bio, locale),
    image: COACH.photo ? absoluteUrl(site, COACH.photo) : undefined,
    url: canonicalUrl(site, locale, '/about/'),
    sameAs: COACH.links.map((x) => x.url),
    worksFor: { '@id': organizationId(site) },
  });
}

export function courseLd(
  site: string,
  locale: Locale,
  course: Course,
  opts: { url: string; image: string },
): Json {
  const { amount, currency } = priceForLocale(course.price, locale);
  const workloadMin = course.weeks * course.sessionsPerWeek * course.avgSessionMin;
  return compact({
    '@type': 'Course',
    '@id': `${opts.url}#course`,
    name: l(course.name, locale),
    description: l(course.description, locale),
    url: opts.url,
    image: opts.image,
    inLanguage: locale,
    provider: { '@id': organizationId(site) },
    educationalLevel: l({ ru: `Уровень ${course.level}`, en: `Level ${course.level}` }, locale),
    teaches: course.outcomes.map((o) => l(o, locale)),
    timeRequired: `PT${workloadMin}M`,
    offers: {
      '@type': 'Offer',
      price: amount,
      priceCurrency: currency,
      category: amount === 0 ? 'Free' : 'Paid',
      availability: 'https://schema.org/InStock',
      url: `${opts.url}#order`,
    },
    hasCourseInstance: {
      '@type': 'CourseInstance',
      courseMode: 'Online',
      courseWorkload: `PT${workloadMin}M`,
      instructor: { '@id': `${absoluteUrl(site, '/')}#coach` },
    },
  });
}
