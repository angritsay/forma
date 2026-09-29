/**
 * The line that tells an admin a course is written in code, so nothing typed here reaches anyone.
 *
 * 0009 imports every compiled course as an editable draft, and the catalogue prefers the compiled
 * file on an id collision (`setCatalogueOverlay` in src/content/catalogue.ts). So on those courses
 * the builder saves, the database changes, and the app keeps showing the file — with no word on
 * the screen that this is what happens. The audit found exactly that: edits and Publish on the
 * «Форма с нуля» draft changed nothing for users. This notice is that word; `AdminCourseScreen`
 * also keeps Publish disabled for these courses, because publishing a copy the app ignores only
 * looks like it did something.
 *
 * Styled as the publish verdict is — a ruled line with the warning colour on the words alone —
 * rather than a tinted callout. It renders nothing for a course the admin actually owns.
 */
import { isCompiledCourse } from '@/content/catalogue';
import { useT } from '@/app/hooks/useT';

export function CompiledCourseNotice({ slugId }: { slugId: string }) {
  const { t } = useT();
  if (!isCompiledCourse(slugId)) return null;
  return (
    <p
      role="note"
      className="mt-4 border-y border-border py-3 text-[13px] leading-[1.3] text-warning"
    >
      {t('app.courseCompiledNotice')}
    </p>
  );
}
