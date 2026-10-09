/**
 * A course's state as one stamp: published (the light-blue «this one»), waiting for review (0065,
 * the warning word — somebody has to act), or a draft (glass).
 */
import { Badge } from '@/components/ui/Badge';
import type { AdminCourseRow } from '@/lib/api/types';
import { useT } from '@/app/hooks/useT';
import { inReview } from './builderScope';

export function CourseStateBadge({
  course,
}: {
  course: Pick<AdminCourseRow, 'status' | 'reviewRequestedAt'>;
}) {
  const { t } = useT();
  if (course.status === 'published') {
    return (
      <Badge tone="inverse" size="sm">
        {t('app.coursePublished')}
      </Badge>
    );
  }
  if (inReview(course)) {
    return (
      <Badge tone="warning" size="sm">
        {t('app.courseInReview')}
      </Badge>
    );
  }
  return (
    <Badge tone="neutral" size="sm">
      {t('app.courseDraft')}
    </Badge>
  );
}
