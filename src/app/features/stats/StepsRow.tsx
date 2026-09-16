/**
 * Today's steps, as one row with a ring.
 *
 * It used to be a task on Home, next to the workout — but Home answers "what do I do now", and
 * how far somebody walked today is an answer to "how am I doing", which is this tab. It is also
 * the only number on «Ты» the athlete still owes: everything else here is a record of what has
 * already happened, and a screen made entirely of finished things gives nobody a reason to touch
 * it.
 *
 * The ring, rather than a bar, because it is the shape the rest of this tab counts in, and
 * because a ring reads at a glance at the size a row allows.
 *
 * The row said «Напиши, сколько прошёл сегодня» over «0 из 7 000 шагов» — an instruction and a
 * sentence about a number, on a tab whose own note from the owner was «МИНИМУМ текста». It is a
 * kicker and a figure now: the word «Шаги» names what is counted, the numeral is the count against
 * the goal, and the ring says how far. The instruction was doing no work the ring at 0% was not
 * already doing, and the control is a button, which says by itself that it can be pressed.
 */
import { Glyph } from '@/components/ui/Icon';
import { RingProgress } from '@/components/ui/RingProgress';
import { formatNumber } from '@/i18n/index';
import { useT } from '@/app/hooks/useT';

export interface StepsRowProps {
  steps: number;
  goal: number;
  onOpen: () => void;
}

export function StepsRow({ steps, goal, onOpen }: StepsRowProps) {
  const { t, locale } = useT();
  const share = goal > 0 ? Math.min(1, steps / goal) : 0;
  const done = steps >= goal;

  return (
    <button
      type="button"
      onClick={onOpen}
      className="flex w-full items-center gap-4 border-y border-border py-4 text-left transition-colors duration-150 ease-(--ease-out) active:bg-surface-2"
    >
      <span className="flex min-w-0 flex-1 flex-col gap-1.5">
        <span className="eyebrow">{t('app.stepsTitle')}</span>
        <span className="numeral tabular text-[22px] leading-none">
          {formatNumber(locale, steps)}
          <span className="text-[13px] text-muted-2"> / {formatNumber(locale, goal)}</span>
        </span>
      </span>
      <RingProgress value={share} size={48} stroke={6} label={t('app.statsStepsTitle')}>
        {done ? (
          <Glyph size={14}>✓</Glyph>
        ) : (
          <span className="numeral tabular text-[11px]">{Math.round(share * 100)}%</span>
        )}
      </RingProgress>
    </button>
  );
}
