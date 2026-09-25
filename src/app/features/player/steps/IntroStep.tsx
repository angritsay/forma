/**
 * The coach's explanation of an exercise, just before the athlete first does it in this session.
 *
 * Built as the block's title card is (BlockIntroStep): an eyebrow, the name in the display face at
 * the same size, what there is to read, and one button. Nothing new is invented for it — it is the
 * same kind of screen, a pause before something begins, and it should read as one.
 *
 * - **Eyebrow.** «Объяснение» the first time, «Коротко» the next two (intro.ts decides which, when
 *   the session starts; the step only carries the answer).
 * - **Text.** The coach's words at the body size of the card's back (15px, relaxed leading), split
 *   into paragraphs on blank lines. A long explanation scrolls inside its own block, capped at a
 *   little over a third of the screen, so the button never leaves the panel and the clip keeps the
 *   rest; a touch that starts in the block scrolls it rather than dragging the feed (FlipCard).
 * - **Voice.** The recorded explanation plays as the step opens, in the viewer's language or else
 *   Russian — or, where the coach wrote words but recorded none, the movement's spoken name. It is
 *   cut when the step is left and when the workout is paused; resuming starts it again from the
 *   top, because half an explanation is less use than a repeated one and this step has no clock
 *   for a restart to cost anything against.
 * - **Clip.** Behind the panel, the explanation's own clip if one was filmed, else the movement's
 *   (`stepVideoRef`); always looped (`stepFitSec` has no length for this step).
 *
 * The content is read from the catalogue here, not from the step, so an explanation re-edited in
 * the admin panel shows its latest words even in a session prescribed before the edit.
 */
import { useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { useT } from '@/app/hooks/useT';
import { DisplayTitle } from '@/app/features/home/DisplayTitle';
import {
  exerciseIntro,
  exerciseName,
  introAudioRef,
  introParagraphs,
  type IntroStep as Step,
} from '../model';
import { playVoice, stopVoice } from '../voice';

/**
 * How long a recording still decoding is waited for. Longer than a spoken name's wait: an
 * explanation is a bigger file, and nothing on this step is running against a clock meanwhile.
 */
const INTRO_VOICE_WAIT_MS = 4000;

export interface IntroStepProps {
  step: Step;
  paused: boolean;
  onNext: () => void;
}

export function IntroStep({ step, paused, onNext }: IntroStepProps) {
  const { t, locale } = useT();
  const intro = exerciseIntro(step.exerciseId, step.tier);
  const paragraphs = introParagraphs(intro?.text, locale);

  useEffect(() => {
    if (paused) return;
    playVoice(introAudioRef(step.exerciseId, step.tier, locale), {
      waitMs: INTRO_VOICE_WAIT_MS,
    });
  }, [paused, step.exerciseId, step.tier, locale]);
  useEffect(() => () => stopVoice(), []);

  return (
    <div className="flex flex-col gap-5 md:flex-1">
      <div className="flex flex-col gap-2.5">
        <span className="eyebrow">
          {step.tier === 'full' ? t('app.playerIntroFull') : t('app.playerIntroBrief')}
        </span>
        <DisplayTitle as="h2" text={exerciseName(step.exerciseId, locale)} className="text-4xl" />
        {paragraphs.length > 0 ? (
          <div className="flex max-h-[38vh] flex-col gap-3 overflow-y-auto overscroll-contain text-[15px] leading-relaxed">
            {paragraphs.map((p, i) => (
              <p key={i} className="whitespace-pre-line">
                {p}
              </p>
            ))}
          </div>
        ) : null}
      </div>
      <Button
        variant="action"
        size="lg"
        fullWidth
        onClick={onNext}
        data-autofocus
        className="md:mt-auto"
      >
        {t('app.playerGo')}
      </Button>
    </div>
  );
}
