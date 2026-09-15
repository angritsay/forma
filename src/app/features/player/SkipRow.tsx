/**
 * The two things that are not the work: how to do it, and how to get past it.
 *
 * Both live in one quiet row at the bottom of the panel, in the register the flip handle already
 * used — small, tracked capitals, two thirds opacity. That placement is the whole design. A skip
 * is now offered on every step, including the cool-down, and a control that can be reached during
 * a set of ten must not sit anywhere near «Готово»: the swipe surface is already the entire face,
 * so the one defence left is distance from the primary action.
 *
 * During the warm-up the left control skips the whole warm-up, because that is the decision
 * somebody is actually making — nobody wants to skip arm circles and then neck circles. Everywhere
 * else it skips the step in front of them.
 *
 * What a skip records is not nothing: `skippedResult` writes `{ completed: false, skipped: true }`
 * and the step keeps its weight, so the work is counted as not done. That is the honest reading,
 * and after the star rule (lib/training/stars.ts) it costs something only where it should — the
 * main work. Skipping preparation is free, which is why the control can be there at all.
 */
import { Glyph } from '@/components/ui/Icon';
import { useT } from '@/app/hooks/useT';

export interface SkipRowProps {
  /** Skips the whole warm-up; null once the athlete is past it. */
  onSkipWarmup: (() => void) | null;
  /** Skips the step on screen. Null on a step there is no sense in skipping. */
  onSkipStep: (() => void) | null;
  onFlip: () => void;
}

const LINK =
  'control-label tap-target-y flex items-center justify-center gap-1.5 text-[11px] ' +
  'text-paper/60 transition-colors duration-150 ease-(--ease-out) hover:text-paper';

export function SkipRow({ onSkipWarmup, onSkipStep, onFlip }: SkipRowProps) {
  const { t } = useT();
  const skip = onSkipWarmup ?? onSkipStep;
  const label = onSkipWarmup ? t('app.playerSkipWarmup') : t('app.playerSkipStep');

  return (
    <div className="mt-3 flex items-center justify-center gap-6">
      {skip ? (
        <button type="button" onClick={skip} className={LINK}>
          {label}
          <Glyph size={12}>→</Glyph>
        </button>
      ) : null}
      <button type="button" onClick={onFlip} className={LINK}>
        {t('app.playerHowTo')}
        <Glyph size={12}>⟲</Glyph>
      </button>
    </div>
  );
}
