/**
 * The title and meta description of a creator's page (`/c/<slug>/`), shared by the page itself
 * and the page registry (sitemap, llms.txt), so the two can never disagree.
 *
 * Both are made from what the creator wrote and what they sell, nothing else: the name, the line
 * about them, their course names, and one true sentence — workout 1 of any course is free (0019,
 * 0022). No counts, no ratings: a creator page states no figure it cannot back.
 */
import type { Locale } from '@/content/schema';
import type { SiteCreator } from '@/content/creators';
import { l, t } from '@/i18n/index';
import { buildDescription, fitTitle } from './meta';

/** «Алла — курсы и тренировки», or the bare name when that does not fit the title budget. */
export function creatorPageTitle(c: SiteCreator, locale: Locale): string {
  return fitTitle([t(locale, 'seo.creatorPageTitle', { name: c.name }), c.name]);
}

/** The creator's own line, then their courses by name, then the free first workout. */
export function creatorPageDescription(c: SiteCreator, locale: Locale): string {
  const [open, close] = locale === 'ru' ? ['«', '»'] : ['“', '”'];
  const courses = c.courses.map((x) => `${open}${l(x.name, locale)}${close}`).join(', ');
  const lead = t(locale, 'seo.creatorPageCourses', { name: c.name, courses });
  const text = c.about ? `${c.about.replace(/[\s.!?…]*$/, '.')} ${lead}` : lead;
  return buildDescription(text, t(locale, 'seo.creatorPageCta'));
}
