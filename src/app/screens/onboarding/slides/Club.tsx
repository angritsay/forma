import { clsx } from 'clsx';
import { Doodle } from '@/components/ui/Doodle';
import { useT } from '@/app/hooks/useT';
import { SlideFrame } from './SlideFrame';

/** Seven days as the club's week track draws them: four done, today open, two ahead. */
const DAYS = ['done', 'done', 'done', 'done', 'today', 'future', 'future'] as const;

/**
 * The club, on its own colour.
 *
 * The three lines are the club's own feature list (`clubFeature1Title`, `clubFeature3Title`,
 * `clubFeature4Title`): one task a day, points and a streak, the week's prize an hour with the
 * coach. The ground is the warm half of the crossroads gradient and every mark on it is ink —
 * the club has no neon and no light blue (§17), and no white reads across the beige.
 *
 * The picture is the week track (`WeekTrack.tsx`) redrawn in ink at seven small tiles — four
 * filled, today outlined, two hairlines — under the trophy and the flame from the doodle set.
 * Static, not `WeekTrack` itself: that one needs real days and paints in the gradient, which on
 * this ground would be the gradient on the gradient.
 */
export function ClubSlide() {
  const { t } = useT();
  return (
    <SlideFrame
      ground="bg-warm"
      chrome="ink"
      eyebrow={t('app.onbStoryClubEyebrow')}
      title={t('app.onbStoryClubTitle')}
      lines={[t('app.onbStoryClubLine1'), t('app.onbStoryClubLine2'), t('app.onbStoryClubLine3')]}
      visual={
        <div className="flex flex-col items-center gap-7 text-ink">
          <div className="flex items-center gap-6">
            <Doodle kind="trophy" className="size-16" />
            <Doodle kind="flame" className="size-16" />
          </div>
          <div className="flex gap-2">
            {DAYS.map((state, i) => (
              <span
                key={i}
                className={clsx(
                  'size-7 rounded-tile',
                  state === 'done' && 'bg-ink/20',
                  state === 'today' && 'border-2 border-ink',
                  state === 'future' && 'border border-ink/30',
                )}
              />
            ))}
          </div>
        </div>
      }
    />
  );
}
