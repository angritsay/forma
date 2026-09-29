import { clsx } from 'clsx';
import { useT } from '@/app/hooks/useT';
import { SlideFrame } from './SlideFrame';

/**
 * Seven stops, the column each stands in: the same wave `PathView` walks (1 2 3 4 3 2 …), so the
 * slide is a small drawing of the real screen rather than a different diagram of it.
 */
const WAVE = [1, 2, 3, 4, 3, 2, 1] as const;
const STEP_PX = 40;

/**
 * The first of the tour: the course is a path of days.
 *
 * Line one is the engine's order rule (`start-engine.test.ts`: workouts open one after another);
 * lines two and three are the trial — the first workout of a course is free (`coursesFreeBadge`,
 * migration 0019) and the rest is one payment (`pathNotOwnedBody`).
 *
 * The picture is the path as `PathView` draws it, cut to a week: circles winding down the screen,
 * the first one filled in the light blue — progress and «you are here» are the light blue's job
 * in the semantic map — and the others hairlines, because nothing has been done yet.
 */
export function PathSlide() {
  const { t } = useT();
  return (
    <SlideFrame
      ground="bg-bg"
      chrome="light"
      eyebrow={t('app.onbStoryPathEyebrow')}
      title={t('app.onbStoryPathTitle')}
      lines={[t('app.onbStoryPathLine1'), t('app.onbStoryPathLine2'), t('app.onbStoryPathLine3')]}
      visual={
        <ol className="flex flex-col gap-2" style={{ width: `${3 * STEP_PX + 32}px` }}>
          {WAVE.map((col, i) => (
            <li key={i} className="flex" style={{ paddingLeft: `${(col - 1) * STEP_PX}px` }}>
              <span
                className={clsx(
                  'numeral flex size-8 items-center justify-center rounded-full text-[13px]',
                  i === 0 ? 'bg-accent text-on-accent' : 'border border-border-strong text-muted-2',
                )}
              >
                {i + 1}
              </span>
            </li>
          ))}
        </ol>
      }
    />
  );
}
