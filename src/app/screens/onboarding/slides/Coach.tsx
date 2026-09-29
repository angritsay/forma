import { COACH } from '@content/site/coach';
import { withBase } from '@/lib/util/paths';
import { useT } from '@/app/hooks/useT';
import { SlideFrame } from './SlideFrame';

/**
 * The last slide: the coach, and the button that starts the training.
 *
 * Line one: every movement is his clip, with his words on the card's back (`CardBack`). Not «he
 * sees your health notes»: the consent allows it, but no admin screen shows them yet. Line two:
 * the coach tab
 * sells half an hour and an hour one-on-one (`content/site/booking.ts`, 30 and 60 minutes).
 *
 * The picture is his photograph in the product's one frame for a person — 4:5, monochrome, grain
 * over it (`CoachHeroCard`) — on the blue field, the way the tab shows him.
 */
export function CoachSlide() {
  const { t, l } = useT();
  return (
    <SlideFrame
      ground="bg-field"
      chrome="light"
      eyebrow={t('app.onbStoryCoachEyebrow')}
      title={t('app.onbStoryCoachTitle')}
      lines={[t('app.onbStoryCoachLine1'), t('app.onbStoryCoachLine2')]}
      visual={
        <div className="relative w-44 overflow-hidden rounded-tile">
          <img
            src={withBase(COACH.photo)}
            alt={l(COACH.name)}
            width={256}
            height={320}
            className="photo-mono block aspect-[4/5] w-full object-cover"
          />
          <div className="photo-grain" aria-hidden="true" />
        </div>
      }
    />
  );
}
