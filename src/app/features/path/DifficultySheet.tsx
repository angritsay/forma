/**
 * «Насколько тяжело сегодня?» — the one question between pressing Start and warming up.
 *
 * It used to be a section halfway down the preview screen: three radio rows you set, and then
 * scrolled past, and then pressed a button that was somewhere else entirely. Nobody chooses a
 * difficulty and then reads a plan — they press Start, and *then* the question is worth asking,
 * because it is the last thing standing between them and the first movement.
 *
 * So there is no confirm button here. Each row is the action: tapping «Полегче» starts the session
 * at «Полегче». One decision, one tap, and the warm-up is already playing.
 */
import { clsx } from 'clsx';
import { Badge } from '@/components/ui/Badge';
import { Glyph } from '@/components/ui/Icon';
import { Sheet } from '@/components/ui/Sheet';
import { Spinner } from '@/components/ui/Spinner';
import { useT } from '@/app/hooks/useT';
import type { DifficultyChoice, Recommendation } from '@/lib/training/types';
import { DIFFICULTY_LABEL } from './plan';

/** One difficulty and what choosing it costs: how long, how many points, how many kcal. */
export interface DifficultyOption {
  choice: DifficultyChoice;
  durationSec: number;
  points: number;
  calories: number;
}

export interface DifficultySheetProps {
  open: boolean;
  onClose: () => void;
  options: readonly DifficultyOption[];
  recommended: Recommendation;
  /** The choice being started, while the session is being opened on the server. */
  pending: DifficultyChoice | null;
  onPick: (choice: DifficultyChoice) => void;
}

export function DifficultySheet({
  open,
  onClose,
  options,
  recommended,
  pending,
  onPick,
}: DifficultySheetProps) {
  const { t, l } = useT();
  const busy = pending !== null;

  return (
    <Sheet open={open} onClose={onClose} title={t('app.nodeDifficultyTitle')}>
      <div className="flex flex-col gap-3">
        <div className="flex flex-col">
          {options.map((o) => {
            const isRecommended = o.choice === recommended.choice;
            const starting = pending === o.choice;
            return (
              <button
                key={o.choice}
                type="button"
                disabled={busy}
                onClick={() => onPick(o.choice)}
                className={clsx(
                  'flex w-full items-center gap-3.5 border-t border-border py-4 text-left first:border-t-0',
                  'transition-colors duration-150 ease-(--ease-out) hover:bg-surface-2 active:bg-surface-3',
                  busy && !starting && 'opacity-40',
                )}
              >
                <span className="flex min-w-0 flex-1 flex-col gap-1">
                  <span className="flex flex-wrap items-center gap-2">
                    <span className="text-[17px] font-semibold">
                      {t(DIFFICULTY_LABEL[o.choice])}
                    </span>
                    {isRecommended ? (
                      <Badge tone="neutral" size="sm">
                        {t('training.recommended')}
                      </Badge>
                    ) : null}
                  </span>
                  <span className="tabular text-xs text-muted">
                    {t('app.nodeDuration', { min: Math.max(1, Math.round(o.durationSec / 60)) })} ·{' '}
                    {t('app.nodePoints', { n: o.points })} · {t('app.nodeKcal', { n: o.calories })}
                  </span>
                </span>
                {/* The arrow says this row *is* the start button; a spinner replaces it while it is. */}
                {starting ? (
                  <Spinner size={16} />
                ) : (
                  <Glyph size={16} className="shrink-0 text-muted-2">
                    →
                  </Glyph>
                )}
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
    </Sheet>
  );
}
