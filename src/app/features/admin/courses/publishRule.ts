/**
 * When the course builder lets an admin press Publish.
 *
 * Two things stop it. A draft `CourseSchema` rejects has issues, and those are listed on the tab.
 * A course written in code (`isCompiledCourse`) can never be published from here: the catalogue
 * and the site both prefer the compiled file on an id collision (`setCatalogueOverlay` in
 * src/content/catalogue.ts, `SITE_COURSES` in src/content/published.ts), so publishing its draft
 * would change nothing for anyone. See CompiledCourseNotice for the line that says so.
 *
 * A pure function rather than an inline expression in `AdminCourseScreen`, so the rule has a test.
 */
import { isCompiledCourse } from '@/content/catalogue';

export function canPublish(slugId: string, issues: readonly string[]): boolean {
  return !isCompiledCourse(slugId) && issues.length === 0;
}
