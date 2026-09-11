import { clsx } from 'clsx';
import { Badge } from '@/components/ui/Badge';
import { Glyph } from '@/components/ui/Icon';
import { useT } from '@/app/hooks/useT';
import type { DifficultyChoice, Recommendation } from '@/lib/training/types';
import { DIFFICULTY_LABEL } from './plan';

export interface DifficultyOption {
  choice: DifficultyChoice;
  durationSec: number;
  points: number;
  calories: number;
}

export interface DifficultyChooserProps {
  options: readonly DifficultyOption[];
  value: DifficultyChoice;
  onChange: (choice: DifficultyChoice) => void;
  recommended: Recommendation;
}

/**
 * Easier / As usual / Harder as three ruled rows — a square mark, the name and the recommended
 * stamp on the left, the minutes as a numeral on the right, points and kcal under them. The
 * chosen row's mark is the white fill with a tick, the same inversion every selected control in
 * the kit uses; nothing is boxed and nothing takes a colour. The coach's reason reads underneath.
 */
export function DifficultyChooser({
  options,
  value,
  onChange,
  recommended,
}: DifficultyChooserProps) {
  const { t, l } = useT();
  return (
    <div className="flex flex-col gap-3">
      <div role="radiogroup" aria-label={t('app.nodeDifficultyTitle')} className="flex flex-col">
        {options.map((o) => {
          const selected = o.choice === value;
          const isRecommended = o.choice === recommended.choice;
          return (
            <button
              key={o.choice}
              type="button"
              role="radio"
              aria-checked={selected}
              onClick={() => onChange(o.choice)}
              className={clsx(
                'flex w-full items-center gap-3.5 border-t border-border py-3.5 text-left first:border-t-0',
                'transition-colors duration-150 ease-(--ease-out) hover:bg-surface',
              )}
            >
              <span
                aria-hidden="true"
                className={clsx(
                  'flex size-5 shrink-0 items-center justify-center border',
                  selected ? 'border-primary bg-primary text-on-primary' : 'border-border-strong',
                )}
              >
                {selected ? <Glyph size={12}>✓</Glyph> : null}
              </span>
              <span className="flex min-w-0 flex-1 flex-col gap-1">
                <span className="flex flex-wrap items-center gap-2">
                  <span
                    className={clsx(
                      'text-[15px] font-semibold',
                      selected ? 'text-text' : 'text-muted',
                    )}
                  >
                    {t(DIFFICULTY_LABEL[o.choice])}
                  </span>
                  {isRecommended ? (
                    <Badge tone="neutral" size="sm">
                      {t('training.recommended')}
                    </Badge>
                  ) : null}
                </span>
                <span className="tabular text-xs text-muted">
                  {t('app.nodePoints', { n: o.points })} · {t('app.nodeKcal', { n: o.calories })}
                </span>
              </span>
              <span className="numeral tabular shrink-0 text-xl leading-none">
                {t('app.nodeDuration', { min: Math.max(1, Math.round(o.durationSec / 60)) })}
              </span>
            </button>
          );
        })}
      </div>
      <p className="flex gap-2 border-t border-border pt-3 text-sm text-muted">
        <Glyph size={12} className="mt-1 shrink-0 text-muted-2">
          //
        </Glyph>
        <span>{l(recommended.reason)}</span>
      </p>
    </div>
  );
}
