/**
 * /rss.xml — guides feed (RU items first, then EN), newest first within each locale.
 */
import rss from '@astrojs/rss';
import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';
import { t } from '@/i18n/index';
import { guideLocale, guidePath, guidesForLocale } from '@/lib/seo/guides';
import { canonicalUrl, langTag, siteOrigin } from '@/lib/seo/urls';
import { absoluteUrl } from '@/lib/util/paths';

export const GET: APIRoute = async ({ site }) => {
  const origin = siteOrigin(site);
  const all = await getCollection('guides');
  const guides = [...guidesForLocale(all, 'ru'), ...guidesForLocale(all, 'en')];
  return rss({
    title: t('ru', 'seo.rssTitle'),
    description: t('ru', 'seo.rssDescription'),
    site: absoluteUrl(origin, '/'),
    customData: '<language>ru</language>',
    items: guides.map((g) => {
      const locale = guideLocale(g);
      return {
        title: g.data.title,
        description: g.data.description,
        link: canonicalUrl(origin, locale, guidePath(g)),
        pubDate: new Date(`${g.data.publishedAt}T00:00:00Z`),
        categories: [g.data.cluster],
        customData: `<language>${langTag(locale)}</language>`,
      };
    }),
  });
};
