import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { findCourse } from '@/content/catalogue';
import { formatPrice } from '@content/site/pricing';
import { useT } from '@/app/hooks/useT';
import { useTrainedCourseIds } from '@/app/store/progress';
import { useSession } from '@/app/store/session';
import { courseAccess, hasCompletedIn } from './courseAccess';
import { UnlockSheet } from './UnlockSheet';

export interface UnlockCardProps {
  /** Курс только что законченной тренировки; `'custom'` — персональная, к курсам отношения не имеет. */
  courseId: string;
}

/**
 * «Дальше — весь курс», на экране итогов бесплатной тренировки.
 *
 * Это единственное место в продукте, где предложение купить стоит в правильный момент: человек
 * только что закончил тренировку и знает, каково это, вместо того чтобы читать про это на странице.
 * До сих пор такого момента не было вовсе — курс был заперт целиком, и выбор делался по описанию.
 *
 * **Кому её не видно.** Владельцу курса (купил или открыт подпиской) и тому, кто пришёл из
 * персональной тренировки. Предлагать купить купленное — худший вид невнимательности, и ровно так
 * выглядит большинство встроенных продаж.
 *
 * Компонент сам решает, показываться ли, а не получает флаг снаружи: так `SummaryScreen` не носит
 * в себе знание о покупках, которое ему больше ни для чего не нужно, и условие живёт в одном месте
 * с остальной моделью доступа.
 */
export function UnlockCard({ courseId }: UnlockCardProps) {
  const { t, locale } = useT();
  const entitlements = useSession((s) => s.entitlements);
  const trained = useTrainedCourseIds();
  const [open, setOpen] = useState(false);

  const course = courseId === 'custom' ? undefined : findCourse(courseId);
  if (!course) return null;

  const access = courseAccess({
    owned: entitlements.includes(course.id),
    hasCompleted: hasCompletedIn(trained, course.id),
  });
  if (access === 'owned') return null;

  return (
    <>
      <Card level={1} className="flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <span className="eyebrow">{t('app.unlockCardEyebrow')}</span>
          <p className="display text-2xl">{t('app.unlockCardTitle')}</p>
          <p className="text-[15px] leading-relaxed text-muted">{t('app.unlockCardBody')}</p>
        </div>
        <Button variant="action" size="lg" fullWidth onClick={() => setOpen(true)}>
          {t('app.coursesUnlock', { price: formatPrice(locale, course.price) })}
        </Button>
      </Card>
      <UnlockSheet open={open} course={course} onClose={() => setOpen(false)} />
    </>
  );
}
