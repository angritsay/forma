/**
 * The prize, as the one filled pill of the club's screens.
 *
 * It is `Pill tone="course-fill"` in every respect but one: it is allowed to wrap. The shared
 * component ellipsises its contents on purpose — «a long prize can never push the kicker beside it
 * off the screen» — and that rule was written when the prize was two words. It is now «час с
 * тренером и создателем Forma», which measures 313px of tracked capitals: it fits a 390px screen
 * with two pixels to spare and ellipsises «…СОЗДАТЕЛЕМ FO…» on a 375px one. A truncated prize is
 * worse than no prize, because it is the sentence the whole table exists for.
 *
 * So this one pill takes two lines when it needs them, and `Pill` keeps its rule for the pills the
 * rule was written for — the points on a task, the trial's countdown. Same tokens, same 10px
 * tracked capitals, same fully-rounded shape: it is the same object, at its full length.
 */
import type { ReactNode } from 'react';
import { useT } from '@/app/hooks/useT';

export function PrizePill({ children }: { children: ReactNode }) {
  const { t } = useT();
  return (
    <span className="control-label inline-flex max-w-full min-h-7 items-center rounded-pill bg-course px-3 py-1.5 text-[10px] leading-[1.5] text-on-course">
      {t('app.marathonPrizeShort')} · {children}
    </span>
  );
}
