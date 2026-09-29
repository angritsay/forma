import { Doodle } from '@/components/ui/Doodle';
import { useT } from '@/app/hooks/useT';
import { SlideFrame } from './SlideFrame';

/**
 * The player, before the athlete has seen it.
 *
 * The three lines are `FlipCard.tsx`'s own header: up is the next movement and down the one
 * before, right-to-left brings the words (the technique and the coach's explanation), and a tap
 * on the picture pauses (`TapToPause`). Nothing else the player does is promised here.
 *
 * The picture is a phone-shaped tile with the gestures drawn around it: the looping arrow turned
 * to point up, down and left, an eye in the middle for the tap, and one word under each at 12px —
 * the smallest type on any slide, because these are captions on a drawing, not lines to read.
 */
export function PlayerSlide() {
  const { t } = useT();
  const caption = 'text-[12px] leading-none text-on-field/85';
  return (
    <SlideFrame
      ground="bg-field"
      chrome="light"
      eyebrow={t('app.onbStoryPlayerEyebrow')}
      title={t('app.onbStoryPlayerTitle')}
      lines={[
        t('app.onbStoryPlayerLine1'),
        t('app.onbStoryPlayerLine2'),
        t('app.onbStoryPlayerLine3'),
      ]}
      visual={
        <div className="flex items-center gap-5 text-on-field">
          {/* Left of the phone: the sideways swipe. The arrow is drawn to the upper right; 135°
              lays it pointing left. */}
          <div className="flex flex-col items-center gap-2">
            <Doodle kind="arrow" className="size-10 rotate-[135deg]" />
            <span className={caption}>{t('app.onbStoryPlayerLeft')}</span>
          </div>
          {/* The phone: a dark tile on the field with the eye in it. */}
          <div className="flex aspect-[9/16] w-28 flex-col items-center justify-center gap-2 rounded-tile border border-paper/15 bg-surface-2">
            <Doodle kind="eye" className="size-10" />
            <span className={caption}>{t('app.onbStoryPlayerTap')}</span>
          </div>
          {/* Right of the phone: the workout's own axis, up and down. */}
          <div className="flex flex-col items-center gap-6">
            <div className="flex flex-col items-center gap-2">
              <Doodle kind="arrow" className="size-10 -rotate-45" />
              <span className={caption}>{t('app.onbStoryPlayerUp')}</span>
            </div>
            <div className="flex flex-col items-center gap-2">
              <Doodle kind="arrow" className="size-10 -rotate-[135deg]" />
              <span className={caption}>{t('app.onbStoryPlayerDown')}</span>
            </div>
          </div>
        </div>
      }
    />
  );
}
