import { Doodle } from '@/components/ui/Doodle';
import { Pill } from '@/components/ui/Pill';
import { useT } from '@/app/hooks/useT';
import { SlideFrame } from './SlideFrame';

/**
 * After «Что беречь?»: what the answer does.
 *
 * The three lines are `prescribe.ts`, sentence by sentence. Knees, lower back, shoulders and
 * wrists each have a conflict rule (`conflictsWithLimitations`) and a movement that hits one is
 * walked down its `scaling.easier` chain to one that does not — that is «заменяются». Blood
 * pressure has no substitution: a `heavy` load becomes `medium` (`effectiveLoadLabel`) and an
 * isometric hold is capped at `HYPERTENSION_MAX_HOLD_SEC` — so the line says «без тяжёлых весов и
 * долгих удержаний» and not «заменяются». Pregnancy forces the whole prescription to `easier`
 * (`prescribeWorkout`) and the recommendation to «полегче» (`recommendDifficulty`).
 *
 * The picture is the swap as two stickers on the field: a movement on the left in the outline
 * pill, the arrow, and its safer stand-in in the white one. Lunges → glute bridge is the
 * example the coach's own library gives for a knee.
 */
export function CareSlide() {
  const { t } = useT();
  return (
    <SlideFrame
      ground="bg-field"
      chrome="light"
      eyebrow={t('app.onbStoryCareEyebrow')}
      title={t('app.onbStoryCareTitle')}
      lines={[t('app.onbStoryCareLine1'), t('app.onbStoryCareLine2'), t('app.onbStoryCareLine3')]}
      visual={
        <div className="flex items-center gap-3 text-on-field">
          <Pill tone="ghost">{t('app.onbStoryCareFrom')}</Pill>
          {/* The looping arrow is drawn pointing up and right; a quarter turn lays it flat. */}
          <Doodle kind="arrow" className="size-12 shrink-0 rotate-45" />
          <Pill tone="white">{t('app.onbStoryCareTo')}</Pill>
        </div>
      }
    />
  );
}
