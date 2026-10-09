/**
 * «Также в Forma» (0066, docs/PLATFORM.md phase 2 step 6): other creators' published courses,
 * grouped by creator, under the member's own deck on «Курсы».
 *
 * The server decides who is listed (`catalogue_creators()`: open, not Forma itself, a published
 * course, and not a Pro creator who switched the listing off). This decides what is worth a row:
 * a course the app's catalogue has loaded (so the row can open it) and that is not already a card
 * on the screen. A creator left with no row is not shown at all.
 */
import type { Course } from '@/content/schema';
import type { PublicCreator } from '@/lib/api/types';

export interface AlsoGroup {
  slug: string;
  name: string;
  courses: Course[];
}

export function alsoOnForma(
  creators: readonly PublicCreator[],
  catalogue: readonly Course[],
  onScreen: ReadonlySet<string>,
): AlsoGroup[] {
  const byId = new Map(catalogue.map((c) => [c.id, c]));
  const shown = new Set<string>();
  const out: AlsoGroup[] = [];
  for (const cr of creators) {
    const courses = cr.courses.flatMap((id) => {
      const c = byId.get(id);
      if (!c || onScreen.has(id) || shown.has(id)) return [];
      shown.add(id);
      return [c];
    });
    if (courses.length > 0) out.push({ slug: cr.slug, name: cr.name, courses });
  }
  return out;
}
