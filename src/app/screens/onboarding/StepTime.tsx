import { useT } from '@/app/hooks/useT';
import type { SessionTime } from '@/lib/training/types';
import { SESSION_TIMES } from './draft';
import { OptionTile } from './OptionTile';
import { Question } from './Question';
import type { StepProps } from './types';

/**
 * How long a session may take: five plates, each one big numeral over «мин».
 *
 * These were rows — «15 мин» at 15px with «Быстро и плотно» under it — and the number was the
 * smallest thing on the row. The prototype's difficulty sheet sets its minutes the other way round
 * («15 / МИН» in the display face, the words beside it), and here there are no words to be beside:
 * the number *is* the answer, so it is the whole plate. The five share one row and split it evenly,
 * which a 390px screen affords at two digits each; the check that lands on other plates is off
 * here, because the inversion under a 28px figure is already unmistakable.
 */
export function StepTime({ draft, update }: StepProps) {
  const { t } = useT();
  return (
    <div className="flex flex-col gap-6">
      <Question text={t('app.onbTimeTitle')} />
      <div role="radiogroup" aria-label={t('app.onbTimeTitle')} className="flex gap-2">
        {SESSION_TIMES.map((m) => {
          const selected = draft.timePerSessionMin === m;
          return (
            <OptionTile
              key={m}
              role="radio"
              mark={false}
              selected={selected}
              onClick={() => update({ timePerSessionMin: m as SessionTime })}
            >
              <span className="flex flex-col items-center py-1.5">
                <span className="numeral tabular text-[28px] leading-none">{m}</span>
                <span className="mt-1.5 text-[10px] tracking-[0.12em] opacity-70">
                  {t('common.minutesUnit')}
                </span>
              </span>
            </OptionTile>
          );
        })}
      </div>
    </div>
  );
}
