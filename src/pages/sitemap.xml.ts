/**
 * /sitemap.xml — every public page from the registry with hreflang alternates
 * (ru, en, x-default), lastmod, changefreq and priority. Absolute URLs include the base path.
 */
import type { APIRoute } from 'astro';
import { LOCALES } from '@/content/schema';
import { allPages } from '@/lib/seo/routes';
import { siteOrigin } from '@/lib/seo/urls';
import { absoluteUrl, localePath } from '@/lib/util/paths';

function esc(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

export const GET: APIRoute = async ({ site }) => {
  const origin = siteOrigin(site);
  const pages = await allPages();
  const entries = pages.map((p) => {
    const loc = absoluteUrl(origin, p.path);
    const alts: string[] = [];
    for (const locale of LOCALES) {
      const sp = p.alternates[locale];
      if (sp) {
        alts.push(
          `    <xhtml:link rel="alternate" hreflang="${locale}" href="${esc(absoluteUrl(origin, localePath(locale, sp)))}"/>`,
        );
      }
    }
    const xDefaultPath = p.alternates.ru ?? p.alternates.en;
    if (xDefaultPath) {
      const xLocale = p.alternates.ru ? 'ru' : 'en';
      alts.push(
        `    <xhtml:link rel="alternate" hreflang="x-default" href="${esc(absoluteUrl(origin, localePath(xLocale, xDefaultPath)))}"/>`,
      );
    }
    return [
      '  <url>',
      `    <loc>${esc(loc)}</loc>`,
      ...alts,
      ...(p.lastmod ? [`    <lastmod>${p.lastmod}</lastmod>`] : []),
      `    <changefreq>${p.changefreq}</changefreq>`,
      `    <priority>${p.priority.toFixed(1)}</priority>`,
      '  </url>',
    ].join('\n');
  });
  const xml = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">',
    ...entries,
    '</urlset>',
    '',
  ].join('\n');
  return new Response(xml, { headers: { 'Content-Type': 'application/xml; charset=utf-8' } });
};
