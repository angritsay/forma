import { clsx } from 'clsx';
import { Badge } from '@/components/ui/Badge';
import { Icon } from '@/components/ui/Icon';
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
 * Easier / As usual / Harder as three stacked rows — a radio, the name and the recommended badge
 * on the left, the minutes big on the right, points and kcal under them. One row is selected;
 * the coach's reason for the recommendation reads underneath.
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
      <div
        role="radiogroup"
        aria-label={t('app.nodeDifficultyTitle')}
        className="flex flex-col gap-2"
      >
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
                'flex w-full items-center gap-3 rounded-inner border px-4 py-3 text-left transition-colors',
                selected
                  ? 'border-accent bg-surface-3'
                  : 'border-border bg-surface-2 hover:bg-surface-3',
              )}
            >
              <span
                aria-hidden="true"
                className={clsx(
                  'flex h-5 w-5 shrink-0 items-center justify-center rounded-pill border-2',
                  selected ? 'border-accent bg-accent text-on-primary' : 'border-border-strong',
                )}
              >
                {selected ? <Icon name="check" size={12} /> : null}
              </span>
              <span className="flex min-w-0 flex-1 flex-col gap-1">
                <span className="flex flex-wrap items-center gap-2">
                  <span className="text-[15px] font-semibold">{t(DIFFICULTY_LABEL[o.choice])}</span>
                  {isRecommended ? (
                    <Badge tone="accent" size="sm" icon="star">
                      {t('training.recommended')}
                    </Badge>
                  ) : null}
                </span>
                <span className="tabular text-xs text-muted">
                  {t('app.nodePoints', { n: o.points })} · {t('app.nodeKcal', { n: o.calories })}
                </span>
              </span>
              <span className="tabular shrink-0 text-xl font-bold leading-none">
                {t('app.nodeDuration', { min: Math.max(1, Math.round(o.durationSec / 60)) })}
              </span>
            </button>
          );
        })}
      </div>
      <p className="flex gap-2 text-sm text-muted">
        <Icon name="info" size={18} className="mt-0.5 shrink-0 text-accent" />
        <span>{l(recommended.reason)}</span>
      </p>
    </div>
  );
}
