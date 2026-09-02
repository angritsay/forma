/**
 * /robots.txt — allow everything except the app shell; point crawlers at the sitemap.
 * `Host:` is Yandex's (legacy but harmless) preferred-mirror directive.
 * Note: on a GitHub Pages *project* site (base path ≠ "/") this file lives under the base path
 * and is not read by crawlers — robots.txt only works at the origin root (custom domain).
 */
import type { APIRoute } from 'astro';
import { siteOrigin } from '@/lib/seo/urls';
import { absoluteUrl, withBase } from '@/lib/util/paths';

export const GET: APIRoute = ({ site }) => {
  const origin = siteOrigin(site);
  const host = new URL(origin).host;
  const lines = [
    'User-agent: *',
    'Allow: /',
    `Disallow: ${withBase('/app/')}`,
    '',
    `Sitemap: ${absoluteUrl(origin, '/sitemap.xml')}`,
    `Host: ${origin.startsWith('https://') ? `https://${host}` : host}`,
    '',
  ];
  return new Response(lines.join('\n'), {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
};
