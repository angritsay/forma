/**
 * /llms.txt — a plain-text map of the site for LLM crawlers (llmstxt.org): what Forma is,
 * the courses, the guides, the exercise library and the legal pages, in English and Russian.
 * Generated from content and config; nothing here is hand-maintained.
 */
import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';
import { COURSES } from '@/content/registry';
import type { Locale } from '@/content/schema';
import { l, t } from '@/i18n/index';
import { guidePath, guidesForLocale } from '@/lib/seo/guides';
import { canonicalUrl, siteOrigin } from '@/lib/seo/urls';
import { absoluteUrl } from '@/lib/util/paths';
import { BRAND } from '@content/site/brand';

export const GET: APIRoute = async ({ site }) => {
  const origin = siteOrigin(site);
  const all = await getCollection('guides');
  const link = (locale: Locale, path: string) => canonicalUrl(origin, locale, path);

  const section = (locale: Locale): string[] => {
    const lines: string[] = [];
    lines.push(`## ${t(locale, 'seo.llmsCourses')}`);
    for (const c of COURSES) {
      lines.push(
        `- [${l(c.name, locale)}](${link(locale, `/courses/${c.slug[locale]}/`)}): ${l(c.tagline, locale)}`,
      );
    }
    lines.push(`- [${t(locale, 'seo.coursesHubTitle')}](${link(locale, '/courses/')}): ${t(locale, 'seo.coursesHubDescription')}`);
    lines.push('');
    lines.push(`## ${t(locale, 'seo.llmsGuides')}`);
    const guides = guidesForLocale(all, locale);
    for (const g of guides) {
      lines.push(`- [${g.data.title}](${link(locale, guidePath(g))}): ${g.data.description}`);
    }
    lines.push(`- [${t(locale, 'seo.guidesHubH1')}](${link(locale, '/guides/')}): ${t(locale, 'seo.guidesHubDescription')}`);
    lines.push('');
    lines.push(`## ${t(locale, 'seo.llmsExercises')}`);
    lines.push(`- [${t(locale, 'seo.exercisesHubH1')}](${link(locale, '/exercises/')}): ${t(locale, 'seo.llmsExercisesLine')}`);
    lines.push('');
    lines.push(`## ${t(locale, 'seo.llmsAbout')}`);
    lines.push(`- [${BRAND.name}](${link(locale, '/')}): ${BRAND.tagline[locale]}`);
    lines.push(`- [${t(locale, 'seo.aboutPage')}](${link(locale, '/about/')})`);
    lines.push(`- [${t(locale, 'seo.contactPage')}](${link(locale, '/contact/')})`);
    lines.push('');
    lines.push(`## ${t(locale, 'seo.llmsOptional')}`);
    lines.push(`- [${t(locale, 'seo.privacyPage')}](${link(locale, '/privacy/')})`);
    lines.push(`- [${t(locale, 'seo.termsPage')}](${link(locale, '/terms/')})`);
    lines.push(`- [${t(locale, 'seo.refundPage')}](${link(locale, '/refund/')})`);
    lines.push('');
    return lines;
  };

  const out = [
    `# ${BRAND.name}`,
    '',
    `> ${BRAND.tagline.en} / ${BRAND.tagline.ru}`,
    '',
    t('en', 'seo.llmsIntro'),
    '',
    t('ru', 'seo.llmsIntro'),
    '',
    '# English',
    '',
    ...section('en'),
    '# Русский',
    '',
    ...section('ru'),
    '## Feeds',
    `- [${t('en', 'seo.sitemapPage')}](${absoluteUrl(origin, '/sitemap.xml')})`,
    `- [${t('en', 'seo.rssPage')}](${absoluteUrl(origin, '/rss.xml')})`,
    '',
  ];
  return new Response(out.join('\n'), {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
};
