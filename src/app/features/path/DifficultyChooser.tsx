import { clsx } from 'clsx';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
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

/** Three cards (Easier / As usual / Harder) with time, points and kcal; one badged as recommended. */
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
        className="grid grid-cols-3 gap-2"
      >
        {options.map((o) => {
          const selected = o.choice === value;
          const isRecommended = o.choice === recommended.choice;
          return (
            <Card
              key={o.choice}
              level={2}
              padding="sm"
              role="radio"
              aria-checked={selected}
              selected={selected}
              onClick={() => onChange(o.choice)}
              className={clsx('flex flex-col gap-2', selected && 'bg-surface-3')}
            >
              <div className="flex min-h-6 items-start">
                {isRecommended ? (
                  <Badge tone="accent" size="sm" icon="star">
                    {t('training.recommended')}
                  </Badge>
                ) : null}
              </div>
              <span className="text-sm font-semibold">{t(DIFFICULTY_LABEL[o.choice])}</span>
              <span className="tabular text-xl font-bold leading-none">
                {t('app.nodeDuration', { min: Math.max(1, Math.round(o.durationSec / 60)) })}
              </span>
              <span className="tabular text-xs text-muted">
                {t('app.nodePoints', { n: o.points })} · {t('app.nodeKcal', { n: o.calories })}
              </span>
            </Card>
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
