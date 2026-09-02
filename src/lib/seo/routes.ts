/**
 * Page registry entry point for Astro endpoints: loads the guides collection and delegates to
 * the pure `buildPages`. Import this only from Astro pages/endpoints (it needs `astro:content`).
 */
import { getCollection } from 'astro:content';
import { isPublished } from './guides';
import { buildPages, type SeoPage } from './pages';

export type { SeoPage, PageKind, Changefreq } from './pages';

export async function allPages(): Promise<SeoPage[]> {
  const guides = (await getCollection('guides')).filter(isPublished);
  return buildPages(guides);
}
