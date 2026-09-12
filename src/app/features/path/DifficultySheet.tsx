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
 *
 * **The three rows have to look different, and for a while they did not.** They were described by
 * minutes and calories, and those barely move: easier drops a whole set but shortens the rest to
 * match, so a third less work still came out at thirteen minutes and thirty-one kcal. Three
 * identical-looking rows are not a choice, they are a coin toss with extra steps. What moves is the
 * *work* — «Полегче» is ninety squats where «Посложнее» is a hundred and forty — so that is what
 * each row says, over a bar drawn to the same scale for all three. The difference is now visible
 * before it is read.
 */
import { clsx } from 'clsx';
import { Badge } from '@/components/ui/Badge';
import { Glyph } from '@/components/ui/Icon';
import { Sheet } from '@/components/ui/Sheet';
import { Spinner } from '@/components/ui/Spinner';
import { formatNumber, plural } from '@/i18n/index';
import { useT } from '@/app/hooks/useT';
import type { DifficultyChoice, Recommendation } from '@/lib/training/types';
import { DIFFICULTY_LABEL } from './plan';

/** One difficulty and what choosing it asks for: how much work, how long, what it is worth. */
export interface DifficultyOption {
  choice: DifficultyChoice;
  durationSec: number;
  points: number;
  calories: number;
  /** Repetitions prescribed across the session; 0 for a workout made only of timed work. */
  reps: number;
  /** Seconds of prescribed work, rest excluded — what the bar is drawn from. */
  workSec: number;
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
  const { t, l, locale } = useT();
  const busy = pending !== null;

  /*
   * The bar measures the same thing the line under it states — reps where there are reps, working
   * seconds for a session made only of timed work — so the picture and the number can never
   * disagree. It runs from zero against the heaviest option, which means two choices that really
   * are close draw as two bars that really are close. That is the answer to "what is the
   * difference", including the days when the honest answer is "not much".
   */
  const byReps = options.every((o) => o.reps > 0);
  const amount = (o: DifficultyOption) => (byReps ? o.reps : o.workSec);
  const heaviest = Math.max(1, ...options.map(amount));
  const share = (o: DifficultyOption) => amount(o) / heaviest;

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
                <span className="flex min-w-0 flex-1 flex-col gap-2">
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

                  {/*
                   * How much work, as a length. The recommended row is the one in the programme
                   * colour; the others are the same bar in the quiet grey, so the eye compares
                   * lengths instead of colours.
                   */}
                  <span aria-hidden="true" className="block h-[3px] w-full bg-surface-3">
                    <span
                      className={clsx(
                        'block h-full transition-[width] duration-300 ease-(--ease-out)',
                        // White, not the programme colour: a Sheet is portalled to <body>, so the
                        // `--course-tile` scope on the screen below does not reach it and
                        // `bg-course` would fall back to a near-black neutral on a near-black row.
                        isRecommended ? 'bg-primary' : 'bg-muted-2',
                      )}
                      style={{ width: `${Math.round(share(o) * 100)}%` }}
                    />
                  </span>

                  <span className="tabular text-xs text-muted">
                    {/* Reps first: it is the number that actually moves between the three. */}
                    {o.reps > 0
                      ? plural(locale, o.reps, {
                          one: t('app.nodeRepsOne', { n: formatNumber(locale, o.reps) }),
                          few: t('app.nodeRepsFew', { n: formatNumber(locale, o.reps) }),
                          many: t('app.nodeRepsMany', { n: formatNumber(locale, o.reps) }),
                        })
                      : t('app.nodeWorkMin', {
                          min: Math.max(1, Math.round(o.workSec / 60)),
                        })}{' '}
                    · {t('app.nodeDuration', { min: Math.max(1, Math.round(o.durationSec / 60)) })}{' '}
                    · {t('app.nodePoints', { n: o.points })}
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
